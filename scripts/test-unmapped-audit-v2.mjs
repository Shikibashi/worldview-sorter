import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareWorldview,validateModel} from '../packages/worldview/index.js';
import {generatePhilosophyPacket,auditPhilosophyPacket} from '../packages/philosophy/forms.js';
import {buildQuizSummary,createSharePreview} from '../packages/experience/summary.js';
import {createQuiz,seekQuestion,answerQuestion,nextQuestion} from '../packages/experience/quiz.js';

const root=new URL('../',import.meta.url);
const read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const current=await read('data/current.json');
const bank=await read(current.candidateBank.path),pilot=await read(current.pilot.path),scalesDoc=await read('data/response-scales.json');
const model=await read('data/generic/model-v0.4.json'),oldModel=await read('data/generic/model-v0.3.json');
const baseCoverage=await read('data/generic/coverage-v0.2.json');
const audit=await read(current.unmappedAcademicAudit.path),draft=await read(current.unmappedDraftItems.path);
const full=await read('data/philosophy/public-full-v1.2.json'),oldFull=await read('data/philosophy/public-full-v1.1.json');
const byItem=new Map(bank.items.map(i=>[i.id,i]));
const rules=model.commitments.filter(c=>c.mappingStatus==='academic_unmapped_audit_v2');
let tests=0;
const test=(name,fn)=>{fn();tests++;console.log('PASS audit v2: '+name);};
const response=(e,value,state='answered')=>({itemId:e.itemId,itemRevision:e.itemRevision,state,value});
const prerequisiteClosure=responses=>{
 const out=[],seen=new Set();
 const visit=r=>{
  if(seen.has(r.itemId))return;
  const item=byItem.get(r.itemId);
  for(const condition of item?.eligibility?.all??[]){const parent=byItem.get(condition.itemId);visit({itemId:parent.id,itemRevision:parent.revision,state:'answered',value:condition.optionIds[0]});}
  seen.add(r.itemId);out.push(r);
 };
 for(const r of responses)visit(r);
 return out;
};
const answers=(rule,direction)=>prerequisiteClosure(rule.evidence.filter(e=>e[direction].length).map(e=>response(e,e[direction][0])));
const run=(responses=[],extra={})=>compareWorldview({model,bank,scalesDoc,input:{bankVersion:bank.bankVersion,responses,...extra}});
const state=(report,id)=>report.commitments.find(c=>c.commitmentId===id).state;
const present=ids=>ids.map(itemId=>({itemId,itemRevision:byItem.get(itemId).revision,presented:true,skippedByBranch:false}));
validateModel({model,bank,scalesDoc});

