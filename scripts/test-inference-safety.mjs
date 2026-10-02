import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createQuiz,seekQuestion,currentItem,answerQuestion,nextQuestion} from '../packages/experience/quiz.js';
import {compareWorldview} from '../packages/worldview/index.js';
import {evaluatePhilosophicalAffinities,validateAffinityCatalog} from '../packages/worldview/affinities.js';

// Synthetic software-contract fixtures only. These cases do not estimate
// human response behavior, reliability, validity, or psychometric quality.
const root=new URL('../',import.meta.url),read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const current=await read('data/current.json');
const [bank,pilot,scalesDoc,model,policy,catalog,pilotManifest]=await Promise.all([
 read(current.candidateBank.path),read(current.pilot.path),read('data/response-scales.json'),
 read(current.worldviewModel.path),read(current.progressiveDepth.path),read(current.affinityCatalog.path),
 read(current.pilotCandidate.path)
]);
const itemById=new Map(bank.items.map(item=>[item.id,item]));
const scaleById=new Map(scalesDoc.scales.map(scale=>[scale.id,scale]));
const publicIds=new Set(model.publicRuleIds);
const fixedTime='2026-01-01T00:00:00.000Z';

const newQuiz=(size,seed)=>{
 const quiz=createQuiz({bank,pilot,scalesDoc,formPolicy:policy,seed,size,sessionId:`inference-safety-${size}-${seed}`});
 seekQuestion(quiz,bank,0,fixedTime);
 return quiz;
};
const fill=(quiz,answers=new Map())=>{
 let steps=0;
 while(quiz.index!==null){
  assert.ok(++steps<=quiz.packet.size+2,'synthetic administration must terminate');
  const item=currentItem(quiz,bank),answer=answers.get(item.id)??{state:'no_view',value:null};
  answerQuestion(quiz,bank,scalesDoc,{...answer,answeredAt:fixedTime});
  nextQuestion(quiz,bank);
 }
 return quiz;
};
const compare=quiz=>compareWorldview({model,bank,scalesDoc,input:quiz.session,routeManifest:policy});
const affinity=report=>evaluatePhilosophicalAffinities({catalog,report,model,pilot:pilotManifest});
const reportState=(report,id)=>report.commitments.find(row=>row.commitmentId===id)?.state;
const mappedState=(report,id)=>report.commitments.find(row=>row.commitmentId===id)?.state??
 report.derived.find(row=>row.id===id)?.state;
const opposite=state=>state==='supported'?'opposed':'supported';

let checks=0;
const check=(name,fn)=>{fn();checks++;console.log(`PASS inference safety: ${name}`);};

check('route omission remains not measured and deeper routes add evidence without treating omission as opposition',()=>{
 const rows=policy.routes.map(route=>{
  const quiz=fill(newQuiz(route.size,`omission-${route.id}`));
  const report=compare(quiz),presented=new Map(quiz.session.presentedItems.map(entry=>[entry.itemId,entry]));
  for(const rule of model.commitments.filter(row=>publicIds.has(row.id))){
   const available=rule.evidence.filter(e=>presented.get(e.itemId)?.presented&&!presented.get(e.itemId)?.skippedByBranch);
   const supportUnits=new Set(available.filter(e=>e.support.length).map(e=>e.unitId)).size;
   const opposeUnits=new Set(available.filter(e=>e.oppose.length).map(e=>e.unitId)).size;
   const result=report.commitments.find(row=>row.commitmentId===rule.id);
   if(supportUnits<rule.minimumEvidenceUnits||opposeUnits<rule.minimumEvidenceUnits){
    assert.equal(result.state,'not_measured',`${route.id} omission/branching must remain not_measured for ${rule.id}`);
    assert.equal(result.measurementStatus,'not_measured_content');
    assert.ok(!['supported','opposed','mixed_context_dependent'].includes(result.state));
   }
   assert.equal(result.supportingUnits,0,`all-no-view fixture cannot support ${rule.id}`);
   assert.equal(result.opposingUnits,0,`all-no-view fixture cannot oppose ${rule.id}`);
  }
  return {route,report};
 });
 for(let index=1;index<rows.length;index++){
  const previous=rows[index-1].report,currentReport=rows[index].report;
  const newlyAssessable=model.publicRuleIds.filter(id=>reportState(previous,id)==='not_measured'&&
   reportState(currentReport,id)==='insufficient_evidence');
  assert.ok(newlyAssessable.length>0,
   `${rows[index].route.id} should turn some route omission into observed-but-insufficient evidence`);
 }
});

