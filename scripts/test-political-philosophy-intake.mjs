// Regression test for Political Philosophy foundations intake:
// audits the 12 Tier 3 bank-ready rules and their 28 candidate bank items.

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const readJson = async file => JSON.parse(await readFile(new URL(file, root), 'utf8'));

const current = await readJson('data/current.json');
const [audit, bank, model, depth] = await Promise.all([
  readJson(current.pilotEvidenceAudit.path),
  readJson(current.candidateBank.path),
  readJson(current.worldviewModel.path),
  readJson(current.progressiveDepth.path)
]);

const fullRoute = depth.routes.find(r => r.id === 'full');
const fullItemIds = new Set(fullRoute.itemRefs.map(r => r.itemId));

// 1. Audit Tier 3 Political Philosophy gaps
const plTier3Gaps = audit.fullRouteGaps.filter(
  g => g.domainId === 'PL' && g.rankingTier === 'tier_3_bank_ready_route_admission'
);
assert.equal(plTier3Gaps.length, 12, 'Must have exactly 12 Tier 3 political philosophy gaps');

const expectedRuleIds = [
  'construct-PL27',
  'construct-PL28',
  'construct-PL29',
  'construct-PL32',
  'nondomination',
  'noninterference',
  'ph-democratic-authorization',
  'ph-desert-punishment',
  'ph-national-obligations',
  'ph-religious-public-law',
  'procedural-justice',
  'substantive-justice'
];
assert.deepEqual(
  plTier3Gaps.map(g => g.ruleId).sort(),
  expectedRuleIds.sort(),
  'Must match the exact 12 political philosophy Tier 3 rules'
);

// 2. Candidate items audit (28 items)
const itemsToCheck = [
  'PLI100', 'PLI101', 'PLI102',
  'PLI103', 'PLI104', 'PLI105',
  'PLI106', 'PLI107', 'PLI108',
  'PLI115', 'PLI116', 'PLI117',
  'PLI010', 'PLI057',
  'PLI007', 'PLI051',
  'PLI006', 'PLI027',
  'PLI017', 'PLI064',
  'PLI021', 'PLI068',
  'PLI023', 'PLI070',
  'PLI015', 'PLI062',
  'PLI016', 'PLI063'
];
assert.equal(new Set(itemsToCheck).size, 28, 'Must verify 28 distinct candidate items');

const bankItemMap = new Map(bank.items.map(i => [i.id, i]));
const scenarioGroups = new Set();

for (const itemId of itemsToCheck) {
  const item = bankItemMap.get(itemId);
  assert.ok(item, `Candidate item ${itemId} must exist in bank`);
  assert.equal(item.revision, 1, `Candidate item ${itemId} must be at revision 1`);

  // Word count constraint: must be <= 45 words ceiling, and <= 32 words warning
  const text = item.text ?? item.prompt ?? '';
  const wordCount = text.trim().split(/\s+/).length;
  assert.ok(wordCount <= 45, `Item ${itemId} stem exceeds 45-word ceiling (${wordCount} words)`);
  assert.ok(wordCount <= 32, `Item ${itemId} stem exceeds 32-word warning limit (${wordCount} words)`);

  // Route isolation invariant: none of these 28 items may currently be on Full route
  assert.ok(!fullItemIds.has(itemId), `Item ${itemId} must NOT be on Full route yet`);

  if (item.scenarioGroup) {
    scenarioGroups.add(item.scenarioGroup);
  }
}

// 3. Scenario groups uniqueness: all 7 vignettes must use distinct scenario groups
assert.equal(scenarioGroups.size, 7, 'All 7 vignette scenario groups must be distinct');
for (const sg of ['PL-S04', 'PL-S08', 'PL-S10', 'PL-S11', 'PL-S12', 'PL-S15', 'PL-S17']) {
  assert.ok(scenarioGroups.has(sg), `Scenario group ${sg} must be present`);
}

// 4. Directional contract completeness: all 12 rules must have >=2 support and >=2 oppose
for (const gap of plTier3Gaps) {
  const rule = model.commitments.find(r => r.id === gap.ruleId);
  assert.ok(rule, `Rule ${gap.ruleId} must exist in active model`);
  assert.ok(gap.bankEvidenceUnits.support >= 2, `Rule ${gap.ruleId} must have >= 2 bank support units`);
  assert.ok(gap.bankEvidenceUnits.oppose >= 2, `Rule ${gap.ruleId} must have >= 2 bank oppose units`);

  // Full route status invariant
  assert.ok(!fullRoute.assessableDirectRuleIds.includes(gap.ruleId),
    `Rule ${gap.ruleId} must remain not_measured on Full route until officially admitted`);
}

console.log('Political philosophy intake regressions passed: 12 Tier 3 rules and 28 candidate items verified with clean lint and route isolation.');
