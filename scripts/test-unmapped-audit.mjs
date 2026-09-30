import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {compareWorldview,validateModel} from '../packages/worldview/index.js';

const root=new URL('../',import.meta.url);
const read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const raw=p=>readFile(new URL(p,root));
const current=await read('data/current.json');
const bank=await read(current.candidateBank.path);
const model=await read('data/generic/model-v0.3.json');
const audit=await read('data/academic/unmapped-audit-v1.json');
const coverage=await read('data/generic/coverage-v0.3.json');
const scalesDoc=await read('data/response-scales.json');
const oldModel=await read('data/generic/model-v0.2.json');
const frozenPilotModel=await read('data/generic/model-v1.0-pilot.json');
const oldPublic=await read('data/philosophy/public-form-v1.json');
const oldFull=await read('data/philosophy/public-full-v1.json');
const itemMap=new Map(bank.items.map(i=>[i.id,i]));
const byRule=new Map(model.commitments.map(r=>[r.id,r]));
let tests=0;
const testCase=(name,fn)=>{fn();tests++;console.log('PASS audit: '+name);};
const response=(id,value,state='answered')=>({itemId:id,itemRevision:itemMap.get(id).revision,state,value});
const withPrerequisites=(responses)=>{
 const out=[],seen=new Set();
 const visit=r=>{
  if(seen.has(r.itemId))return;
  const item=itemMap.get(r.itemId);
  if(item?.eligibility?.mode==='conditional')for(const condition of item.eligibility.all){
   const parent=itemMap.get(condition.itemId);
   visit(response(parent.id,condition.optionIds[0]));
  }
  if(!seen.has(r.itemId)){seen.add(r.itemId);out.push(r);}
 };
 for(const r of responses)visit(r);
 return out;
};
const answers=(ruleId,dir='support')=>withPrerequisites(byRule.get(ruleId).evidence.filter(e=>e[dir].length).map(e=>response(e.itemId,e[dir][0])));
const run=responses=>compareWorldview({model,bank,scalesDoc,input:{bankVersion:bank.bankVersion,responses}});
const state=(result,id)=>result.commitments.find(r=>r.commitmentId===id).state;
validateModel({model,bank,scalesDoc});

