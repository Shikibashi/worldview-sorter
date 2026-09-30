import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const [bank,draft,gaps,expansion,sourceDraft,constructs,scales,currentSources,worldviewSources,pilot]=await Promise.all([
 read('data/items/candidate-v0.9.json'),
 read('data/items/affinity-gap-draft-v1.json'),
 read('data/affinities/question-gap-review-v1.json'),
 read('data/affinities/expansion-review-v1.json'),
 read('data/affinities/question-sources-v1.json'),
 read('data/constructs.json'),read('data/response-scales.json'),
 read('data/sources.json'),read('data/generic/source-ledger-v0.5.json'),
 read('data/pilots/pilot-candidate-v1.1.json')
]);
const olderDrafts=(await Promise.all(['unmapped','self-interest','revelation','external-world']
 .map(name=>read(`data/items/${name}-draft-v1.json`)))).flatMap(file=>file.items);
const currentRefs=new Set(bank.items.map(item=>`${item.id}@${item.revision}`));
const draftRefs=new Set([...draft.items,...olderDrafts].map(item=>`${item.id}@${item.revision}`));
const allIds=new Set();
for(const item of [...bank.items,...olderDrafts,...draft.items]){
 assert.ok(!allIds.has(item.id),`duplicate current or draft item ID ${item.id}`);
 allIds.add(item.id);
}
const constructIds=new Set(constructs.constructs.map(item=>item.id));
const sourceIds=new Set([currentSources,worldviewSources,sourceDraft]
 .flatMap(document=>document.sources.map(source=>source.id)));
const scaleById=new Map(scales.scales.map(scale=>[scale.id,scale]));
assert.equal(draft.status,'candidate');
assert.equal(sourceDraft.status,'draft_source_claims_not_current_ledger');
for(const item of draft.items){
 assert.match(item.id,/^[A-Z]{2}I\d{3}$/);
 assert.equal(item.id.slice(0,2),item.domainId);
 assert.equal(item.revision,1);
 assert.equal(item.status,'candidate');
 assert.equal(scaleById.get(item.responseScaleId)?.responseType,item.responseType);
 assert.ok(item.options.length>=2,`${item.id} has too few answer meanings`);
 assert.equal(new Set(item.options.map(option=>option.id)).size,item.options.length,
  `${item.id} repeats an answer meaning ID`);
 assert.ok(item.targets.every(target=>constructIds.has(target.constructId)),
  `${item.id} has an unknown construct target`);
 assert.ok(item.provenance.sourceRefs.length&&item.provenance.sourceRefs.every(id=>sourceIds.has(id)),
  `${item.id} has an unknown source reference`);
 assert.ok(!pilot.route.exactItemRevisions.some(ref=>ref.itemId===item.id),
  `${item.id} leaked into the released pilot route`);
}
assert.deepEqual(gaps.entries.map(entry=>entry.id),expansion.entries.map(entry=>entry.id),
 'question review must cover every reviewed position in the same order');
for(const entry of gaps.entries){
 assert.ok(entry.existingItemRefs.every(ref=>currentRefs.has(ref)),
  `${entry.id} labels an unreleased revision as a current-bank item`);
 assert.ok(entry.unreleasedDraftItemRefs.every(ref=>draftRefs.has(ref)),
  `${entry.id} has a missing draft item reference`);
 assert.ok(entry.remainingReview,`${entry.id} lacks a remaining-evidence note`);
}
for(const item of draft.items)
 assert.ok(gaps.entries.some(entry=>entry.unreleasedDraftItemRefs.includes(`${item.id}@${item.revision}`)),
  `${item.id} has no reviewed doctrinal use`);
for(const source of sourceDraft.sources){
 assert.match(source.url,/^https:\/\//);
 assert.ok(source.claim&&source.linkedDraftItemIds.length);
 assert.equal(source.validatesOurItems,false);
 for(const id of source.linkedDraftItemIds)
  assert.ok(draft.items.some(item=>item.id===id&&item.provenance.sourceRefs.includes(source.id)),
   `${source.id} has a dangling item/source-claim link to ${id}`);
}
console.log(`Historical affinity question draft valid: ${draft.items.length} items unreleased at that baseline, `+
 `${gaps.entries.length} complete position records, ${sourceDraft.sources.length} proposed source claims.`);