function randomGenerator(seed){
 let state=(seed>>>0)||1;
 return ()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
}
function patternAnswers(route,kind,seed=1){
 const refs=route.itemRefs,answers=new Map(),random=randomGenerator(seed);
 for(let index=0;index<refs.length;index++){
  const item=itemById.get(refs[index].itemId),scale=scaleById.get(item.responseScaleId);
  const special={state:'no_view',value:null};
  let answer=special;
  if(kind==='all-no-view')answer=special;
  else if(kind==='all-neutral'){
   answer=['agreement5','paired5'].includes(item.responseScaleId)?{state:'answered',value:0}:special;
  }else if(kind==='always-agree'){
   answer=item.responseScaleId==='agreement5'?{state:'answered',value:2}:special;
  }else if(kind==='always-disagree'){
   answer=item.responseScaleId==='agreement5'?{state:'answered',value:-2}:special;
  }else if(kind==='alternating-extremes'){
   if(['agreement5','paired5'].includes(item.responseScaleId))answer={state:'answered',value:index%2?-2:2};
   else if(item.responseType==='single_choice'||item.responseType==='vignette_choice'){
    answer={state:'answered',value:item.options[index%2?item.options.length-1:0].id};
   }else if(item.responseType==='ranking'){
    const ids=item.options.map(option=>option.id);answer={state:'answered',value:index%2?ids.reverse():ids};
   }
  }else if(kind==='seeded-random-like'){
   if(item.responseType==='likert'||item.responseType==='paired_choice'){
    const options=scale.options;answer={state:'answered',value:options[Math.floor(random()*options.length)].value};
   }else if(item.responseType==='single_choice'||item.responseType==='vignette_choice'){
    answer={state:'answered',value:item.options[Math.floor(random()*item.options.length)].id};
   }else if(item.responseType==='ranking'){
    const ids=item.options.map(option=>option.id);
    for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
    answer={state:'answered',value:ids};
   }
  }
  answers.set(item.id,answer);
 }
 return answers;
}

check('pathological response-style fixtures stay deterministic and cannot create identity or match scores',()=>{
 for(const kind of ['always-agree','always-disagree','all-neutral','all-no-view','alternating-extremes','seeded-random-like']){
  const answers=patternAnswers(policy.routes.at(-1),kind,0x5eed);
  const first=compare(fill(newQuiz( policy.routes.at(-1).size,`${kind}-a`),answers));
  const second=compare(fill(newQuiz(policy.routes.at(-1).size,`${kind}-b`),patternAnswers(policy.routes.at(-1),kind,0x5eed)));
  assert.deepEqual(first.commitments,second.commitments,`${kind} must be reproducible for identical answers`);
  assert.deepEqual(first.derived,second.derived);
  const evaluated=affinity(first);
  assert.equal(evaluated.identity,null);assert.equal(evaluated.matchPercent,null);assert.equal(evaluated.ranking,null);
  assert.ok(evaluated.traditions.every(tradition=>tradition.identityClaim===false&&tradition.percentage===null));
  assert.ok(first.commitments.every(row=>publicIds.has(row.commitmentId)||row.tier==='research'));
  if(kind==='all-neutral'||kind==='all-no-view'){
   assert.ok(first.commitments.every(row=>row.supportingUnits===0&&row.opposingUnits===0),
    `${kind} must not become directional evidence`);
  }
 }
});

check('permutation of identical raw response records leaves interpretation and all tradition comparisons unchanged',()=>{
 const quiz=fill(newQuiz(policy.routes.at(-1).size,'order-invariance'),patternAnswers(policy.routes.at(-1),'seeded-random-like',7331));
 const original=compare(quiz),reorderedInput={...quiz.session,responses:[...quiz.session.responses].reverse()};
 const reordered=compareWorldview({model,bank,scalesDoc,input:reorderedInput,routeManifest:policy});
 assert.deepEqual(reordered,original);
 assert.deepEqual(affinity(reordered),affinity(original));
});

