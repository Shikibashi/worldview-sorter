// Behavior regressions for the legal-validity propositions in model release 1.21.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {compareWorldview} from '../packages/worldview/index.js';
import {verifyEngineSource} from '../packages/governance/engine-source.js';
import {currentFromManifest, loadSnapshot} from '../packages/governance/release.js';

const root = new URL('../', import.meta.url);
const rootPath = fileURLToPath(root);
const readJson = async file => JSON.parse(await readFile(new URL(file, root), 'utf8'));
const snapshotFor = async manifest => {
  const references = currentFromManifest(manifest);
  return {...await loadSnapshot(rootPath, references), references};
};
const item = (bank, id) => bank.items.find(row => row.id === id);
const rule = (model, id) => model.commitments.find(row => row.id === id);
const result = (report, id) => report.commitments.find(row => row.commitmentId === id);

function inputFor(snapshot, routeId, answers) {
  const route = snapshot.routes.routes.find(row => row.id === routeId);
  assert.ok(route, `Unknown route ${routeId}`);
  const routeRefs = new Map(route.itemRefs.map(ref => [ref.itemId, ref]));
  // Pilot evidence availability follows route assignment and branch skipping;
  // an unanswered assigned item remains available even with presented:false.
  return {
    pilotId: snapshot.routes.administrationId,
    bankVersion: snapshot.bank.bankVersion,
    instrumentVersion: snapshot.routes.instrumentVersion,
    presentedItems: route.itemRefs.map(ref => ({
      ...ref,
      presented: Object.hasOwn(answers, ref.itemId),
      skippedByBranch: false
    })),
    responses: Object.entries(answers).map(([itemId, value]) => {
      const ref = routeRefs.get(itemId);
      assert.ok(ref, `${itemId} is not assigned to ${routeId}`);
      return {...ref, state: value === null ? 'no_view' : 'answered', value};
    })
  };
}

function reportFor(snapshot, answers, routeId = 'full', compare = compareWorldview) {
  return compare({
    model: snapshot.model,
    bank: snapshot.bank,
    scalesDoc: snapshot.scalesDoc,
    input: inputFor(snapshot, routeId, answers),
    routeManifest: snapshot.routes
  });
}

async function archivedCompareFor(snapshot) {
  const engineSource = snapshot.references.engineSource;
  assert.ok(engineSource, 'Historical release must pin its inference engine');
  await verifyEngineSource(rootPath, engineSource, {checkLive: true});
  const archivedModule = new URL(
    `data/releases/engine-sources/${engineSource.version}/packages/worldview/index.js`,
    root
  );
  return (await import(archivedModule.href)).compareWorldview;
}

const current = await readJson('data/current.json');
const release = await readJson(current.modelRelease.path);
assert.equal(release.releaseVersion, 'model-release-1.21.0');
const active = await snapshotFor(release);
const {model, bank, routes} = active;
for (const id of ['PLI072', 'PLI128']) {
  assert.equal(active.contentReview.decisions.find(row => row.itemId === id)?.decision, 'retain_for_pilot');
}
for (const [id, mappedRule, neighbor] of [
  ['PLI071', 'source-based-validity', 'PLI128'],
  ['PLI128', 'source-based-validity', 'PLI071'],
  ['PLI072', 'moral-limits-validity', 'PLI073'],
  ['PLI073', 'moral-limits-validity', 'PLI072']
]) {
  const decision = active.contentReview.decisions.find(row => row.itemId === id);
  assert.deepEqual(decision.mappedRuleIds, [mappedRule]);
  assert.deepEqual(decision.nearbyRouteItemIds, [neighbor]);
}
const pilotRules = active.pilotManifest.interpretationRules;
assert.ok(pilotRules.routeMeasuredDirectRuleIds.includes('moral-limits-validity'));
assert.ok(pilotRules.routeMeasuredDirectRuleIds.every(id =>
  !pilotRules.routeNotMeasuredDirectRuleIds.includes(id)));