test('Every original gap has one explicit disposition',()=>{
 const original=baseCoverage.constructs.filter(c=>!c.ruleIds.length).map(c=>c.id).sort();
 assert.equal(audit.decisions.length,49);
 assert.deepEqual(audit.decisions.map(d=>d.constructId).sort(),original);
 assert.deepEqual(audit.decisionCounts,{derived_only:5,directly_interpretable:15,requires_new_discriminating_items:2,research_only:7,split:8,unresolved:12});
 assert.equal(rules.length,17);
 assert.ok(audit.decisions.every(d=>d.construct&&d.candidateItems&&d.academicSources.length&&d.neighborConstructs));
});
test('Draft questions have new IDs and cannot silently enter released packets',()=>{
 assert.deepEqual(draft.items.map(i=>i.id),['EPI118','AHI106']);
 assert.equal(bank.items.length,562);
 assert.ok(draft.items.every(i=>!byItem.has(i.id)&&i.revision===1&&i.provenance.copiedText===false));
 assert.ok(full.bundles.every(b=>b.itemIds.every(id=>byItem.has(id))));
});
test('Old model and forms remain versioned and evaluate by their old engine',()=>{
 assert.equal(oldModel.modelVersion,'generic-0.3.0');
 assert.equal(oldModel.engineVersion,'generic-evidence-1');
 assert.equal(oldFull.modelVersion,oldModel.modelVersion);
 const old=compareWorldview({model:oldModel,bank,scalesDoc,input:{bankVersion:bank.bankVersion,responses:[]}});
 assert.ok(old.commitments.every(c=>c.state==='insufficient_evidence'));
 assert.equal(state(run([]),rules[0].id),'not_measured');
 const withdrawn=oldModel.commitments.find(c=>c.id==='audit-EX04-nihilism');
 assert.ok(withdrawn);
 assert.ok(!model.commitments.some(c=>c.id==='audit-EX04-nihilism'));
 const priorInputs=prerequisiteClosure(withdrawn.evidence.filter(e=>e.support.length).map(e=>response(e,e.support[0])));
 assert.equal(state(compareWorldview({model:oldModel,bank,scalesDoc,input:{bankVersion:bank.bankVersion,responses:priorInputs}}),withdrawn.id),'supported');
 assert.throws(()=>run([{itemId:'AHI001',itemRevision:1,state:'answered',value:2}]));
});
test('A single unit cannot make an unaudited inherited rule lean',()=>{
 const inherited=model.commitments.find(c=>c.mappingStatus!=='academic_unmapped_audit_v2'&&c.evidence[0].support.length);
 const first=inherited.evidence[0];
 assert.equal(state(run(prerequisiteClosure([response(first,first.support[0])])),inherited.id),'insufficient_evidence');
});
test('A one-unit lean records its direction without inventing a percentage',()=>{
 const r=rules.find(c=>c.id==='audit2-RC05-miracles');
 const first=r.evidence.find(e=>e.oppose.length);
 const c=run(prerequisiteClosure([response(first,first.oppose[0])])).commitments.find(x=>x.commitmentId===r.id);
 assert.equal(c.state,'leaned_toward');assert.equal(c.leanDirection,'oppose');
 assert.equal(typeof c.percentage,'undefined');
});
for(const rule of rules){
 test(rule.id+' positive, negative, mixed, partial and missing evidence',()=>{
  assert.equal(state(run(answers(rule,'support')),rule.id),'supported');
  assert.equal(state(run(answers(rule,'oppose')),rule.id),'opposed');
  assert.equal(state(run([]),rule.id),'not_measured');
  const first=rule.evidence.find(e=>e.support.length);
  assert.equal(state(run(prerequisiteClosure([response(first,first.support[0])])),rule.id),'leaned_toward');
  const noView=prerequisiteClosure([response(first,null,'no_view')]);
  assert.equal(state(run(noView),rule.id),'insufficient_evidence');
  assert.equal(state(run([],{presentedItems:present(rule.evidence.map(e=>e.itemId))}),rule.id),'insufficient_evidence');
  let mixed=null;
  for(const s of rule.evidence.filter(e=>e.support.length)){
   for(const o of rule.evidence.filter(e=>e.oppose.length&&e.itemId!==s.itemId)){
    mixed=prerequisiteClosure([response(s,s.support[0]),response(o,o.oppose[0])]);
    if(state(run(mixed),rule.id)==='mixed_context_dependent')break;
   }
   if(mixed&&state(run(mixed),rule.id)==='mixed_context_dependent')break;
  }
  assert.ok(mixed&&state(run(mixed),rule.id)==='mixed_context_dependent');
  assert.equal(rule.interpretationKind,'direct_interpretable_proposition');
  assert.ok(rule.neighbors.length&&rule.nonEntailments.length&&rule.falsePositives.length);
 });
}
test('One natural explanation never opposes general intervention or miracle possibility',()=>{
 const intervention=run([{itemId:'RCI026',itemRevision:1,state:'answered',value:'natural_only'}]);
 const miracle=run([{itemId:'RCI027',itemRevision:1,state:'answered',value:'natural_only'}]);
 assert.equal(state(intervention,'audit2-RC04-intervention'),'not_measured');
 assert.equal(state(miracle,'audit2-RC05-miracles'),'not_measured');
});
test('Indirect perception, conditional purpose and local priority do not manufacture neighboring views',()=>{
 assert.equal(state(run([{itemId:'EPI034',itemRevision:1,state:'answered',value:'indirect'}]),'audit2-EP11-external-world'),'insufficient_evidence');
 assert.equal(state(run([{itemId:'EXI012',itemRevision:1,state:'answered',value:'divine'}]),'audit2-EX02-nondesigner-purpose'),'insufficient_evidence');
 assert.equal(state(run([{itemId:'SOI005',itemRevision:2,state:'answered',value:-2}]),'audit2-SO09-moral-scope'),'not_measured');
});
test('Excluded broad propositions remain explicit coverage gaps',()=>{
 for(const id of ['EP05','AH03','AH04','AH06','RC06','EX04','SO04','SO10','SO12','PL01','PL12','PL14','PL15','PL19']){
  const d=audit.decisions.find(x=>x.constructId===id);
  assert.ok(d);assert.equal(d.acceptedRuleIds.length,0,id);
  assert.equal(model.coverage.constructs.find(x=>x.id===id).ruleIds.length,0,id);
 }
});
test('Mirrored centralization responses can be contradictory without doubling the unit',()=>{
 const rs=[{itemId:'PLI003',itemRevision:1,state:'answered',value:2},{itemId:'PLI004',itemRevision:1,state:'answered',value:2}];
 const c=run(rs).commitments.find(x=>x.commitmentId==='audit2-PL05-decentralization');
 assert.equal(c.state,'mixed_context_dependent');
 assert.equal(c.supportingUnits,1);assert.equal(c.opposingUnits,1);
});
test('Full route provides opportunities for reviewed rules while preserving 240 distinct questions',()=>{
 for(let n=0;n<20;n++){
  const packet=generatePhilosophyPacket({bank,pilot,policy:full,seed:'audit-v2-test-'+n,size:240});
  assert.equal(new Set(packet.entries.map(e=>e.itemId)).size,240);
  assert.ok(auditPhilosophyPacket(packet,full).allRequired);
  const ids=new Set(packet.entries.map(e=>e.itemId));
  for(const rule of rules)assert.ok(new Set(rule.evidence.filter(e=>ids.has(e.itemId)).map(e=>e.unitId)).size>=2,rule.id);
 }
 assert.ok(Object.values(audit.routeOpportunity.rules).every(r=>r.packetsWithTwoDistinctUnits===100));
});
test('Evidence states reach summary and sharing without fabricated percentages',()=>{
 const quiz=createQuiz({bank,pilot,scalesDoc,formPolicy:full,seed:'summary-v2',size:240,sessionId:'summary-v2'});
 let item=seekQuestion(quiz,bank);
 while(item){answerQuestion(quiz,bank,scalesDoc,{state:'no_view',value:null});item=nextQuestion(quiz,bank);}
 const summary=buildQuizSummary({model,bank,scalesDoc,session:quiz.session});
 assert.ok(summary.rows.some(r=>r.status==='insufficient_evidence'));
 assert.ok(summary.rows.some(r=>r.status==='not_measured'));
 assert.equal(summary.matchPercent,null);
 const unmeasured=summary.rows.find(r=>r.status==='not_measured');
 assert.throws(()=>createSharePreview(summary,[unmeasured.id]));
});
console.log(JSON.stringify({tests,auditedConstructs:49,reviewedRules:rules.length,bankItems:bank.items.length,
 empiricalValidation:false},null,2));
