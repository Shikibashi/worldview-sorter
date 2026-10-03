import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filterTraditions, inspectTradition, clarificationForTradition } from '../apps/quiz-react/src/tradition-explorer.js';

// Synthetic software fixtures, not validation of philosophical interpretations.
function fixture() {
  const criteria = [
    ['overlap', 'direct', 'supported', 'overlap'],
    ['divergence', 'direct', 'opposed', 'divergence'],
    ['mixed', 'direct', 'mixed_context_dependent', 'contradictory'],
    ['weak', 'direct', 'insufficient_evidence', 'unresolved'],
    ['omitted', 'direct', 'not_measured', 'unmeasured'],
    ['partial', 'partial', 'supported', 'partial'],
    ['derived', 'derived', 'insufficient_evidence', 'unresolved'],
    ['legacy', 'direct', 'supported', 'overlap'],
    ['unlinked', 'direct', 'supported', 'overlap'],
    ['no-row', 'direct', 'supported', 'overlap'],
    ['unsupported', 'not_measured', null, 'unmeasured']
  ].map(([id, status, observedState, finding]) => ({
    id, role: 'defining', doctrine: `Synthetic doctrine ${id}`, sourceIds: ['doctrine-source'], finding, observedState,
    mapping: { status, ...(status === 'not_measured' ? {} : { propositionId: `p-${id}`, expectedState: 'supported' }), note: `Mapping limit ${id}` }
  }));
  const rows = criteria.filter(c => c.mapping.propositionId && c.id !== 'no-row').map(c => ({
    id: c.mapping.propositionId, label: c.id, domainId: c.id === 'partial' ? 'EP' : 'NE',
    inferenceStatus: c.id === 'derived' ? 'derived' : 'direct', status: c.observedState,
    proposition: `Synthetic proposition ${c.id}`,
    presentationReview: { state: c.id === 'legacy' ? 'inherited_rule_scope' : c.id === 'unlinked' ? 'source_claim_unresolved' : 'eligible' },
    evidence: c.id === 'omitted' ? [] : [{ itemId: `item-${c.id}`, itemRevision: 1, answer: c.id === 'weak' ? 'No view' : 'Synthetic answer' }],
    sources: [{ id: 'rule-source', title: 'Interpretation source', url: 'https://example.org/rule' }]
  }));
  return {
    schemaVersion: 'quiz-summary-3', modelVersion: 'fixture-model', affinityCatalogVersion: 'fixture-catalog', rows,
    domains: [{ id: 'NE', title: 'Ethics' }, { id: 'EP', title: 'Knowledge' }],
    affinities: { traditions: [
      { id: 'alpha', name: 'École Alpha', context: 'Synthetic A', summaryState: 'overlap_with_unresolved_core', criteria,
        sources: [{ id: 'doctrine-source', title: 'Doctrine source', url: 'https://example.org/doctrine' }], nonEntailments: ['Not an identity.'] },
      { id: 'beta', name: 'Beta', context: 'Synthetic B', criteria: [], sources: [] }
    ] },
    affinityPresentation: { traditions: [{ traditionId: 'alpha', state: 'legacy_scope_unresolved' }] },
    referenceProfiles: [{ id: 'private-reference', name: 'Do not publish' }]
  };
}

const deepFreeze = value => {
  if (value && typeof value === 'object') { Object.freeze(value); Object.values(value).forEach(deepFreeze); }
  return value;
};

test('search uses only the public catalog, folds accents, and retains catalog order', () => {
  const summary = fixture();
  assert.deepEqual(filterTraditions(summary, '').map(t => t.id), ['alpha', 'beta']);
  assert.deepEqual(filterTraditions(summary, ' ECOLE ').map(t => t.id), ['alpha']);
  assert.deepEqual(filterTraditions(summary, 'do not publish'), []);
  assert.deepEqual(filterTraditions({}, ''), []);
});

test('selection is explicit; unknown and internal-only IDs produce no comparison', () => {
  for (const id of ['', 'missing', 'private-reference']) assert.equal(inspectTradition(fixture(), id), null);
});

test('each criterion retains its exact interpreted proposition and criterion-specific doctrine sources', () => {
  const summary = fixture();
  const view = inspectTradition(summary, 'alpha');
  assert.equal(view?.id, 'alpha');
  assert.equal(view.state, 'legacy_scope_unresolved');
  assert.equal(view.criteria.length, summary.affinities.traditions[0].criteria.length);
  const criterion = view.criteria.find(entry => entry.criterion.id === 'overlap');
  assert.equal(criterion.proposition.id, 'p-overlap');
  assert.equal(criterion.finding, 'overlap');
  assert.deepEqual(criterion.sources.map(s => s.id), ['doctrine-source']);
  assert.equal(criterion.proposition.sources[0].id, 'rule-source');
});

test('missing, mixed, no-view, and partial evidence are not promoted to overlap', () => {
  const view = inspectTradition(fixture(), 'alpha');
  assert.ok(view);
  const findings = Object.fromEntries(view.criteria.map(c => [c.criterion.id, c.finding]));
  assert.equal(findings.mixed, 'contradictory');
  assert.equal(findings.weak, 'unresolved');
  assert.equal(findings.omitted, 'unmeasured');
  assert.equal(findings.partial, 'partial');
  assert.equal(findings.unsupported, 'unmeasured');
  assert.equal(findings['no-row'], 'unavailable');
  assert.equal(findings.legacy, 'under_review');
  assert.equal(findings.unlinked, 'under_review');
});