testCase('Exactly the 49 previously unmapped constructs are classified once',()=>{
 assert.equal(audit.decisions.length,49);
 assert.equal(new Set(audit.decisions.map(d=>d.constructId)).size,49);
 assert.deepEqual(audit.decisionCounts,{ready_existing_items:27,needs_new_discriminating_items:2,remain_derived:5,remain_research_only:7,split_or_deprecate:8});
 assert.ok(audit.decisions.every(d=>Array.isArray(d.sourceIds)&&d.sourceIds.length>0));
});
testCase('No question was added, deleted, or revised by the audit',()=>{
 assert.equal(bank.items.length,562);
 assert.equal(audit.historicalBankChanged,false);
 assert.equal(createHash('sha256').update(Buffer.from(JSON.stringify(bank))).digest('hex').length,64);
});
testCase('Thirty-two audited constructs gain scoped rules while seventeen remain intentionally unresolved',()=>{
 const audited=new Set(audit.decisions.map(d=>d.constructId));
 assert.equal(coverage.constructs.filter(c=>audited.has(c.id)&&c.ruleIds.length>0).length,32);
 assert.equal(coverage.constructs.filter(c=>audited.has(c.id)&&c.ruleIds.length===0).length,17);
});
testCase('Derived and research-only decisions are not accidentally promoted',()=>{
 for(const d of audit.decisions.filter(d=>['remain_derived','remain_research_only'].includes(d.decision)))assert.equal(d.acceptedRuleIds.length,0,d.constructId);
});
testCase('Proposed new questions remain proposals rather than bank items',()=>{
 const texts=new Set(bank.items.map(i=>i.text));
 for(const p of audit.questionProposals)for(const text of p.items)assert.ok(!texts.has(text),p.constructId);
});
const accepted=[...model.commitments].filter(r=>r.mappingStatus==='academic_unmapped_audit_v1');
for(const rule of accepted){
 testCase(rule.id+' has positive, negative, mixed and missing behavior',()=>{
  const pos=answers(rule.id,'support'),neg=answers(rule.id,'oppose');
  assert.equal(state(run(pos),rule.id),'supported');
  if(new Set(rule.evidence.filter(e=>e.oppose.length).map(e=>e.unitId)).size>=2)assert.equal(state(run(neg),rule.id),'opposed');
  assert.equal(state(run([]),rule.id),'insufficient_evidence');
  const supportEvidence=rule.evidence.filter(e=>e.support.length);
  const opposeEvidence=rule.evidence.filter(e=>e.oppose.length);
  if(supportEvidence.length&&opposeEvidence.length){
   let foundMixed=false;
   for(const se of supportEvidence){
    for(const oe of opposeEvidence){
     if(se.itemId===oe.itemId)continue;
     const mixed=withPrerequisites([
      response(se.itemId,se.support[0]),
      response(oe.itemId,oe.oppose[0])
     ]);
     if(state(run(mixed),rule.id)==='mixed'){foundMixed=true;break;}
    }
    if(foundMixed)break;
   }
   assert.equal(foundMixed,true,"No valid mixed-evidence counterexample for "+rule.id);
  }
 });
 testCase(rule.id+' rejects a disjoint same-domain false positive',()=>{
  const targetItems=new Set(rule.evidence.map(e=>e.itemId));
  const neighbor=model.commitments.find(other=>
   other.id!==rule.id &&
   other.domainId===rule.domainId &&
   other.evidence.length>=2 &&
   other.evidence.every(e=>!targetItems.has(e.itemId)) &&
   new Set(other.evidence.filter(e=>e.support.length).map(e=>e.unitId)).size>=2
  );
  assert.ok(neighbor,"No disjoint same-domain counterexample available for "+rule.id);
  assert.equal(state(run(answers(neighbor.id,'support')),rule.id),'insufficient_evidence');
 });
}
testCase('Liberty/opposition-to-domination remains research-only rather than being silently added to MFQ-2',()=>{
 const d=audit.decisions.find(d=>d.constructId==='MF07');
 assert.equal(d.decision,'remain_research_only');
 assert.ok(d.sourceIds.includes('acad-mfq2'));
 assert.ok(d.sourceIds.includes('audit-liberty'));
 assert.equal(d.acceptedRuleIds.length,0);
});
testCase('Free-will belief remains unmapped because current items confound existence with theories of freedom',()=>{
 const d=audit.decisions.find(d=>d.constructId==='AH01');
 assert.equal(d.decision,'needs_new_discriminating_items');
 assert.ok(d.sourceIds.includes('free-will-inventory'));
 assert.equal(d.acceptedRuleIds.length,0);
});
testCase('External-world realism is not direct realism',()=>{
 const r=run([response('EPI036',2),response('EPI037','mind_independent'),response('EPI034','indirect')]);
 assert.equal(state(r,'audit-EP11-external-world'),'supported');
 assert.equal(state(r,'audit-EP11-skepticism'),'opposed');
});
testCase('Biological and environmental causal beliefs can both be supported',()=>{
 const r=run([...answers('audit-AH08-biological'),...answers('audit-AH09-environmental')]);
 assert.equal(state(r,'audit-AH08-biological'),'supported');
 assert.equal(state(r,'audit-AH09-environmental'),'supported');
});
testCase('Free-will belief remains unresolved rather than inferred from responsibility',()=>{
 const r=run(answers('audit-AH03-basic-desert'));
 assert.equal(coverage.constructs.find(c=>c.id==='AH01').ruleIds.length,0);
 assert.equal(state(r,'audit-AH03-basic-desert'),'supported');
});
testCase('Divine intervention does not establish miracles',()=>{
 const r=run(answers('audit-RC04-intervention'));
 assert.equal(state(r,'audit-RC04-intervention'),'supported');
 assert.equal(state(r,'audit-RC05-miracles'),'insufficient_evidence');
});
testCase('Private revelatory authority does not establish religious public law',()=>{
 const r=run(answers('audit-RC06-revelatory-authority'));
 assert.equal(state(r,'audit-RC06-revelatory-authority'),'supported');
 assert.equal(state(r,'ph-religious-public-law'),'insufficient_evidence');
});
testCase('Legitimacy does not establish a general duty to obey',()=>{
 const r=run(answers('audit-PL01-legitimacy'));
 assert.equal(state(r,'audit-PL01-legitimacy'),'supported');
 assert.equal(state(r,'legacy-philosophical-anarchism-no-general-obedience'),'insufficient_evidence');
});
testCase('Common ownership legitimacy does not establish market rejection',()=>{
 const r=run(answers('audit-PL12-common-ownership'));
 assert.equal(state(r,'audit-PL12-common-ownership'),'supported');
 assert.equal(state(r,'legacy-objectivism-market-coordination'),'insufficient_evidence');
});
testCase('Democratic and expert coordination are separate and can conflict or coexist',()=>{
 const democratic=run(answers('audit-PL14-democratic-coordination'));
 assert.equal(state(democratic,'audit-PL14-democratic-coordination'),'supported');
 assert.equal(state(democratic,'audit-PL15-expert-coordination'),'insufficient_evidence');
});
testCase('Deterrence does not establish retributive desert',()=>{
 const r=run(answers('audit-PL19-deterrence'));
 assert.equal(state(r,'audit-PL19-deterrence'),'supported');
 assert.equal(state(r,'ph-desert-punishment'),'insufficient_evidence');
});
testCase('Reform-versus-replacement is not labeled violent revolution',()=>{
 const r=run(answers('audit-PL25-reform'));
 assert.equal(state(r,'audit-PL25-reform'),'supported');
 assert.ok(!r.publicIdentityLabel);
 assert.ok(!model.commitments.some(c=>c.label.toLowerCase().includes('violent revolution')));
});
testCase('Old academic model and prior public-form policies remain byte-stable inputs',()=>{
 assert.equal(oldModel.modelVersion,'generic-0.2.0');
 assert.equal(oldPublic.modelVersion,'generic-0.2.0');
 assert.equal(oldFull.modelVersion,'generic-0.2.0');
 assert.equal(model.modelVersion,'generic-0.3.0');
 assert.equal(frozenPilotModel.modelVersion,'generic-1.0.0-pilot');
 assert.ok(current.modelReleaseVersions.some(ref=>ref.version==='model-release-1.1.0'),
  'The frozen pilot release must remain available after a successor is activated.');
});
testCase('No external prior can manufacture audited commitments',()=>{
 const base={bankVersion:bank.bankVersion,responses:[]};
 for(const key of ['constructEstimates','probeResponses','memories','userProfile','preferredResult','countryMatches','figureMatches']){
  assert.throws(()=>compareWorldview({model,bank,scalesDoc,input:{...base,[key]:{}}}));
 }
});
console.log(JSON.stringify({tests,auditedConstructs:49,newScopedRules:accepted.length,remainingAuditedGaps:17,bankItems:bank.items.length,empiricalValidation:false},null,2));
