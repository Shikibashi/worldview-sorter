import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {generatePhilosophyPacket,auditPhilosophyPacket} from '../packages/philosophy/forms.js';
import {compareWorldview,validateModel} from '../packages/worldview/index.js';
import {evaluateAffinityExamples} from '../packages/worldview/affinities.js';
import {buildQuizSummary,createSharePreview,qualifyDirectPresentation,qualifyDerivedPresentation} from '../packages/experience/summary.js';
const root=new URL('../',import.meta.url),raw=p=>readFile(new URL(p,root),'utf8'),read=async p=>JSON.parse(await raw(p));
const hash=s=>createHash('sha256').update(s).digest('hex');
const manifest=await read('data/pilots/pilot-candidate-v1.json'),review=await read(manifest.contentReview.path);
const bank=await read(manifest.itemBank.path),pilot=await read('data/pilots/pilot-0.2.json'),scalesDoc=await read('data/response-scales.json');
const bankSources=await read('data/sources.json');
const form=await read(manifest.route.path),model=await read(manifest.interpretationRules.path);
const instrument=await read(manifest.route.instrumentManifestPath);
const oldForm=await read('data/philosophy/public-full-v1.2.json'),oldModel=await read('data/generic/model-v0.4.json');
const affinity=await read('data/pilots/affinity-stress-v1.json');
const depth=await read('data/experience/progressive-depth-v1.json');
const externalWorldDraft=await read('data/items/external-world-draft-v1.json');
const revelationDraft=await read('data/items/revelation-draft-v1.json');
const selfInterestDraft=await read('data/items/self-interest-draft-v1.json');
const awaitRaw=new Map(await Promise.all(Object.keys(manifest.sourceHashes).map(async p=>[p,await raw(p)])));
const frozenRaw=new Map(await Promise.all(Object.keys(manifest.frozenArtifactHashes).map(async p=>[p,await raw(p)])));
const items=new Map(bank.items.map(i=>[i.id,i]));
const packet=generatePhilosophyPacket({bank,pilot,policy:form,size:238,seed:'pilot-test'});
const base=()=>({bankVersion:bank.bankVersion,instrumentVersion:form.instrumentVersion,
 presentedItems:packet.entries.map(e=>({...e,presented:false,skippedByBranch:false})),responses:[]});
const answer=(id,value,state='answered')=>({itemId:id,itemRevision:items.get(id).revision,state,value});
const run=(answers=[])=>{const input=base();input.responses=answers;for(const r of answers)input.presentedItems.find(e=>e.itemId===r.itemId).presented=true;
 return compareWorldview({model,bank,scalesDoc,input});};