test('gap domains require an exact eligible direct proposition with unresolved evidence', () => {
  const view = inspectTradition(fixture(), 'alpha');
  assert.deepEqual(view?.gapDomains, [{ id: 'NE', title: 'Ethics' }]);
  const summary = fixture();
  summary.rows.forEach(row => { row.status = 'supported'; });
  assert.deepEqual(inspectTradition(summary, 'alpha').gapDomains, []);
});

test('unmapped, partial, derived, and unreviewed doctrine cannot produce a follow-up promise', () => {
  const summary = fixture();
  summary.affinities.traditions[0].criteria = summary.affinities.traditions[0].criteria.filter(c =>
    ['partial', 'derived', 'legacy', 'unlinked', 'no-row', 'unsupported'].includes(c.id));
  assert.deepEqual(inspectTradition(summary, 'alpha')?.gapDomains, []);
});

test('a clarification offer requires a selected gap domain and a positive existing planner result', () => {
  const view = inspectTradition(fixture(), 'alpha');
  const depth = { available: true, domainId: 'NE', clarificationCount: 3, clarificationReason: 'Recorded evidence gap.' };
  assert.deepEqual(clarificationForTradition(view, depth, null), { domainId: 'NE', count: 3, reason: 'Recorded evidence gap.' });
  for (const patch of [{ available: false }, { domainId: 'EP' }, { domainId: '' }, { clarificationCount: 0 }, { clarificationCount: -1 }, { clarificationCount: NaN }]) {
    assert.equal(clarificationForTradition(view, { ...depth, ...patch }, null), null);
  }
  assert.equal(clarificationForTradition(view, depth, 'different_inference_code'), null);
  assert.equal(clarificationForTradition(null, depth, null), null);
});

test('duplicate mappings retain distinct criteria instead of overwriting a doctrine', () => {
  const summary = fixture();
  const first = summary.affinities.traditions[0].criteria[0];
  summary.affinities.traditions[0].criteria.push({ ...first, id: 'same-proposition-other-doctrine', doctrine: 'A separate criterion' });
  const view = inspectTradition(summary, 'alpha');
  assert.equal(view?.criteria.filter(c => c.proposition?.id === first.mapping.propositionId).length, 2);
});

test('exploration is read-only and adds no identity, percentage, ranking, or answer data', () => {
  const summary = deepFreeze(fixture());
  const before = JSON.stringify(summary);
  const view = inspectTradition(summary, 'alpha');
  assert.ok(view);
  filterTraditions(summary, 'alpha');
  clarificationForTradition(view, { available: true, domainId: 'NE', clarificationCount: 2 }, null);
  assert.equal(JSON.stringify(summary), before);
  for (const key of ['identity', 'score', 'percentage', 'matchPercent', 'ranking', 'responses']) assert.equal(key in view, false);
});

// Review qualification and evidence sufficiency are independent dimensions.
// Reverting the projection to replace every finding with under_review must fail.
test('review warnings preserve missing, mixed, insufficient, and partial findings', () => {
  const expected = { omitted: 'unmeasured', mixed: 'contradictory', weak: 'unresolved', partial: 'partial', derived: 'unresolved' };
  for (const state of ['inherited_rule_scope', 'source_claim_unresolved', undefined]) {
    const summary = fixture();
    summary.rows.forEach(row => { row.presentationReview = state ? { state } : undefined; });
    const before = JSON.stringify(summary);
    const view = inspectTradition(deepFreeze(summary), 'alpha');
    for (const [id, finding] of Object.entries(expected)) {
      const entry = view.criteria.find(candidate => candidate.criterion.id === id);
      assert.equal(entry.finding, finding, `${id}: ${state ?? 'absent review'} must not replace ${finding}`);
      assert.equal(entry.reviewRequired, true, `${id} must retain a separate review warning`);
    }
    assert.deepEqual(view.gapDomains, [], 'Preserved open findings must not bypass review eligibility');
    assert.equal(JSON.stringify(summary), before, 'Historical evidence must not be rewritten');
  }
});

test('unreviewed settled findings remain withheld instead of becoming measured claims', () => {
  for (const state of ['inherited_rule_scope', 'source_claim_unresolved', undefined]) {
    const summary = fixture();
    for (const id of ['p-overlap', 'p-divergence']) {
      summary.rows.find(row => row.id === id).presentationReview = state ? { state } : undefined;
    }
    const view = inspectTradition(summary, 'alpha');
    for (const id of ['overlap', 'divergence']) {
      const entry = view.criteria.find(candidate => candidate.criterion.id === id);
      assert.equal(entry.finding, 'under_review');
      assert.equal(entry.reviewRequired, true);
      assert.equal(entry.criterion.finding, id, 'Keep the original authored finding only in provenance');
    }
  }
});

test('eligible evidence and unavailable mappings do not acquire a fabricated review warning', () => {
  const view = inspectTradition(fixture(), 'alpha');
  for (const id of ['overlap', 'divergence', 'mixed', 'weak', 'omitted', 'partial', 'derived', 'no-row', 'unsupported']) {
    assert.equal(view.criteria.find(entry => entry.criterion.id === id).reviewRequired, false, id);
  }
});

test('an unknown finding remains unavailable even when its proposition awaits review', () => {
  const summary = fixture();
  summary.affinities.traditions[0].criteria[0].finding = 'unknown_future_finding';
  summary.rows[0].presentationReview = { state: 'source_claim_unresolved' };
  const entry = inspectTradition(summary, 'alpha').criteria[0];
  assert.equal(entry.finding, 'unavailable');
  assert.equal(entry.reviewRequired, true);
});