const fullRoute = routes.routes.find(row => row.id === 'full');
assert.ok(fullRoute);
assert.equal(bank.items.length, 578, 'Successor bank contains 578 items');
assert.equal(fullRoute.size, 253, 'Full route contains 253 frozen item revisions');
assert.equal(fullRoute.itemRefs.length, 253);
assert.equal(fullRoute.assessableDirectRuleIds.length, 99,
  'Full route measures 99 direct rules');
assert.ok(fullRoute.assessableDirectRuleIds.includes('moral-limits-validity'));

for (const [id, revision] of [['PLI071', 1], ['PLI072', 2], ['PLI073', 2], ['PLI128', 1]]) {
  assert.equal(item(bank, id)?.revision, revision, `${id} revision is frozen in the successor bank`);
  assert.ok(fullRoute.itemRefs.some(ref => ref.itemId === id && ref.itemRevision === revision),
    `${id}@${revision} is assigned to Full`);
}

const moralLimitsRule = rule(model, 'moral-limits-validity');
const sourceBasedRule = rule(model, 'source-based-validity');
assert.ok(moralLimitsRule);
assert.ok(sourceBasedRule);
assert.equal(moralLimitsRule.minimumEvidenceUnits, 2);
assert.equal(sourceBasedRule.minimumEvidenceUnits, 2);
assert.deepEqual(moralLimitsRule.evidence.map(({itemId, itemRevision, support, oppose}) =>
  ({itemId, itemRevision, support, oppose})), [
  {itemId: 'PLI072', itemRevision: 2, support: [1, 2], oppose: [-2, -1]},
  {itemId: 'PLI073', itemRevision: 2, support: ['not_law'], oppose: ['valid_but_unjust']}
]);
assert.ok(!moralLimitsRule.evidence.some(evidence => evidence.itemId === 'PLI014'),
  'The prior audit typo PLI014 is not legal-validity evidence');
assert.ok(!moralLimitsRule.evidence.some(evidence =>
  evidence.itemId === 'PLI073' && [...evidence.support, ...evidence.oppose]
    .some(value => ['defective_law', 'depends'].includes(value))),
'defective_law and depends are nondirectional for extreme injustice');

assert.equal(sourceBasedRule.proposition, 'An immoral law can remain legally valid.');
assert.deepEqual(sourceBasedRule.evidence.map(({itemId, itemRevision, support, oppose}) =>
  ({itemId, itemRevision, support, oppose})), [
  {itemId: 'PLI071', itemRevision: 1, support: [1, 2], oppose: [-2, -1]},
  {itemId: 'PLI128', itemRevision: 1, support: ['valid_but_unjust'], oppose: ['not_law']}
]);
assert.ok(!sourceBasedRule.evidence.some(evidence => evidence.itemId === 'PLI073'),
  'Extreme-injustice responses on PLI073 are not source-based-validity evidence');

// Two distinct supportive/oppose units are required for a conclusive direction.
const positive = reportFor(active, {PLI072: 2, PLI073: 'not_law'});
assert.equal(result(positive, 'moral-limits-validity').state, 'supported');
assert.equal(result(positive, 'moral-limits-validity').supportingUnits, 2);
const negative = reportFor(active, {PLI072: -2, PLI073: 'valid_but_unjust'});
assert.equal(result(negative, 'moral-limits-validity').state, 'opposed');
assert.equal(result(negative, 'moral-limits-validity').opposingUnits, 2);
const mixed = reportFor(active, {PLI072: 2, PLI073: 'valid_but_unjust'});
assert.equal(result(mixed, 'moral-limits-validity').state, 'mixed_context_dependent');

const absent = reportFor(active, {});
assert.equal(result(absent, 'moral-limits-validity').state, 'insufficient_evidence');
const noView = reportFor(active, {PLI072: null, PLI073: null});
assert.equal(result(noView, 'moral-limits-validity').state, 'insufficient_evidence');
const oneUnit = reportFor(active, {PLI072: 2});
assert.equal(result(oneUnit, 'moral-limits-validity').state, 'leaned_toward');
assert.equal(result(oneUnit, 'moral-limits-validity').supportingUnits, 1);

