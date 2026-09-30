import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const [review,ledger]=await Promise.all([
 read('data/affinities/expansion-review-v1.json'),
 read('data/generic/source-ledger-v0.5.json')]);
const [model,pilot,catalog]=await Promise.all([
 read('data/generic/model-v1.1-pilot.json'),read('data/pilots/pilot-candidate-v1.1.json'),
 read('data/affinities/catalog-v1.1.json')]);

assert.equal(review.schemaVersion,'affinity-expansion-review-1');
assert.equal(review.modelVersion,model.modelVersion);
assert.equal(review.catalogVersionReviewed,catalog.catalogVersion);
assert.equal(review.status,'editorial_review_not_production_catalog');
const publicRules=new Set(model.publicRuleIds);
const measuredRules=new Set(pilot.interpretationRules.routeMeasuredDirectRuleIds);
const sources=new Set(ledger.sources.map(source=>source.id));
const ids=new Set();
const dispositions=new Set(['current_catalog','candidate_requires_claim_review',
 'candidate_requires_rule_review','defer_missing_defining_evidence']);
for(const entry of review.entries){
 assert.ok(entry.id&&!ids.has(entry.id),'duplicate or missing review entry '+entry.id);
 ids.add(entry.id);
 assert.ok(dispositions.has(entry.disposition),entry.id+' has unknown disposition');
 assert.ok(entry.sourceIds.length&&entry.sourceIds.every(id=>sources.has(id)),
  entry.id+' has an unknown source-ledger reference');
 assert.ok(entry.nearestFalsePositive,entry.id+' lacks a neighboring false positive');
 assert.ok(entry.directRuleIds.every(id=>publicRules.has(id)&&measuredRules.has(id)),
  entry.id+' claims direct evidence that the pilot cannot assess');
 assert.ok(entry.relatedRuleIds.every(id=>publicRules.has(id)),
  entry.id+' cites a nonpublic related rule');
 if(entry.disposition==='defer_missing_defining_evidence'){
  assert.equal(entry.directRuleIds.length,0,entry.id+' deferred doctrine is accidentally treated as direct');
  assert.ok(entry.missingDefiningDoctrine.length,entry.id+' deferral lacks a defining gap');
 }else assert.ok(entry.directRuleIds.length,entry.id+' lacks a measured direct criterion');
 if(entry.disposition==='candidate_requires_rule_review')
  assert.ok(entry.reviewNote,entry.id+' lacks a concrete item or rule concern');
 if(entry.disposition==='candidate_requires_claim_review')
  assert.ok(entry.directRuleIds.some(id=>{
   const rule=model.commitments.find(candidate=>candidate.id===id);
   return !rule.proposition||!rule.sourceClaims?.some(claim=>claim.relationship==='supports');
  }),entry.id+' has no stated claim-link barrier');
}
assert.deepEqual(new Set(catalog.traditions.map(tradition=>tradition.id)),
 new Set(review.entries.filter(entry=>entry.disposition==='current_catalog').map(entry=>entry.id)),
 'the reviewed active catalog does not match the actual public catalog');
for(const source of review.supplementalSources){
 assert.ok(ids.has(source.for)&&/^https:\/\//.test(source.url)&&source.use,
  'supplemental academic source lacks an entry, HTTPS URL, or claim scope');
}
console.log('Affinity expansion review checks passed: '+review.entries.length+
 ' scoped positions and traditions against the frozen '+catalog.traditions.length+'-entry catalog.');
