import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const [review,affinity,dimensions,bank,model,route]=await Promise.all([
 read('data/reviews/draft-pool-reconciliation-v1.json'),
 read('data/items/affinity-gap-draft-v1.json'),
 read('data/items/dimension-gap-draft-v1.json'),
 read('data/items/candidate-v0.9.json'),
 read('data/generic/model-v1.1-pilot.json'),
 read('data/experience/progressive-depth-v1.1.json')
]);
assert.equal(review.schemaVersion,'unreleased-question-reconciliation-1');
assert.equal(review.status,'editorial_review_not_release_approval');
assert.equal(review.baseBankVersion,bank.bankVersion);
assert.equal(review.baseModelVersion,model.modelVersion);
const draftItems=[...affinity.items,...dimensions.items];
const draftIds=new Set(draftItems.map(item=>item.id));
const existingIds=new Set(bank.items.map(item=>item.id));
const decisions=new Map(review.decisions.map(row=>[row.itemId,row]));
const statuses=new Set(['reuse_existing','priority_for_formal_review','retain_unreleased',
 'revise_before_use','research_only_for_now']);
assert.equal(draftItems.length,41);
assert.equal(draftIds.size,draftItems.length,'Draft IDs must not collide across pools.');
assert.equal(decisions.size,draftIds.size,'Every draft needs exactly one disposition.');
for(const item of draftItems){
 const decision=decisions.get(item.id);
 assert.ok(decision,'Missing draft disposition: '+item.id);
 assert.ok(!existingIds.has(item.id),'A draft ID already exists in the active bank: '+item.id);
 assert.ok(statuses.has(decision.disposition),'Unknown disposition: '+item.id);
 assert.ok(decision.reason?.length>30,'A disposition needs a specific reason: '+item.id);
 assert.ok(Array.isArray(decision.nearestExistingItemIds));
 for(const near of decision.nearestExistingItemIds)
  assert.ok(existingIds.has(near)||draftIds.has(near),'Unknown neighboring item: '+near);
}
for(const id of decisions.keys())assert.ok(draftIds.has(id),'Review names an absent draft: '+id);
for(const id of review.firstReleaseReviewTargets)
 assert.equal(decisions.get(id)?.disposition,'priority_for_formal_review');
for(const id of review.existingEvidenceFirst)
 assert.ok(model.publicRuleIds.includes(id),'Existing-evidence review names a nonpublic rule: '+id);
for(const assigned of route.routes.flatMap(row=>row.itemRefs))
 assert.ok(!draftIds.has(assigned.itemId),'Unreleased draft leaked into a public route: '+assigned.itemId);
console.log(`Reconciled ${decisions.size} unreleased drafts against ${bank.items.length} current items; no public-route activation.`);