const sourcePositive = reportFor(active, {PLI071: 2, PLI128: 'valid_but_unjust'});
assert.equal(result(sourcePositive, 'source-based-validity').state, 'supported');
const sourceNegative = reportFor(active, {PLI071: -2, PLI128: 'not_law'});
assert.equal(result(sourceNegative, 'source-based-validity').state, 'opposed');
const sourceMixed = reportFor(active, {PLI071: 2, PLI128: 'not_law'});
assert.equal(result(sourceMixed, 'source-based-validity').state, 'mixed_context_dependent');
const sourceMissing = reportFor(active, {});
assert.equal(result(sourceMissing, 'source-based-validity').state, 'insufficient_evidence');
const sourceNoView = reportFor(active, {PLI071: null, PLI128: null});
assert.equal(result(sourceNoView, 'source-based-validity').state, 'insufficient_evidence');
const sourceOneUnit = reportFor(active, {PLI071: 2});
assert.equal(result(sourceOneUnit, 'source-based-validity').state, 'leaned_toward');

for (const measuredReport of [positive, negative, mixed, absent, noView, oneUnit,
  sourcePositive, sourceNegative, sourceMixed, sourceMissing, sourceNoView, sourceOneUnit]) {
  for (const id of ['moral-limits-validity', 'source-based-validity']) {
    const row = result(measuredReport, id);
    assert.equal(row.minimumEvidenceUnits, 2);
    assert.equal(row.availableSupportUnits, 2);
    assert.equal(row.availableOpposeUnits, 2);
  }
}

// Inclusive and exclusive positivist response patterns remain distinct from the threshold claim.
const inclusive = reportFor(active, {
  PLI071: 2, PLI072: -2, PLI073: 'depends', PLI128: 'valid_but_unjust'
});
assert.equal(result(inclusive, 'source-based-validity').state, 'supported');
assert.equal(result(inclusive, 'moral-limits-validity').state, 'leaned_toward');
assert.equal(result(inclusive, 'moral-limits-validity').leanDirection, 'oppose');

const exclusive = reportFor(active, {
  PLI071: 2, PLI072: -2, PLI073: 'valid_but_unjust', PLI128: 'valid_but_unjust'
});
assert.equal(result(exclusive, 'source-based-validity').state, 'supported');
assert.equal(result(exclusive, 'moral-limits-validity').state, 'opposed');

// Radbruch-style threshold acceptance coexists with ordinary immoral-law validity.
const radbruch = reportFor(active, {
  PLI071: 2, PLI072: 2, PLI073: 'not_law', PLI128: 'valid_but_unjust'
});
assert.equal(result(radbruch, 'moral-limits-validity').state, 'supported');
assert.equal(result(radbruch, 'source-based-validity').state, 'supported');

// Finnis's defective-law answer is explicitly non-directional, not invalidity evidence.
const finnis = reportFor(active, {
  PLI071: 2, PLI073: 'defective_law', PLI128: 'valid_but_unjust'
});
assert.equal(result(finnis, 'moral-limits-validity').state, 'insufficient_evidence');
assert.equal(result(finnis, 'moral-limits-validity').supportingUnits, 0);
assert.equal(result(finnis, 'moral-limits-validity').opposingUnits, 0);
assert.equal(result(finnis, 'moral-limits-validity').observations.find(row =>
  row.itemId === 'PLI073').state, 'qualified_or_non_directional');
assert.equal(result(finnis, 'source-based-validity').state, 'supported');
for (const option of ['defective_law', 'depends']) {
  const nondirectional = reportFor(active, {PLI073: option, PLI128: option});
  for (const id of ['moral-limits-validity', 'source-based-validity']) {
    assert.equal(result(nondirectional, id).state, 'insufficient_evidence');
    assert.equal(result(nondirectional, id).supportingUnits, 0);
    assert.equal(result(nondirectional, id).opposingUnits, 0);
  }
}