check('an unrelated unconditional answer cannot alter its target proposition or affinity criterion',()=>{
 const target=model.commitments.find(rule=>rule.id==='construct-EP15');assert.ok(target);
 const support=[...new Map(target.evidence.filter(e=>e.support.length).map(e=>[e.unitId,e])).values()].slice(0,target.minimumEvidenceUnits);
 assert.equal(support.length,target.minimumEvidenceUnits);
 const fullIds=new Set(policy.routes.at(-1).itemRefs.map(ref=>ref.itemId));
 const affectedPropositions=new Set([target.id]),affectedItems=new Set(target.evidence.map(e=>e.itemId));
 let expanded=true;
 while(expanded){
  expanded=false;
  for(const derived of model.derivedRules){
   if(affectedPropositions.has(derived.id)||!derived.requires.some(dependency=>affectedPropositions.has(dependency.ruleId)))continue;
   affectedPropositions.add(derived.id);expanded=true;
   for(const conflict of derived.directConflictAnswers??[])affectedItems.add(conflict.itemId);
  }
 }
 const pending=[...affectedItems];
 while(pending.length){
  const item=itemById.get(pending.pop());
  for(const condition of item?.eligibility?.all??[])if(!affectedItems.has(condition.itemId)){
   affectedItems.add(condition.itemId);pending.push(condition.itemId);
  }
 }
 const prerequisites=new Set(bank.items.flatMap(item=>item.eligibility.mode==='conditional'?item.eligibility.all.map(c=>c.itemId):[]));
 const unrelated=policy.routes.at(-1).itemRefs.map(ref=>itemById.get(ref.itemId)).find(item=>
  item.eligibility.mode==='always'&&!affectedItems.has(item.id)&&!prerequisites.has(item.id)&&
  !support.some(e=>e.itemId===item.id)&&fullIds.has(item.id));
 assert.ok(unrelated,'fixture requires an unconditional item outside the target evidence path');
 const answers=new Map(support.map(e=>[e.itemId,{state:'answered',value:e.support[0]}]));
 const changed=new Map(answers);
 const scale=scaleById.get(unrelated.responseScaleId);
 const firstValue=unrelated.responseType==='likert'||unrelated.responseType==='paired_choice'?
  scale.options[0].value:unrelated.responseType==='ranking'?unrelated.options.map(o=>o.id):unrelated.options[0].id;
 const lastValue=unrelated.responseType==='likert'||unrelated.responseType==='paired_choice'?
  scale.options.at(-1).value:unrelated.responseType==='ranking'?unrelated.options.map(o=>o.id).reverse():unrelated.options.at(-1).id;
 answers.set(unrelated.id,{state:'answered',value:firstValue});changed.set(unrelated.id,{state:'answered',value:lastValue});
 const left=compare(fill(newQuiz(policy.routes.at(-1).size,'unrelated-left'),answers));
 const right=compare(fill(newQuiz(policy.routes.at(-1).size,'unrelated-right'),changed));
 assert.equal(reportState(left,target.id),'supported');assert.equal(reportState(right,target.id),'supported');
 for(const id of affectedPropositions)assert.equal(mappedState(left,id),mappedState(right,id),`${id} dependency must be independent`);
 const targetCriteria=catalog.traditions.flatMap(t=>t.commitments.filter(c=>affectedPropositions.has(c.mapping.propositionId))
  .map(c=>({traditionId:t.id,criterionId:c.id})));
 const leftAffinity=affinity(left),rightAffinity=affinity(right);
 for(const ref of targetCriteria){
  const get=result=>result.traditions.find(t=>t.id===ref.traditionId).criteria.find(c=>c.id===ref.criterionId);
  assert.deepEqual(get(leftAffinity),get(rightAffinity));
 }
});

