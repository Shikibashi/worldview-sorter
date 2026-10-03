// Regression test for gap ranking: ensures content-review dispositions
// (removed, near_duplicate_local_dependence, semantic_redundancy) prevent
// excluded items from appearing as uncomplicated "route-near completion" candidates.

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {rankFullRouteGaps, evaluateItemContentReview} from '../packages/governance/gap-ranking.js';

const root = new URL('../', import.meta.url);
const readJson = async file => JSON.parse(await readFile(new URL(file, root), 'utf8'));

const current = await readJson('data/current.json');
const [dispositions, contentReview, bank] = await Promise.all([
  readJson(current.pilotEvidenceAudit.path),
  readJson(current.contentReview.path),
  readJson(current.candidateBank.path)
]);

// 1. Verify item-level content-review evaluation
const nei030Review = evaluateItemContentReview('NEI030', contentReview);
assert.equal(nei030Review.excluded, true, 'NEI030 must be evaluated as excluded');
assert.equal(nei030Review.decision, 'remove_from_pilot');
assert.equal(nei030Review.issue, 'near_duplicate_local_dependence');

const pli072Review = evaluateItemContentReview('PLI072', contentReview);
assert.equal(pli072Review.excluded, false, 'PLI072 must not be excluded');

// 2. Rank all 50 Full-route gaps
const result = rankFullRouteGaps({
  gaps: dispositions.fullRouteGaps,
  contentReview,
  bank
});

assert.equal(result.gaps.length, 50, 'Must rank all 50 Full-route gaps');
assert.deepEqual(result.tierCounts, {
  tier_1_route_near_completion_candidate: 1,
  tier_2_content_blocked_route_gap: 1,
  tier_3_bank_ready_route_admission: 37,
  tier_4_bank_directional_contract_gap: 11
});

// 3. Invariant: No gap with excluded items may appear in Tier 1
const tier1Gaps = result.gaps.filter(g => g.tier === 'tier_1_route_near_completion_candidate');
for (const gap of tier1Gaps) {
  assert.equal(gap.hasContentReviewExclusion, false,
    `Rule ${gap.ruleId} cannot be in Tier 1 because it has content-review exclusions`);
  for (const item of gap.outsideItemReviews) {
    assert.equal(item.excluded, false,
      `Item ${item.itemId} in rule ${gap.ruleId} is excluded and cannot appear in Tier 1`);
  }
}

// 4. Specifically verify instrumental-harm vs moral-limits-validity
const instrumentalHarm = result.gaps.find(g => g.ruleId === 'instrumental-harm');
assert.ok(instrumentalHarm, 'instrumental-harm gap must exist');
assert.equal(instrumentalHarm.tier, 'tier_2_content_blocked_route_gap',
  'instrumental-harm MUST be Tier 2 (content-blocked), NOT Tier 1 (easy win)');
assert.ok(instrumentalHarm.actionRecommendation.includes('NEI030'),
  'instrumental-harm recommendation must explain NEI030 exclusion');
assert.ok(instrumentalHarm.actionRecommendation.includes('near_duplicate_local_dependence'),
  'instrumental-harm recommendation must state the specific issue');

const moralLimits = result.gaps.find(g => g.ruleId === 'moral-limits-validity');
assert.ok(moralLimits, 'moral-limits-validity gap must exist');
assert.equal(moralLimits.tier, 'tier_1_route_near_completion_candidate',
  'moral-limits-validity should be Tier 1 (route-near, unblocked item)');
assert.equal(moralLimits.hasContentReviewExclusion, false);

console.log('Gap ranking regression passed: content-review exclusions forbid near-duplicate NEI030 from Tier 1; 4-tier taxonomy validated across 50 gaps.');
