import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {rules} from '../data/philosophy/research-v1.mjs';
import {compareWorldview} from '../packages/worldview/index.js';
import {generatePhilosophyPacket,auditPhilosophyPacket} from '../packages/philosophy/forms.js';
import {generatePilotPacket} from '../packages/runtime/index.js';
import {createQuiz,restoreQuiz,seekQuestion,currentItem,answerQuestion,nextQuestion} from '../packages/experience/quiz.js';
import {buildQuizSummary} from '../packages/experience/summary.js';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const bank=await read('data/items/candidate-v0.9.json'),pilot=await read('data/pilots/pilot-0.2.json'),model=await read('data/generic/model-v0.2.json'),policy=await read('data/philosophy/public-form-v1.json'),scalesDoc=await read('data/response-scales.json');
const report=await read('data/philosophy/release-v1.json');
const byItem=new Map(bank.items.map(i=>[i.id,i])),byScale=new Map(scalesDoc.scales.map(s=>[s.id,s]));
const byRule=new Map(model.commitments.map(c=>[c.id,c]));let cases=0,packets=0;
const test=(n,fn)=>{fn();cases++;console.log('PASS philosophy: '+n);};
const input=responses=>({bankVersion:bank.bankVersion,responses});
const answer=(id,value,state='answered')=>({itemId:id,itemRevision:byItem.get(id).revision,state,value});
const support=id=>byRule.get(id).evidence.map(e=>answer(e.itemId,e.support[0]));
const run=responses=>compareWorldview({bank,scalesDoc,model,input:input(responses)});
const state=(result,id)=>result.commitments.find(c=>c.commitmentId===id).state;
test('Separate, explicit ontology, metaphysics, metaethics, ethics and political facets',()=>{
 assert.equal(model.facets.length,31);assert.equal(new Set(model.facets.map(f=>f.domainId)).size,12);
 for(const id of ['ontology','metaontology','metaphysical-structure','laws-causation','time-modality','meta-status','meta-reasons','ethics-foundations','political-authority','political-economy','political-justice'])assert.ok(policy.facets.some(f=>f.id===id));
});
test('Each new interpretation has verifiable source, item-revision and explicit response mappings',()=>{
 for(const c of rules){const rule=byRule.get(c.id);assert.ok(rule&&rule.evidence.length>=2);for(const s of rule.sourceIds)assert.ok(model.sources.some(x=>x.id===s));for(const e of rule.evidence)assert.equal(e.itemRevision,byItem.get(e.itemId).revision);}
});
for(const c of rules)test(c.id+' recovers only its authored proposition',()=>{const result=run(support(c.id));assert.equal(state(result,c.id),'supported');assert.equal(result.publicIdentityLabel,null);assert.equal(result.selectedProfileId,null);assert.equal(result.percentageMatchAllowed,false);assert.equal(state(run(support(c.id).slice(0,1)),c.id),'insufficient_evidence');});
test('Universality is not treated as evidence of moral realism',()=>{const r=run(support('ph-universal-requirements'));assert.equal(state(r,'ph-stance-independence'),'insufficient_evidence');});
test('Context sensitivity can coexist with universal requirements',()=>{const r=run([...support('ph-context-sensitive'),...support('ph-universal-requirements')]);assert.equal(state(r,'ph-context-sensitive'),'supported');assert.equal(state(r,'ph-universal-requirements'),'supported');});
test('Motivational disagreement is mixed, not a hidden anti-realist identity',()=>{const r=run([answer('MEI020',2),answer('MEI022','independent')]);assert.equal(state(r,'ph-motivational-necessity'),'mixed');assert.equal(state(r,'ph-stance-independence'),'insufficient_evidence');});
test('Growing-block answer is not recoded as eternalism or abstract-object rejection',()=>{const r=run([answer('OMI026',-2),answer('OMI027','growing')]);assert.equal(state(r,'ph-eternal-time'),'opposed');assert.equal(state(r,'construct-OM11'),'insufficient_evidence');assert.equal(state(r,'deterministic-world'),'insufficient_evidence');});
test('Rejecting concrete worlds does not identify a unique modal alternative',()=>{const r=run([answer('OMI029',-2),answer('OMI030','fictional')]);assert.equal(state(r,'ph-concrete-worlds'),'opposed');assert.equal(r.selectedProfileId,null);});
test('Scientific realism permits successful false theories',()=>{const r=run([...support('ph-scientific-realism'),answer('EPI022',2)]);assert.equal(state(r,'ph-scientific-realism'),'supported');});
test('A limitation on knowledge is not total skepticism',()=>{const r=run([answer('EPI015',2)]);assert.ok(r.commitments.every(c=>c.state==='insufficient_evidence'));});
test('Physical explanation and explanatory gaps are not automatic full-system identities',()=>{const r=run([answer('MSI001',-2),answer('MSI006',2),answer('MSI010','explanatory_gap')]);assert.equal(state(r,'ph-physical-explanation'),'opposed');assert.equal(state(r,'physical-reality'),'insufficient_evidence');});
test('A functional explanatory gap alone cannot reject eventual physical explanation',()=>{const r=run([answer('MSI001',2),answer('MSI010','explanatory_gap')]);assert.equal(state(r,'ph-physical-explanation'),'insufficient_evidence');});
test('A value-free evidential ideal can coexist with value-guided research priorities',()=>{const r=run([answer('EPI043',2),answer('EPI045','exclude')]);assert.equal(state(r,'ph-values-science'),'insufficient_evidence');});
test('Legal validity and political obligation can diverge',()=>{const r=run([...support('source-based-validity'),...support('legacy-philosophical-anarchism-no-general-obedience')]);assert.equal(state(r,'source-based-validity'),'supported');assert.equal(state(r,'legacy-philosophical-anarchism-no-general-obedience'),'supported');});
test('Private divine belief supplies no answer about religious law',()=>{const r=run(support('divine-existence'));assert.equal(state(r,'ph-religious-public-law'),'insufficient_evidence');});
test('No-view and neutral responses cannot fill new philosophical commitments',()=>{for(const c of rules){const r=run(c.evidence.map(e=>answer(e.itemId,null,'no_view')));assert.equal(state(r,c.id),'insufficient_evidence');}});
test('Public exclusion removes problematic wording, never deletes history',()=>{assert.equal(policy.excludedItemIds.length,10);for(const id of policy.excludedItemIds)assert.ok(byItem.has(id));assert.ok(policy.excludedItemIds.includes('EPI025'));});
let legacyFacetCoverage=0,newFacetCoverage=0,completeOpportunities=0;
for(const size of [80,120,160])test('100 seeded '+size+'-question blueprints preserve every facet and format',()=>{
 for(let n=0;n<100;n++){
  const seed='philosophy-'+size+'-'+n,p=generatePhilosophyPacket({bank,pilot,policy,seed,size}),check=auditPhilosophyPacket(p,policy);
  assert.ok(check.allRequired,seed);assert.equal(p.size,size);assert.equal(new Set(p.entries.map(e=>e.itemId)).size,size);
  assert.ok(p.entries.every(e=>!policy.excludedItemIds.includes(e.itemId)));
  assert.equal(new Set(p.entries.map(e=>e.responseScaleId)).size,7);
  assert.deepEqual(generatePhilosophyPacket({bank,pilot,policy,seed,size}),p);
  const index=new Map(p.entries.map(e=>[e.itemId,e.index]));
  for(let i=0;i<p.entries.length;i++){
   const item=byItem.get(p.entries[i].itemId);
   assert.equal(item.revision,p.entries[i].itemRevision);
   if(i>=2)assert.ok(new Set(p.entries.slice(i-2,i+1).map(e=>e.domainId)).size>1);
   if(i){const prev=byItem.get(p.entries[i-1].itemId);for(const k of ['mirrorGroup','scenarioGroup'])assert.ok(!item[k]||prev[k]!==item[k]);}
   if(item.eligibility.mode==='conditional')for(const c of item.eligibility.all)assert.ok(index.get(c.itemId)<i);
  }
  // This measures item opportunity only, never accuracy or latent reliability.
  if(size===80){
   const old=generatePilotPacket({bank,pilot,seed,size});legacyFacetCoverage+=auditPhilosophyPacket(old,policy).facets.filter(f=>f.completeBundles.length>=f.minimumBundles).length;
   newFacetCoverage+=check.facets.filter(f=>f.completeBundles.length>=f.minimumBundles).length;
   const ids=new Set(p.entries.map(e=>e.itemId));completeOpportunities+=model.commitments.filter(c=>new Set(c.evidence.filter(e=>ids.has(e.itemId)).map(e=>e.unitId)).size>=c.minimumEvidenceUnits).length;
  }
  packets++;
 }
});
test('Versions distinguish new public forms from unchanged research-pilot forms',()=>{
 assert.notEqual(policy.instrumentVersion,pilot.sourceInstrumentVersion);assert.notEqual(policy.administrationId,pilot.pilotId);
 const p=generatePhilosophyPacket({bank,pilot,policy,seed:'version-check',size:80});assert.equal(p.formPolicyVersion,policy.policyVersion);
 assert.throws(()=>generatePhilosophyPacket({bank,pilot,policy:{...policy,bankVersion:'wrong'},seed:'wrong',size:80}));
});
const choose=item=>['likert','paired_choice'].includes(item.responseType)?0:item.responseType==='ranking'?item.options.map(o=>o.id):item.options[0].id;
for(const size of [80,120,160])test('Take, save, resume and summarize the new '+size+'-question form',()=>{
 let q=createQuiz({bank,pilot,scalesDoc,formPolicy:policy,seed:'public-flow-'+size,size,sessionId:'test-public-'+size});
 seekQuestion(q,bank);let safety=0;
 while(q.index!==null){assert.ok(safety++<size+1);const item=currentItem(q,bank);answerQuestion(q,bank,scalesDoc,{state:'answered',value:choose(item),responseTimeMs:100});nextQuestion(q,bank);if(safety===20)q=restoreQuiz(q,{bank,pilot,scalesDoc,formPolicy:policy});}
 assert.equal(q.session.instrumentVersion,policy.instrumentVersion);assert.equal(q.session.completionStatus,'completed');
 assert.deepEqual(restoreQuiz(q,{bank,pilot,scalesDoc,formPolicy:policy}),q);
 const before=JSON.stringify(q.session),s=buildQuizSummary({model,bank,scalesDoc,session:q.session});
 assert.equal(JSON.stringify(q.session),before);assert.equal(s.domains.length,12);assert.equal(s.domains.flatMap(d=>d.facets).length,31);
 const answered=new Set(q.session.responses.map(response=>response.itemId));
 for(const facet of s.domains.flatMap(domain=>domain.facets)){
  const facetRuleIds=model.facets.find(source=>source.id===facet.id).ruleIds;
  const publicEvidence=new Set(facetRuleIds.flatMap(id=>{
   const rule=byRule.get(id);
   return rule.tier==='research'?[]:rule.evidence.filter(e=>answered.has(e.itemId)).map(e=>e.itemId);
  }));
  assert.equal(facet.answeredItems,publicEvidence.size,facet.id);
 }
 assert.ok(s.rows.every(row=>byRule.get(row.id)?.tier!=='research'));
 assert.equal(s.identity,null);assert.equal(s.matchPercent,null);
 const bad=structuredClone(q);bad.packet.formPolicyVersion='unknown';assert.throws(()=>restoreQuiz(bad,{bank,pilot,scalesDoc,formPolicy:policy}));
});
test('Historical quiz envelopes restore with the old packet algorithm',()=>{
 const old=createQuiz({bank,pilot,scalesDoc,seed:'historical-backup',size:80,sessionId:'old-backup-test'});seekQuestion(old,bank);
 assert.deepEqual(restoreQuiz(old,{bank,pilot,scalesDoc,formPolicy:policy}),old);
});
for(const [p,h] of Object.entries(report.frozenSourceHashes)){
 const currentHash=createHash('sha256').update(await readFile(new URL(p,root))).digest('hex');
 test('Preserve historical bytes: '+p,()=>assert.equal(currentHash,h));
}
console.log(JSON.stringify({philosophyTests:cases,packets,shortRouteMeanRequiredFacetsBefore:legacyFacetCoverage/100,shortRouteMeanRequiredFacetsAfter:newFacetCoverage/100,shortRouteMeanCompleteCommitmentOpportunities:completeOpportunities/100,measurement:'Deterministic selection coverage only; not reliability, enjoyment or classification accuracy.'},null,2));