for (const measuredReport of [inclusive, exclusive, radbruch, finnis]) {
  for (const id of ['moral-limits-validity', 'source-based-validity']) {
    const row = result(measuredReport, id);
    assert.equal(row.minimumEvidenceUnits, 2);
    assert.equal(row.availableSupportUnits, 2);
    assert.equal(row.availableOpposeUnits, 2);
  }
}

// Replay the exact immutable 1.20 model, bank, Full route, response revisions, and
// archived engine. Its Full route does not assign PLI072, so that proposition remains
// not_measured; the historical source-based rule still uses PLI071@1 and PLI073@1.
const release120 = await readJson('data/releases/model-release-v1.20.0.json');
const historical120 = await snapshotFor(release120);
assert.equal(release120.releaseVersion, 'model-release-1.20.0');
assert.equal(historical120.model.modelVersion, 'generic-1.17.0-pilot');
assert.equal(historical120.bank.bankVersion, '0.20.0');
assert.equal(item(historical120.bank, 'PLI073').revision, 1);
assert.equal(historical120.references.worldviewModel.path, 'data/generic/model-v1.17-pilot.json');
assert.equal(historical120.references.candidateBank.path, 'data/items/candidate-v0.20.json');
assert.equal(historical120.references.progressiveDepth.path, 'data/experience/progressive-depth-v2.8.json');
const historicalFull = historical120.routes.routes.find(row => row.id === 'full');
assert.ok(historicalFull);
assert.ok(historicalFull.itemRefs.some(ref => ref.itemId === 'PLI071' && ref.itemRevision === 1));
assert.ok(historicalFull.itemRefs.some(ref => ref.itemId === 'PLI073' && ref.itemRevision === 1));
assert.deepEqual(historicalFull.itemRefs.filter(ref =>
  ['PLI071', 'PLI072', 'PLI073', 'PLI128'].includes(ref.itemId)).map(ref =>
  [ref.itemId, ref.itemRevision]).sort(([left], [right]) => left.localeCompare(right)),
[['PLI071', 1], ['PLI073', 1]],
'The frozen 1.20 Full route includes PLI071@1 and PLI073@1, but excludes PLI072 and PLI128');
assert.deepEqual(rule(historical120.model, 'moral-limits-validity').evidence.map(evidence =>
  [evidence.itemId, evidence.itemRevision]), [['PLI072', 1], ['PLI073', 1]]);
assert.deepEqual(rule(historical120.model, 'source-based-validity').evidence.map(evidence =>
  [evidence.itemId, evidence.itemRevision]), [['PLI071', 1], ['PLI073', 1]]);
const historical120Input = inputFor(historical120, 'full', {
  PLI071: 2, PLI073: 'not_law'
});
assert.equal(historical120Input.responses.find(response => response.itemId === 'PLI073').itemRevision, 1,
  'Replay uses the PLI073 revision actually recorded in the frozen 1.20 Full route');
assert.deepEqual(historical120Input.responses.map(response => [response.itemId, response.itemRevision])
  .sort(([left], [right]) => left.localeCompare(right)), [['PLI071', 1], ['PLI073', 1]]);
const historical120Compare = await archivedCompareFor(historical120);
const historical120Report = reportFor(historical120, {
  PLI071: 2, PLI073: 'not_law'
}, 'full', historical120Compare);
assert.equal(result(historical120Report, 'moral-limits-validity').state, 'not_measured');
assert.equal(result(historical120Report, 'moral-limits-validity').availableSupportUnits, 1);
assert.equal(result(historical120Report, 'moral-limits-validity').availableOpposeUnits, 1);
assert.equal(result(historical120Report, 'source-based-validity').state, 'mixed_context_dependent');

const oldResponse = inputFor(active, 'full', {PLI073: 'not_law'});
oldResponse.responses[0].itemRevision = 1;
assert.throws(() => compareWorldview({
  model,
  bank,
  scalesDoc: active.scalesDoc,
  input: oldResponse,
  routeManifest: routes
}), /Unknown\/stale raw item PLI073/,
'Successor inference rejects a response recorded against retired PLI073@1');

console.log('Legal validity regressions passed: successor contract, direct scoring semantics, and archived 1.20 replay.');
