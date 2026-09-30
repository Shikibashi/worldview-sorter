import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const [bank, policy, model, draft, proposals, sources, routeProposal, scales] = await Promise.all([
  read('data/items/candidate-v0.9.json'),
  read('data/experience/progressive-depth-v1.1.json'),
  read('data/generic/model-v1.1-pilot.json'),
  read('data/items/dimension-gap-draft-v1.json'),
  read('data/registries/dimension-gap-proposals-v1.json'),
  read('data/items/dimension-gap-sources-v1.json'),
  read('data/reviews/dimension-route-proposal-v1.json'),
  read('data/response-scales.json')
]);

const dimensions = [
  ['structure', 'Federal', 'Constitutionally divided authority', ['PL05'], ['PL34'], 'partial', 'Decentralization is asked, but entrenched federal authority is not.'],
  ['representation', 'Democracy', 'Democratic authorization of political rule', ['PL04'], [], 'direct_bank_only', 'Three relevant bank items are absent from every current public route.'],
  ['power', 'Liberty', 'Noninterference and political liberty', ['PL06'], [], 'direct_bank_only', 'The direct noninterference rule is not assessable on public routes; liberty has other meanings too.'],
  ['immigration', 'Multiculturalism', 'Cultural accommodation and migration claims, separately', ['SO04'], ['SO16', 'PL35'], 'partial_bank_only', 'Bank tolerance items are off-route; neither public accommodation nor immigration can be inferred.'],
  ['diplomacy', 'Pacifist', 'Permissibility of defensive armed force', [], ['PL36'], 'absent', 'Foreign concern is not pacifism.'],
  ['intervention', 'Nationalist', 'Humanitarian versus interest-driven intervention', ['PL23'], ['PL37'], 'adjacent_only', 'National obligation is not a position on foreign military intervention.'],
  ['economy', 'Private', 'Ownership and preinstitutional rights', ['PL12', 'PL27'], [], 'direct_bank_only', 'Ownership and rights are distinct; their existing items are absent from public routes.'],
  ['control', 'Free market', 'Markets as a coordination mechanism', ['PL13'], [], 'partial', 'Two route items address coordination, not a complete laissez-faire political economy.'],
  ['trade', 'Globalism', 'Cross-border exchange restrictions', ['PL13', 'PL22'], ['PL38'], 'adjacent_only', 'Domestic market coordination and concern for foreigners do not determine trade policy.'],
  ['religion', 'Irreligious', 'Deity belief, religious priority and public religious authority', ['RC01', 'RC10', 'PL26'], [], 'partial', 'These are distinct propositions; nonbelief alone does not determine public-law or naturalist views.'],
  ['morality', 'Progressive', 'Tradition, reform and moral-social change', ['VA11', 'PL25'], ['SO17'], 'adjacent_only', 'Personal tradition and institutional reform are not a general progressive identity.'],
  ['technology', 'Technology', 'Deployment risk and human enhancement, separately', [], ['VA22', 'MS08'], 'absent', 'The current bank offers no direct technology outlook items.']
];