const state=(report,id)=>report.commitments.find(c=>c.commitmentId===id).state;
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS pilot v1: '+name);};
validateModel({model,bank,scalesDoc});
const leakedResearch=structuredClone(model),researchId=leakedResearch.researchOnlyRuleIds[0];
leakedResearch.commitments.find(c=>c.id===researchId).tier='primary';
leakedResearch.publicRuleIds.push(researchId);
assert.throws(()=>validateModel({model:leakedResearch,bank,scalesDoc}),/Research-only or missing public rule/);
const misclassifiedResearch=structuredClone(model);
misclassifiedResearch.commitments.find(c=>c.id===misclassifiedResearch.researchOnlyRuleIds[0]).tier='primary';
assert.throws(()=>validateModel({model:misclassifiedResearch,bank,scalesDoc}),/Invalid research-only rule/);
const duplicateResearch=structuredClone(model);duplicateResearch.researchOnlyRuleIds.push(duplicateResearch.researchOnlyRuleIds[0]);
assert.throws(()=>validateModel({model:duplicateResearch,bank,scalesDoc}),/Research-only rule IDs must be distinct/);
test('Versioned route freezes 238 exact item revisions and preserves old 240 route',()=>{
 assert.equal(manifest.status,'candidate_for_human_piloting');
 assert.equal(packet.entries.length,238);assert.equal(new Set(packet.entries.map(e=>e.itemId)).size,238);
 assert.deepEqual(packet.entries.map(e=>({itemId:e.itemId,itemRevision:e.itemRevision})),manifest.route.exactItemRevisions);
 assert.equal(instrument.instrumentVersion,form.instrumentVersion);
 assert.equal(instrument.nominalPoolSize,238);
 assert.deepEqual(instrument.entries.map(e=>({itemId:e.itemId,itemRevision:e.itemRevision})),form.frozenItems);
 assert.deepEqual(generatePhilosophyPacket({bank,pilot,policy:form,size:238,seed:'different-seed'}).entries,packet.entries);
 assert.ok(auditPhilosophyPacket(packet,form).allRequired);
 for(let index=0;index<packet.entries.length;index++){
  const item=items.get(packet.entries[index].itemId);
  if(index>=2)assert.ok(new Set(packet.entries.slice(index-2,index+1).map(e=>e.domainId)).size>1);
  if(index){const prior=items.get(packet.entries[index-1].itemId);for(const key of ['mirrorGroup','scenarioGroup'])assert.ok(!item[key]||item[key]!==prior[key]);}
  for(const condition of item.eligibility.all??[])assert.ok(packet.entries.findIndex(e=>e.itemId===condition.itemId)<index);
 }
 assert.equal(generatePhilosophyPacket({bank,pilot,policy:oldForm,size:240,seed:'pilot-v1-content'}).entries.length,240);
 assert.equal(oldModel.engineVersion,'generic-evidence-2');
 for(const [p,digest] of Object.entries(manifest.sourceHashes))assert.equal(hash(awaitRaw.get(p)),digest,p);
 for(const [p,digest] of Object.entries(manifest.frozenArtifactHashes))assert.equal(hash(frozenRaw.get(p)),digest,p);
});
test('Each source-route item has an explicit content decision',()=>{
 assert.equal(review.decisions.length,240);assert.equal(review.decisions.filter(d=>d.decision==='remove_from_pilot').length,2);
 assert.deepEqual(review.decisions.filter(d=>d.decision==='remove_from_pilot').map(d=>d.itemId).sort(),['EXI017','NEI030']);
 assert.ok(review.decisions.every(d=>d.rationale&&d.contribution&&d.itemRevision===items.get(d.itemId).revision));
 assert.equal(Object.values(manifest.route.domainCounts).reduce((a,b)=>a+b,0),238);
 assert.equal(new Set(packet.entries.map(e=>e.domainId)).size,12);
});
test('Instrument content and respondent missingness produce distinct states',()=>{
 const empty=run();
 assert.equal(state(empty,'audit2-RC05-miracles'),'insufficient_evidence');
 assert.equal(state(empty,'instrumental-harm'),'not_measured');
 assert.equal(empty.commitments.find(c=>c.commitmentId==='instrumental-harm').measurementReason,'route_omission');
 assert.equal(empty.commitments.find(c=>c.commitmentId==='ph-strong-property').measurementReason,'unavailable_in_instrument');
 assert.equal(empty.commitments.find(c=>c.commitmentId==='audit2-RC05-miracles').insufficientEvidenceReason,
  'no_usable_directional_answers');
 assert.equal(state(empty,'ph-world-possibilities'),'not_measured');
 assert.equal(state(empty,'construct-PL29'),'not_measured');
 assert.equal(state(run([answer('RCI010',null,'no_view')]),'audit2-RC05-miracles'),'insufficient_evidence');
 assert.equal(run([answer('RCI010',null,'no_view')]).commitments.find(c=>c.commitmentId==='audit2-RC05-miracles')
  .insufficientEvidenceReason,'special_or_skipped_responses');
 assert.equal(state(run([answer('NEI005','never')]),'instrumental-harm'),'not_measured');
});
test('A conditional path records branch-not-reached without inventing opposition',()=>{
 const branchModel=structuredClone(model);
 branchModel.commitments.find(c=>c.id==='audit2-RC02-agentic-divinity').evidence=
  branchModel.commitments.find(c=>c.id==='audit2-RC02-agentic-divinity').evidence.filter(e=>e.itemId!=='RCI025');
 validateModel({model:branchModel,bank,scalesDoc});
 const input=base();input.responses=[answer('RCI001','none')];
 input.presentedItems.find(p=>p.itemId==='RCI001').presented=true;
 input.presentedItems.find(p=>p.itemId==='RCI002').skippedByBranch=true;
 const result=compareWorldview({model:branchModel,bank,scalesDoc,input});
 const row=result.commitments.find(c=>c.commitmentId==='audit2-RC02-agentic-divinity');
 assert.equal(row.state,'not_measured');assert.equal(row.measurementReason,'branch_not_reached');
 assert.equal(row.branchSkippedEvidenceUnits,1);assert.equal(row.opposingUnits,0);
});
test('Support, opposition, weak direction, contradiction and skipped response stay separate',()=>{
 const id='audit2-RC05-miracles';
 assert.equal(state(run([answer('RCI010',2),answer('RCI017',-2)]),id),'supported');
 assert.equal(state(run([answer('RCI010',-2),answer('RCI017',2)]),id),'opposed');
 const weak=run([answer('RCI010',2)]).commitments.find(c=>c.commitmentId===id);
 assert.equal(weak.state,'leaned_toward');assert.equal(weak.leanDirection,'support');
 const mixed=run([answer('RCI010',2),answer('RCI017',2)]);
 assert.equal(state(mixed,id),'mixed_context_dependent');assert.ok(mixed.tensions.some(t=>t.ruleIds.includes(id)));
 assert.equal(state(run([answer('RCI010',null,'no_view')]),id),'insufficient_evidence');
 const input=base();input.presentedItems.find(e=>e.itemId==='RCI010').skippedByBranch=true;
 assert.throws(()=>compareWorldview({model,bank,scalesDoc,input}),/Unconditional item cannot be branch-skipped/);
 const eligible=base();eligible.responses=[answer('RCI001','personal_divine')];
 eligible.presentedItems.find(e=>e.itemId==='RCI001').presented=true;
 eligible.presentedItems.find(e=>e.itemId==='RCI002').skippedByBranch=true;
 assert.throws(()=>compareWorldview({model,bank,scalesDoc,input:eligible}),/Eligible conditional item cannot be branch-skipped/);
});
test('General answer versus vignette and competing propositions are visible tensions',()=>{
 const general=run([answer('EPI009',2),answer('EPI028','simple_facts')]);
 assert.equal(state(general,'audit2-EP02-complex-knowledge'),'mixed_context_dependent');
 assert.ok(general.tensions.some(t=>t.kind==='general_case_divergence'&&t.ruleIds.includes('audit2-EP02-complex-knowledge')));
 const cross=run([answer('RCI010',2),answer('RCI017',-2),answer('RCI003',-2),answer('RCI006',2)]);
 assert.ok(cross.tensions.some(t=>t.id==='miracle-supernatural-conflict'));
});
test('Revelation review retains the frozen substantial-versus-some answer boundary',()=>{
 const id='audit2-EP10-revelation';
 assert.equal(state(run([answer('EPI021',-2),answer('EPI032','substantial')]),id),'supported');
 assert.equal(state(run([answer('EPI021',2),answer('EPI032','none')]),id),'opposed');
 assert.equal(state(run([answer('EPI021',-2),answer('EPI032','none')]),id),'mixed_context_dependent');
 assert.equal(state(run([answer('EPI021',-2)]),id),'leaned_toward');
 assert.equal(state(run([answer('EPI021',-2),answer('EPI032','some')]),id),'leaned_toward',
  'Needing independent support cannot be silently promoted to substantial standalone justification.');
 assert.equal(state(run([answer('EPI021',null,'no_view'),answer('EPI032','some')]),id),'insufficient_evidence');
});
test('Revelation successor preview separates first-person strength from outsider warrant',()=>{
 const id='audit2-EP10-revelation',draftItem=revelationDraft.items[0];
 assert.equal(draftItem.id,'EPI120');assert.equal(draftItem.revision,1);
 assert.ok(draftItem.provenance.sourceRefs.every(ref=>bankSources.sources.some(source=>source.id===ref)),
  'Draft item provenance must resolve in the candidate-bank source registry.');
 assert.deepEqual(draftItem.options.map(option=>option.id),
  ['strong_experiencer_only','strong_both','provisional_only','none_alone']);
 assert.ok(!items.has(draftItem.id)&&!packet.entries.some(entry=>entry.itemId===draftItem.id),
  'An unreviewed discriminator cannot enter the frozen bank or route.');
 const candidateBank=structuredClone(bank),candidate=structuredClone(model);
 candidateBank.bankVersion='0.9.0-EP10-synthetic-preview';candidateBank.items.push(draftItem);
 candidate.bankVersion=candidateBank.bankVersion;candidate.modelVersion='generic-1.1.0-EP10-synthetic-preview';
 candidate.pilotInstrumentVersion='worldview-pilot-1.1.0-EP10-synthetic-preview';
 candidate.pilotRouteItemRefs.push({itemId:draftItem.id,itemRevision:draftItem.revision});
 const rule=candidate.commitments.find(entry=>entry.id===id);
 rule.proposition='In a clear seeming divine revelation without independent verification, the experiencer can gain substantial factual justification from the experience alone.';
 rule.scope=rule.proposition;rule.label=rule.proposition;
 rule.evidence=rule.evidence.filter(e=>e.itemId!=='EPI021');
 rule.evidence.find(e=>e.itemId==='EPI032').oppose=['some','little','none'];
 rule.evidence.push({itemId:draftItem.id,itemRevision:1,unitId:draftItem.id,
  support:['strong_experiencer_only','strong_both'],oppose:['provisional_only','none_alone']});
 rule.neighbors=['Modest first-person justification requiring further support','Outsider testimony-based justification',
  'No first-person factual justification from apparent revelation'];
 rule.nonEntailments=['The experience is genuinely divine','An outsider should accept the claim',
  'The respondent belongs to a religion'];
 rule.falsePositives=['Some initial justification that still needs independent support does not establish substantial standalone warrant.'];
 validateModel({model:candidate,bank:candidateBank,scalesDoc});
 const draftAnswer=(value,state='answered')=>({itemId:draftItem.id,itemRevision:1,state,value});
 const preview=(answers,includeDraft=true)=>{
  const previewModel=includeDraft?candidate:{...candidate,pilotRouteItemRefs:model.pilotRouteItemRefs};
  const input={bankVersion:candidateBank.bankVersion,instrumentVersion:candidate.pilotInstrumentVersion,
   presentedItems:[...base().presentedItems,...(includeDraft?[{itemId:draftItem.id,itemRevision:1,domainId:'EP',
    presented:false,skippedByBranch:false}]:[])],responses:answers};
  for(const response of answers)input.presentedItems.find(entry=>entry.itemId===response.itemId).presented=true;
  return compareWorldview({model:previewModel,bank:candidateBank,scalesDoc,input});
 };
 assert.equal(state(preview([answer('EPI032','substantial'),draftAnswer('strong_experiencer_only')]),id),'supported');
 assert.equal(state(preview([answer('EPI032','substantial'),draftAnswer('strong_both')]),id),'supported',
  'Outsider warrant is a separate assertion, not a requirement for the first-person proposition.');
 assert.equal(state(preview([answer('EPI032','none'),draftAnswer('none_alone')]),id),'opposed');
 assert.equal(state(preview([answer('EPI032','some'),draftAnswer('provisional_only')]),id),'opposed',
  'Provisional warrant needing independent evidence is not substantial standalone warrant.');
 assert.equal(state(preview([answer('EPI032','substantial'),draftAnswer('provisional_only')]),id),'mixed_context_dependent');
 assert.equal(state(preview([answer('EPI032','substantial')]),id),'leaned_toward');
 assert.equal(state(preview([answer('EPI032',null,'no_view'),draftAnswer(null,'not_understood')]),id),'insufficient_evidence');
 assert.equal(state(preview([answer('EPI032','substantial')],false),id),'not_measured');
 assert.equal(state(run([answer('EPI021',-2),answer('EPI032','substantial')]),id),'supported',
  'A successor preview cannot change the frozen public rule.');
});
test('Moral-scope successor cannot publish a one-item interpretation of possible equality',()=>{
 const id='audit2-SO09-moral-scope';
 const moderate=[answer('SOI004',2),answer('SOI029',-2)];
 const reverse=[answer('SOI004',-2),answer('SOI029',2)];
 assert.equal(state(run([answer('SOI004',2),answer('SOI029',2)]),id),'supported');
 assert.equal(state(run([answer('SOI004',-2),answer('SOI029',-2)]),id),'opposed');
 assert.equal(state(run(moderate),id),'mixed_context_dependent',
  'The frozen release must remain reproducible even where the two item targets differ.');
 assert.equal(state(run(reverse),id),'mixed_context_dependent');
 const candidate=structuredClone(model),reviewedRule=candidate.commitments.find(rule=>rule.id===id);
 candidate.modelVersion='generic-1.1.0-SO09-synthetic-preview';
 reviewedRule.evidence=reviewedRule.evidence.filter(evidence=>evidence.itemId==='SOI004');
 reviewedRule.boundary='Possible equal claims do not imply equal priority in every matched case or deny special obligations.';
 reviewedRule.falsePositives=['Usual local priority in one matched case does not deny possible equality in another.'];
 assert.throws(()=>validateModel({model:candidate,bank,scalesDoc}),
  /Insufficient planned units for audit2-SO09-moral-scope/,
  'Removing a false-positive item cannot silently weaken a public rule to one unit.');
 const retired=structuredClone(model);
 retired.modelVersion='generic-1.1.0-SO09-retirement-preview';
 retired.commitments=retired.commitments.filter(rule=>rule.id!==id);
 retired.publicRuleIds=retired.publicRuleIds.filter(ruleId=>ruleId!==id);
 retired.comparisons=retired.comparisons.filter(comparison=>
  !comparison.criteria.some(criterion=>criterion.commitmentId===id));
 retired.coverage.constructs.find(construct=>construct.id==='SO09').ruleIds=[];
 for(const item of retired.coverage.items)item.ruleIds=item.ruleIds.filter(ruleId=>ruleId!==id);
 for(const facet of retired.facets)facet.ruleIds=facet.ruleIds.filter(ruleId=>ruleId!==id);
 validateModel({model:retired,bank,scalesDoc});
 for(const answers of [moderate,reverse,[answer('SOI004',2),answer('SOI029',2)],
  [answer('SOI004',-2),answer('SOI029',-2)],[],[answer('SOI004',null,'no_view')]]){
  const input=base();input.responses=answers;
  for(const response of answers)input.presentedItems.find(entry=>entry.itemId===response.itemId).presented=true;
  const report=compareWorldview({model:retired,bank,scalesDoc,input});
  assert.ok(!report.commitments.some(row=>row.commitmentId===id),'Retired interpretation must not be calculated.');
  assert.ok(!report.comparisons.some(row=>row.criteria.some(criterion=>criterion.commitmentId===id)),
   'A comparison cannot retain a retired defining criterion.');
  assert.ok(report.domains.find(domain=>domain.id==='SO').unresolvedConstructIds.includes('SO09'),
   'The successor must retain the explicit SO09 coverage gap.');
 }
 assert.equal(state(run(moderate),id),'mixed_context_dependent',
  'The synthetic successor must not mutate the frozen historical rule.');
});
test('Decentralization mirror answers need an independent local-variation tradeoff',()=>{
 const id='audit2-PL05-decentralization';
 const mirror=[answer('PLI004',2),answer('PLI003',-2)];
 const lone=run(mirror).commitments.find(row=>row.commitmentId===id);
 assert.equal(lone.state,'leaned_toward');assert.equal(lone.supportingUnits,1,
  'The two mirrored statements are one authored evidence unit.');
 assert.equal(state(run([...mirror,answer('PLI050',2)]),id),'supported');
 assert.equal(state(run([answer('PLI004',-2),answer('PLI003',2),answer('PLI050',-2)]),id),'opposed');
 assert.equal(state(run([...mirror,answer('PLI050',-2)]),id),'mixed_context_dependent');
 assert.equal(state(run([answer('PLI004',null,'no_view'),answer('PLI050',null,'not_understood')]),id),
  'insufficient_evidence');
});
test('External-world successor preview needs a distinct perceptual-error case',()=>{
 const id='audit2-EP11-external-world',draftItem=externalWorldDraft.items[0];
 assert.equal(draftItem.id,'EPI119');assert.equal(draftItem.revision,1);
 assert.ok(!items.has(draftItem.id)&&!packet.entries.some(entry=>entry.itemId===draftItem.id),
  'The draft item must not enter the frozen bank or route.');
 assert.deepEqual(draftItem.options.map(option=>option.id),
  ['independent_rock','external_but_conceptualized','no_independent_object','undecided_by_case']);
 const frozenPair=[answer('EPI036',2),answer('EPI037','mind_independent')];
 assert.equal(state(run(frozenPair),id),'supported','The historical two-statement result is preserved.');
 const candidateBank=structuredClone(bank),candidate=structuredClone(model);
 candidateBank.bankVersion='0.9.0-EP11-synthetic-preview';candidateBank.items.push(draftItem);
 candidate.bankVersion=candidateBank.bankVersion;candidate.modelVersion='generic-1.1.0-EP11-synthetic-preview';
 candidate.pilotInstrumentVersion='worldview-pilot-1.1.0-EP11-synthetic-preview';
 candidate.pilotRouteItemRefs.push({itemId:draftItem.id,itemRevision:draftItem.revision});
 const reviewedRule=candidate.commitments.find(rule=>rule.id===id);
 reviewedRule.evidence=reviewedRule.evidence.filter(evidence=>evidence.itemId!=='EPI036');
 reviewedRule.evidence.push({itemId:draftItem.id,itemRevision:1,unitId:draftItem.id,
  support:['independent_rock'],oppose:['no_independent_object']});
 validateModel({model:candidate,bank:candidateBank,scalesDoc});
 const draftAnswer=(value,state='answered')=>({itemId:draftItem.id,itemRevision:1,state,value});
 const preview=(answers,includeDraft=true)=>{
  const previewModel=includeDraft?candidate:{...candidate,pilotRouteItemRefs:model.pilotRouteItemRefs};
  const input={bankVersion:candidateBank.bankVersion,instrumentVersion:candidate.pilotInstrumentVersion,
   presentedItems:[...base().presentedItems,...(includeDraft?[{itemId:draftItem.id,itemRevision:1,domainId:'EP',
    presented:false,skippedByBranch:false}]:[])],responses:answers};
  for(const response of answers)input.presentedItems.find(entry=>entry.itemId===response.itemId).presented=true;
  return compareWorldview({model:previewModel,bank:candidateBank,scalesDoc,input});
 };
 assert.equal(state(preview(frozenPair),id),'leaned_toward',
  'Removing the double-barreled item prevents the frozen positive pair from proving a successor rule.');
 assert.equal(state(preview([answer('EPI037','mind_independent'),draftAnswer('independent_rock')]),id),'supported');
 assert.equal(state(preview([answer('EPI034','idealist'),draftAnswer('no_independent_object')]),id),'opposed');
 assert.equal(state(preview([answer('EPI037','mind_independent'),draftAnswer('no_independent_object')]),id),'mixed_context_dependent');
 assert.equal(state(preview([answer('EPI037','mind_independent')]),id),'leaned_toward');
 assert.equal(state(preview([answer('EPI034','indirect'),draftAnswer('external_but_conceptualized')]),id),'insufficient_evidence');
 assert.equal(state(preview([answer('EPI034','skeptical'),draftAnswer('undecided_by_case')]),id),'insufficient_evidence');
 assert.equal(state(preview([answer('EPI037',null,'no_view'),draftAnswer(null,'not_understood')]),id),'insufficient_evidence');
 assert.equal(state(preview([answer('EPI037','mind_independent')],false),id),'not_measured',
  'A successor route omitting the new question cannot inherit its available evidence.');
 assert.equal(state(run(frozenPair),id),'supported','Preview must not mutate the frozen model.');
});
test('Derived conclusion needs both direct propositions and yields to a conflicting direct answer',()=>{
 const supporting=[answer('RCI014',2),answer('RCI021','high'),answer('RCI015',-2),answer('RCI025','personal')];
 const yes=run(supporting).derived.find(d=>d.id==='derived-RC11-agentic-divine-outlook');
 assert.equal(yes.state,'supported');assert.equal(yes.inferenceStatus,'derived');
 const weak=run(supporting.slice(0,3)).derived.find(d=>d.id===yes.id);
 assert.equal(weak.state,'insufficient_evidence');
 const conflicted=run([...supporting,answer('RCI001','impersonal_divine')]);
 assert.equal(conflicted.derived.find(d=>d.id===yes.id).state,'mixed_context_dependent');
 assert.ok(conflicted.tensions.some(t=>t.kind==='derived_direct_conflict'));
 const input=base();input.responses=supporting;
 for(const response of supporting)input.presentedItems.find(entry=>entry.itemId===response.itemId).presented=true;
 const summary=buildQuizSummary({model,bank,scalesDoc,session:{...input,completionStatus:'completed'}});
 const row=summary.rows.find(candidate=>candidate.id===yes.id);
 assert.equal(row.status,'supported','Historical authored replay remains unchanged.');
 assert.equal(row.displayState,'model_review_required');
 assert.equal(row.presentationReview.schemaVersion,'derived-presentation-1');
 assert.equal(row.presentationReview.state,'prerequisite_unresolved');
 assert.deepEqual(row.presentationReview.unresolvedPrerequisiteRuleIds,['divine-existence']);
 assert.equal(row.presentationReview.derivedClaimUnlinked,true);
 assert.match(row.statusLabel,/awaiting model review/);
 assert.ok(!summary.overview.some(candidate=>candidate.id===row.id));
 assert.throws(()=>createSharePreview(summary,[row.id]),/evidence-backed patterns/);
 const reviewedModel=structuredClone(model),derivedRule=reviewedModel.derivedRules.find(rule=>rule.id===yes.id);
 for(const id of derivedRule.requires.map(dependency=>dependency.ruleId)){
  const prerequisite=reviewedModel.commitments.find(rule=>rule.id===id);
  prerequisite.proposition??='Synthetic exact prerequisite for presentation-gate regression.';
  prerequisite.sourceClaims=[{sourceId:prerequisite.sourceIds[0],relationship:'supports',claim:'Synthetic supporting claim.'}];
 }
 derivedRule.sourceClaims=[{sourceId:derivedRule.sourceIds[0],relationship:'supports',claim:'Synthetic supporting claim.'}];
 assert.equal(qualifyDerivedPresentation({rule:derivedRule,model:reviewedModel}).state,'eligible');
 delete reviewedModel.commitments.find(rule=>rule.id==='audit2-RC02-agentic-divinity').sourceClaims;
 assert.equal(qualifyDerivedPresentation({rule:derivedRule,model:reviewedModel}).state,'source_claim_unresolved');
});
test('Direct result presentation distinguishes a rule scope from an exact sourced proposition',()=>{
 const legacyRule=model.commitments.find(rule=>model.publicRuleIds.includes(rule.id)&&!rule.proposition);
 const exactRule=model.commitments.find(rule=>model.publicRuleIds.includes(rule.id)&&rule.proposition);
 assert.ok(legacyRule&&exactRule);
 assert.equal(qualifyDirectPresentation(legacyRule).state,'inherited_rule_scope');
 assert.equal(qualifyDirectPresentation(exactRule).state,'source_claim_unresolved');
 const candidate=structuredClone(exactRule);
 candidate.sourceClaims=[{sourceId:candidate.sourceIds[0],relationship:'context',claim:'Context only.'}];
 assert.equal(qualifyDirectPresentation(candidate).state,'source_claim_unresolved');
 candidate.sourceClaims=[{sourceId:candidate.sourceIds[0],relationship:'supports',claim:'Reviewed synthetic claim.'}];
 assert.equal(qualifyDirectPresentation(candidate).state,'eligible');
 const input=base();input.responses=[answer('RCI010',2),answer('RCI017',-2)];
 for(const response of input.responses)input.presentedItems.find(entry=>entry.itemId===response.itemId).presented=true;
 const summary=buildQuizSummary({model,bank,scalesDoc,session:{...input,completionStatus:'completed'}});
 const miracle=summary.rows.find(row=>row.id==='audit2-RC05-miracles');
 assert.equal(miracle.status,'supported','The frozen engine result remains replayable.');
 assert.equal(miracle.presentationReview.schemaVersion,'direct-presentation-1');
 assert.equal(miracle.presentationReview.state,'source_claim_unresolved');
 assert.match(miracle.statusLabel,/supporting source link under review/);
 assert.match(createSharePreview(summary,[miracle.id]),/supporting source link under review/);
 assert.match(miracle.explanation,/supporting academic claim has not yet been linked/);
 assert.equal(summary.rows.find(row=>row.id===legacyRule.id).presentationReview.state,'inherited_rule_scope');
 assert.equal(summary.rows.filter(row=>row.inferenceStatus==='direct'&&row.presentationReview.state==='eligible').length,0);
});
test('Neighboring biological and environmental views can coexist without invented tension',()=>{
 const r=run([answer('AHI010',2),answer('AHI018',-2),answer('AHI019',2),answer('AHI022',2)]);
 assert.equal(state(r,'audit2-AH08-biological'),'supported');
 assert.equal(state(r,'audit2-AH09-environmental'),'supported');
 assert.ok(!r.tensions.some(t=>t.ruleIds.includes('audit2-AH08-biological')&&t.ruleIds.includes('audit2-AH09-environmental')));
});
test('AH14 review fixture preserves historical output and previews a narrower versioned rule',()=>{
 const ah14='construct-AH14';
 for(const routeId of ['quick','standard']){
  const ids=new Set(depth.routes.find(route=>route.id===routeId).itemRefs.map(ref=>ref.itemId));
  assert.ok(ids.has('AHI103')&&ids.has('AHI104')&&!ids.has('AHI105'));
 }
 const candidate=structuredClone(model),rule=candidate.commitments.find(c=>c.id===ah14);
 rule.evidence=rule.evidence.filter(e=>e.itemId!=='AHI104');
 candidate.modelVersion='generic-1.1.0-AH14-review-preview';
 validateModel({model:candidate,bank,scalesDoc});
 const preview=answers=>{const input=base();input.responses=answers;
  for(const response of answers)input.presentedItems.find(e=>e.itemId===response.itemId).presented=true;
  return compareWorldview({model:candidate,bank,scalesDoc,input});};
 const overlapping=[answer('AHI103',2),answer('AHI104',2)];
 assert.equal(state(run(overlapping),ah14),'supported');
 assert.equal(state(preview(overlapping),ah14),'leaned_toward');
 assert.equal(state(preview([answer('AHI103',2),answer('AHI105',-2)]),ah14),'supported');
 assert.equal(state(preview([answer('AHI103',-2),answer('AHI105',2)]),ah14),'opposed');
 assert.equal(state(preview([answer('AHI103',2),answer('AHI105',2)]),ah14),'mixed_context_dependent');
 assert.equal(state(preview([answer('AHI103',null,'no_view'),answer('AHI105',null,'not_understood')]),ah14),'insufficient_evidence');
 assert.equal(state(preview([answer('AHI103',2),answer('AHI104',-2),answer('AHI105',-2)]),ah14),'supported');
 assert.equal(state(run(overlapping),ah14),'supported'); // Frozen pilot replay is unchanged.
});
test('NE15 review preview exposes the frozen route reliance on two similar items',()=>{
 const id='construct-NE15',parallel=[answer('NEI100',2),answer('NEI101',2)];
 assert.ok(packet.entries.some(e=>e.itemId==='NEI100')&&packet.entries.some(e=>e.itemId==='NEI101'));
 assert.ok(!packet.entries.some(e=>e.itemId==='NEI102'));
 assert.equal(state(run(parallel),id),'supported');
 const grouped=structuredClone(model),groupedRule=grouped.commitments.find(c=>c.id===id);
 groupedRule.evidence.find(e=>e.itemId==='NEI101').unitId='NEI100';
 grouped.modelVersion='generic-1.1.0-NE15-review-preview';
 validateModel({model:grouped,bank,scalesDoc});
 const preview=answers=>{const input=base();input.responses=answers;
  for(const response of answers)input.presentedItems.find(e=>e.itemId===response.itemId).presented=true;
  return compareWorldview({model:grouped,bank,scalesDoc,input});};
 assert.equal(state(preview(parallel),id),'not_measured');
 assert.equal(state(run(parallel),id),'supported'); // Historical pilot behavior is unchanged.
});
test('NE15 successor preview distinguishes exclusive self-interest from other-regarding moral reasons',()=>{
 const id='construct-NE15',draftItem=selfInterestDraft.items[0];
 assert.equal(draftItem.id,'NEI121');assert.equal(draftItem.revision,1);
 assert.ok(draftItem.provenance.sourceRefs.every(sourceId=>bankSources.sources.some(source=>source.id===sourceId)));
 assert.ok(!items.has(draftItem.id)&&!packet.entries.some(entry=>entry.itemId===draftItem.id));
 assert.deepEqual(draftItem.options.map(option=>option.id),
  ['independent_duty','independent_reason','own_good_only','undecided']);
 const candidateBank=structuredClone(bank),candidate=structuredClone(model);
 candidateBank.bankVersion='0.9.0-NE15-synthetic-preview';candidateBank.items.push(draftItem);
 candidate.bankVersion=candidateBank.bankVersion;candidate.modelVersion='generic-1.1.0-NE15-synthetic-preview';
 candidate.pilotInstrumentVersion='worldview-pilot-1.1.0-NE15-synthetic-preview';
 candidate.pilotRouteItemRefs.push({itemId:draftItem.id,itemRevision:draftItem.revision});
 const rule=candidate.commitments.find(entry=>entry.id===id);
 rule.proposition='Each person morally ought to make their own long-term good the ultimate end of their actions; another person’s need alone supplies no independent moral reason.';
 rule.scope=rule.proposition;rule.label='Exclusive normative self-interest';
 rule.evidence=rule.evidence.filter(evidence=>evidence.itemId!=='NEI102');
 rule.evidence.find(evidence=>evidence.itemId==='NEI101').unitId='NEI100';
 rule.evidence.push({itemId:draftItem.id,itemRevision:1,unitId:draftItem.id,
  support:['own_good_only'],oppose:['independent_duty','independent_reason']});
 rule.neighbors=['Moral self-care with independent duties to others',
  'Agent-centered prerogatives with other-regarding moral reasons',
  'Rational egoism without an exclusively moral self-interest thesis'];
 rule.nonEntailments=['People are psychologically self-interested',
  'The respondent accepts the maximizing if-and-only-if account of ethical egoism',
  'The respondent endorses Objectivism or any political position'];
 rule.falsePositives=['Refusing severe sacrifice does not show that another person’s need has no moral weight.',
  'Two similarly worded own-good statements count as one authored evidence unit.'];
 validateModel({model:candidate,bank:candidateBank,scalesDoc});
 const draftAnswer=(value,state='answered')=>({itemId:draftItem.id,itemRevision:1,state,value});
 const preview=(answers,includeDraft=true)=>{
  const previewModel=includeDraft?candidate:{...candidate,pilotRouteItemRefs:model.pilotRouteItemRefs};
  const input={bankVersion:candidateBank.bankVersion,instrumentVersion:candidate.pilotInstrumentVersion,
   presentedItems:[...base().presentedItems,...(includeDraft?[{itemId:draftItem.id,itemRevision:1,domainId:'NE',
    presented:false,skippedByBranch:false}]:[])],responses:answers};
  for(const response of answers)input.presentedItems.find(entry=>entry.itemId===response.itemId).presented=true;
  return compareWorldview({model:previewModel,bank:candidateBank,scalesDoc,input});
 };
 assert.equal(state(preview([answer('NEI100',2),draftAnswer('own_good_only')]),id),'supported');
 assert.equal(state(preview([answer('NEI100',-2),draftAnswer('independent_duty')]),id),'opposed');
 assert.equal(state(preview([answer('NEI100',-2),draftAnswer('independent_reason')]),id),'opposed',
  'A non-obligatory moral reason is still independent of self-interest.');
 assert.equal(state(preview([answer('NEI100',2),draftAnswer('independent_reason')]),id),'mixed_context_dependent');
 assert.equal(state(preview([answer('NEI100',null,'no_view'),draftAnswer(null,'not_understood')]),id),'insufficient_evidence');
 assert.equal(state(preview([answer('NEI100',2),draftAnswer('undecided')]),id),'leaned_toward');
 assert.equal(state(preview([answer('NEI100',2),answer('NEI101',2)]),id),'leaned_toward',
  'Paraphrased general statements cannot establish the successor proposition alone.');
 assert.equal(state(preview([answer('NEI100',2),answer('NEI101',2)],false),id),'not_measured');
 assert.equal(state(run([answer('NEI100',2),answer('NEI101',2)]),id),'supported',
  'The frozen pilot remains historically reproducible.');
});
test('EP16 review preview does not turn a reverse-item disagreement into the pragmatic maxim',()=>{
 const id='construct-EP16';
 const reversedPair=[answer('EPI104',2),answer('EPI105',-2)];
 assert.ok(!packet.entries.some(entry=>entry.itemId==='EPI103'));
 assert.ok(packet.entries.some(entry=>entry.itemId==='EPI104')&&packet.entries.some(entry=>entry.itemId==='EPI105'));
 assert.equal(state(run(reversedPair),id),'supported');
 const candidate=structuredClone(model),rule=candidate.commitments.find(entry=>entry.id===id);
 candidate.modelVersion='generic-1.1.0-EP16-review-preview';
 rule.evidence.find(evidence=>evidence.itemId==='EPI104').unitId='EPI103';
 const reverse=rule.evidence.find(evidence=>evidence.itemId==='EPI105');
 reverse.support=[];reverse.oppose=[];
 validateModel({model:candidate,bank,scalesDoc});
 const preview=answers=>{const input=base();input.responses=answers;
  for(const response of answers)input.presentedItems.find(entry=>entry.itemId===response.itemId).presented=true;
  return compareWorldview({model:candidate,bank,scalesDoc,input});};
 assert.equal(state(preview(reversedPair),id),'not_measured',
  'Rejecting an absolute reverse statement supplies no independent pragmatic-maxim support.');
 assert.equal(state(preview([answer('EPI104',2)]),id),'not_measured',
  'The route has only one direct content opportunity after the absolute reverse item is set aside.');
 assert.equal(state(run(reversedPair),id),'supported','The frozen model remains historically reproducible.');
});
test('Hierarchy, provenance and public visibility follow frozen semantics',()=>{
 const input=base();input.responses=[answer('RCI010',2),answer('RCI017',-2)];for(const r of input.responses)input.presentedItems.find(e=>e.itemId===r.itemId).presented=true;
 const summary=buildQuizSummary({model,bank,scalesDoc,session:{...input,completionStatus:'completed'}});
 assert.equal(summary.schemaVersion,'quiz-summary-3');assert.equal(summary.domains.length,12);
 const row=summary.rows.find(r=>r.id==='audit2-RC05-miracles');
 assert.equal(row.status,'supported');assert.equal(row.inferenceStatus,'direct');assert.equal(row.interpretationRule.version,model.modelVersion);
 assert.equal(row.propositionBasis,'explicit_rule_proposition');
 assert.deepEqual(row.evidence.map(e=>[e.itemId,e.itemRevision,e.meaning]),[['RCI010',1,'support'],['RCI017',1,'support']]);
 assert.ok(row.sources.length&&row.sources.every(s=>s.url));
 assert.ok(summary.domains.find(d=>d.id==='RC').facets.some(f=>f.rows.some(r=>r.id===row.id)));
 assert.ok(summary.unmeasured.some(r=>r.id==='construct-PL29'));
 assert.equal(summary.rows.find(r=>r.id==='construct-PL29').measurementReason,'route_omission');
 assert.ok(summary.domains.every(d=>['not_measured','partially_assessed','assessed_unresolved','meaningfully_assessed']
  .includes(d.measurementStatus)));
 assert.ok(summary.domains.every(d=>d.facets.every(f=>
  ['not_measured','partially_assessed','assessed_unresolved','meaningfully_assessed'].includes(f.measurementStatus))));
 const inherited=summary.rows.find(r=>r.id==='construct-EP16');
 assert.equal(inherited.propositionBasis,'inherited_rule_scope');
 assert.equal(inherited.proposition,null);
 assert.match(inherited.explanation,/inherited rule scope/);
 assert.equal(summary.rows.find(r=>r.id==='derived-RC11-agentic-divine-outlook').propositionBasis,'explicit_derived_proposition');
 assert.equal(summary.affinityPresentation,null,'A result without a catalog has no affinity presentation.');
 assert.ok(summary.mixedOrUnresolved.some(r=>r.id==='audit2-EP02-complex-knowledge'));
 assert.ok(!summary.rows.some(r=>model.researchOnlyRuleIds.includes(r.id)));
 assert.ok(!summary.rows.some(r=>manifest.deprecatedConstructIds.includes(r.constructId)));
 assert.equal(summary.matchPercent,null);assert.equal(summary.identity,null);
 assert.ok(!JSON.stringify(summary).match(/"(?:matchPercentage|probability|percentile)"/i));
 assert.throws(()=>createSharePreview(summary,['construct-PL29']));
});
test('A context-limited source does not appear as questionnaire validation',()=>{
 const input=base();input.responses=[answer('RCI012',2),answer('RCI029','some')];
 for(const response of input.responses)input.presentedItems.find(e=>e.itemId===response.itemId).presented=true;
 const summary=buildQuizSummary({model,bank,scalesDoc,session:{...input,completionStatus:'completed'}});
 const row=summary.rows.find(r=>r.id==='ph-sacred-value');
 const source=row.sources.find(s=>s.id==='domain-sacred');
 assert.equal(row.status,'supported');
 assert.equal(source.validatesThisQuiz,false);
 assert.equal(source.claimScope,'source_record');
 assert.match(source.claim,/specific conflict context/i);
});
test('Rule-linked claims are distinct from source-record context in result details',()=>{
 const legacy=buildQuizSummary({model,bank,scalesDoc,session:{...base(),completionStatus:'completed'}});
 assert.equal(legacy.rows.find(r=>r.id==='construct-EP16').sources[0].claimScope,'topic_only');
 const candidate=structuredClone(model),rule=candidate.commitments.find(c=>c.id==='construct-EP16');
 const claim='Conceivable practical bearings clarify a disputed conception.';
 rule.sourceClaims=[{sourceId:'acad-pragmatism',claim,relationship:'supports'}];
 candidate.modelVersion='generic-1.1.0-source-claim-preview';
 const preview=buildQuizSummary({model:candidate,bank,scalesDoc,session:{...base(),completionStatus:'completed'}});
 const source=preview.rows.find(r=>r.id===rule.id).sources[0];
 assert.equal(source.claimScope,'rule_linked');
 assert.deepEqual(source.claimLinks,[{claim,relationship:'supports'}]);
 assert.equal(source.claim,null);
 assert.equal(model.commitments.find(c=>c.id===rule.id).sourceClaims,undefined);
});
test('Sacred-status evidence is mixed when answers conflict and does not imply divinity',()=>{
 const sacred='ph-sacred-value';
 assert.equal(state(run([answer('RCI012',2),answer('RCI029','some')]),sacred),'supported');
 assert.equal(state(run([answer('RCI012',-2),answer('RCI029','none')]),sacred),'opposed');
 assert.equal(state(run([answer('RCI012',2),answer('RCI029','symbolic')]),sacred),'mixed_context_dependent');
 assert.equal(state(run([answer('RCI012',2)]),sacred),'leaned_toward');
 assert.equal(state(run([answer('RCI012',null,'no_view'),answer('RCI029',null,'not_understood')]),
  sacred),'insufficient_evidence');
 const secular=run([answer('RCI012',2),answer('RCI029','some'),answer('RCI014',-2),answer('RCI021','low')]);
 assert.equal(state(secular,sacred),'supported');
 assert.equal(state(secular,'divine-existence'),'opposed');
 assert.equal(state(secular,'ph-religious-priority'),'insufficient_evidence');
 assert.ok(!secular.derived.some(d=>d.state==='supported'&&d.id==='derived-RC11-agentic-divine-outlook'));
});
test('Affinity stress examples consume interpreted propositions and preserve absent criteria',()=>{
 const examples=evaluateAffinityExamples({definitions:affinity.definitions,report:run()});
 assert.equal(examples.length,2);assert.ok(examples.every(x=>x.identityClaim===false&&x.percentage===null));
 assert.ok(examples.find(x=>x.id==='stress-objectivism').criteria.some(c=>c.ruleId==='construct-PL29'&&c.finding==='unmeasured'));
 assert.ok(examples.every(x=>x.criteria.every(c=>['overlap','divergence','unresolved','unmeasured'].includes(c.finding))));
});
test('Model and route reject revision drift and remain reproducible',()=>{
 const first=run([answer('RCI010',2),answer('RCI017',-2)]),second=run([answer('RCI010',2),answer('RCI017',-2)]);
 assert.deepEqual(first,second);
 const wrong=base();wrong.presentedItems[0].itemRevision++;
 assert.throws(()=>compareWorldview({model,bank,scalesDoc,input:wrong}));
 const wrongInstrument=base();wrongInstrument.instrumentVersion='other';
 assert.throws(()=>compareWorldview({model,bank,scalesDoc,input:wrongInstrument}));
 const old=compareWorldview({model:oldModel,bank,scalesDoc,input:base()});
 assert.equal(state(old,'audit2-RC05-miracles'),'not_measured');
 assert.equal(state(run(),'audit2-RC05-miracles'),'insufficient_evidence');
});
console.log(JSON.stringify({tests,pilot:manifest.pilotCandidateVersion,assignedItems:238,empiricalValidation:false},null,2));