function setMappedState(report,criterion,state){
 const collection=criterion.mapping.status==='derived'?'derived':'commitments';
 const id=criterion.mapping.propositionId;
 const row=report[collection].find(candidate=>
  collection==='derived'?candidate.id===id:candidate.commitmentId===id);
 assert.ok(row,`missing interpretation row for ${criterion.id}`);
 row.state=state;
}
function alignedReport(base,tradition){
 const report=structuredClone(base);
 for(const criterion of tradition.commitments){
  if(['direct','derived'].includes(criterion.mapping.status))
   setMappedState(report,criterion,criterion.mapping.expectedState);
 }
 return report;
}

check('every direct defining criterion has a counterfactual divergence gate; characteristic changes never act as defining gates',()=>{
 assert.equal(validateAffinityCatalog({catalog,model,pilot:pilotManifest}),true);
 const blank=compare(fill(newQuiz(policy.routes.at(-1).size,'criterion-fixture')));
 for(const tradition of catalog.traditions){
  const directDefining=tradition.commitments.filter(c=>c.role==='defining'&&c.mapping.status==='direct');
  if(!directDefining.length)continue;
  const baselineReport=alignedReport(blank,tradition);
  const baseline=affinity(baselineReport).traditions.find(row=>row.id===tradition.id);
  const flipped=structuredClone(baselineReport);
  setMappedState(flipped,directDefining[0],opposite(directDefining[0].mapping.expectedState));
  const divergence=affinity(flipped).traditions.find(row=>row.id===tradition.id);
  assert.equal(divergence.summaryState,'material_divergence',`${tradition.id} defining counterfactual`);
  const characteristic=tradition.commitments.find(c=>c.role==='characteristic'&&['direct','derived'].includes(c.mapping.status));
  if(characteristic){
   const changed=structuredClone(baselineReport);
   setMappedState(changed,characteristic,opposite(characteristic.mapping.expectedState));
   const result=affinity(changed).traditions.find(row=>row.id===tradition.id);
   assert.equal(result.summaryState,baseline.summaryState,
    `${tradition.id} characteristic evidence cannot trigger defining divergence`);
  }
 }
});

check('catalog entries share a validated comparison contract and simultaneous overlap never forces a winner',()=>{
 assert.equal(validateAffinityCatalog({catalog,model,pilot:pilotManifest}),true);
 const ids=new Set();
 for(const tradition of catalog.traditions){
  assert.ok(!ids.has(tradition.id));ids.add(tradition.id);
  assert.ok(tradition.commitments.some(c=>c.role==='defining'));
  assert.ok(tradition.nonEntailments.length>0&&tradition.neighbors.length>0&&tradition.discriminators.length>0);
  assert.equal(tradition.identityClaimAllowed,false);
 }
 const blank=compare(fill(newQuiz(policy.routes.at(-1).size,'multiple-overlap')));
 const candidates=catalog.traditions.filter(t=>t.commitments.some(c=>c.role==='defining'&&c.mapping.status==='direct'));
 let pair=null;
 for(let i=0;i<candidates.length&&!pair;i++)for(let j=i+1;j<candidates.length;j++){
  const left=candidates[i].commitments.filter(c=>c.role==='defining'&&c.mapping.status==='direct');
  const right=candidates[j].commitments.filter(c=>c.role==='defining'&&c.mapping.status==='direct');
  if(left.every(a=>right.every(b=>a.mapping.propositionId!==b.mapping.propositionId))){pair=[candidates[i],candidates[j]];break;}
 }
 assert.ok(pair,'fixture requires two traditions with distinct directly mapped defining criteria');
 const simultaneous=structuredClone(blank);
 for(const tradition of pair)for(const criterion of tradition.commitments.filter(c=>c.role==='defining'&&c.mapping.status==='direct'))
  setMappedState(simultaneous,criterion,criterion.mapping.expectedState);
 const evaluated=affinity(simultaneous),selected=pair.map(t=>evaluated.traditions.find(row=>row.id===t.id));
 assert.ok(selected.every(row=>row.overlap.some(c=>c.role==='defining')));
 assert.equal(evaluated.ranking,null);assert.equal(evaluated.identity,null);assert.equal(evaluated.matchPercent,null);
 assert.equal(evaluated.traditions.length,catalog.traditions.length);
});

console.log(`Inference-safety regressions passed: ${checks} groups; ${catalog.traditions.length} current traditions; ${policy.routes.length} authored routes.`);