assert.equal(bank.items.length, 562);
assert.deepEqual(policy.routes.map(route => route.size), [64, 120, 238]);
assert.equal(dimensions.length, 12);
const bankIds = new Set(bank.items.map(item => item.id));
const draftIds = new Set(draft.items.map(item => item.id));
const proposedTargets = new Set(proposals.constructs.map(item => item.id));
const proposedTargetById = new Map(proposals.constructs.map(item => [item.id, item]));
const sourceIds = new Set(sources.sources.map(source => source.id));
const scaleById = new Map(scales.scales.map(scale => [scale.id, scale]));
const allowedDraftMeanings = new Set(['supports', 'opposes', 'neighbor', 'context', 'missing', 'non_entailing']);
assert.equal(draftIds.size, draft.items.length);
for (const item of draft.items) {
  assert.ok(!bankIds.has(item.id), `${item.id} conflicts with current bank`);
  assert.ok(item.targets.every(target => proposedTargets.has(target.constructId)), `${item.id} has no target proposal`);
  assert.ok(item.provenance.sourceRefs.every(id => sourceIds.has(id)), `${item.id} has no source claim`);
  assert.equal(scaleById.get(item.responseScaleId)?.responseType, item.responseType);
  assert.equal(item.options.length, Object.keys(item.draftAnswerMeanings).length);
  assert.ok(item.options.every(option => option.id in item.draftAnswerMeanings));
  assert.ok(Object.values(item.draftAnswerMeanings).every(meaning => allowedDraftMeanings.has(meaning)));
  if (item.targets[0].role === 'primary' && proposedTargetById.get(item.targets[0].constructId).kind === 'item_target') {
    assert.ok(Object.values(item.draftAnswerMeanings).includes('supports'), `${item.id} lacks direct supporting meaning`);
    assert.ok(Object.values(item.draftAnswerMeanings).includes('opposes'), `${item.id} lacks direct opposing meaning`);
  }
  assert.ok(!policy.routes.some(route => route.itemRefs.some(ref => ref.itemId === item.id)), `${item.id} leaked into a public route`);
}
assert.equal(routeProposal.basePolicyVersion, policy.policyVersion);
assert.equal(routeProposal.baseBankVersion, bank.bankVersion);
const proposedExistingIds = new Set();
for (const group of routeProposal.proposedExistingGroups) {
  assert.ok(model.publicRuleIds.includes(group.ruleId), `${group.ruleId} is not a public rule`);
  for (const ref of group.itemRefs) {
    assert.ok(!proposedExistingIds.has(ref.itemId), `duplicate proposed route item ${ref.itemId}`);
    proposedExistingIds.add(ref.itemId);
    assert.ok(bank.items.some(item => item.id === ref.itemId && item.revision === ref.itemRevision));
    assert.ok(!policy.routes.at(-1).itemRefs.some(item => item.itemId === ref.itemId));
  }
}
assert.equal(routeProposal.proposedSizesIfAllApproved.standard,
  policy.routes[1].size + routeProposal.proposedExistingGroups.filter(group => group.placement === 'standard_successor').flatMap(group => group.itemRefs).length);
assert.equal(routeProposal.proposedSizesIfAllApproved.full, policy.routes[2].size + proposedExistingIds.size);
assert.deepEqual(routeProposal.potentialFutureQuestionRefs.map(ref => ref.itemId), draft.items.map(item => item.id));

const report = {
  schemaVersion: 'dimension-content-review-1',
  reviewVersion: '1.0.0',
  status: 'editorial_review_not_scoring_or_release',
  reference: 'User-supplied 12axes result images; only displayed dimension labels were used. No questions or scoring code were copied.',
  candidateBankVersion: bank.bankVersion,
  routePolicyVersion: policy.policyVersion,
  modelVersion: model.modelVersion,
  currentItemCount: bank.items.length,
  draftItemCount: draft.items.length,
  routes: policy.routes.map(route => ({id: route.id, version: route.routeVersion, itemCount: route.size})),
  dimensions: dimensions.map(([id, referenceLabel, target, nearestIds, gapIds, relationship, limitation]) => {
    for (const proposedId of gapIds) assert.ok(proposedTargets.has(proposedId));
    const existingItems = bank.items.filter(item => item.targets?.some(t => nearestIds.includes(t.constructId) && t.role === 'primary'));
    const draftItems = draft.items.filter(item => item.targets.some(t => gapIds.includes(t.constructId)));
    const relatedRules = model.commitments.filter(rule => nearestIds.includes(rule.constructId) && model.publicRuleIds.includes(rule.id));
    return {
      id, referenceLabel, worldviewTarget: target, existingRelationship: relationship,
      nearestExistingConstructIds: nearestIds,
      existingPrimaryItemRefs: existingItems.map(item => `${item.id}@${item.revision}`),
      proposedTargetIds: gapIds,
      unreleasedDraftItemRefs: draftItems.map(item => `${item.id}@${item.revision}`),
      publicRuleIds: relatedRules.map(rule => rule.id),
      publicRoutes: policy.routes.map(route => ({
        routeId: route.id,
        shownExistingItemRefs: existingItems.filter(item => route.itemRefs.some(ref => ref.itemId === item.id && ref.itemRevision === item.revision)).map(item => `${item.id}@${item.revision}`),
        assessableRelatedRuleIds: relatedRules.filter(rule => route.assessableDirectRuleIds.includes(rule.id)).map(rule => rule.id)
      })),
      limitation
    };
  })
};
const outputPath = new URL('data/reviews/dimension-coverage-v1.json', root);
if (process.argv.includes('--check')) {
  assert.deepEqual(JSON.parse(await readFile(outputPath, 'utf8')), report,
    'The checked-in dimension coverage report is stale; regenerate it.');
} else {
  await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n');
}
console.log(`Reviewed ${report.dimensions.length} displayed dimensions against ${bank.items.length} existing and ${draft.items.length} new draft items.`);
