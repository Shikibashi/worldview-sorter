import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createQuiz,seekQuestion,currentItem,answerQuestion,nextQuestion,restoreQuiz,extendProgressiveQuiz,recordDepthCheckpoint} from '../packages/experience/quiz.js';
import {compareWorldview,planWorldviewFollowups} from '../packages/worldview/index.js';
import {buildQuizSummary} from '../packages/experience/summary.js';
import {evaluatePhilosophicalAffinities} from '../packages/worldview/affinities.js';

const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const current=await read('data/current.json');
const [bank,pilot,scalesDoc,model,policy,catalog,pilotManifest,report]=await Promise.all([
 read(current.candidateBank.path),read(current.pilot.path),read('data/response-scales.json'),read(current.worldviewModel.path),
 read(current.progressiveDepth.path),read(current.affinityCatalog.path),read(current.pilotCandidate.path),
 (async()=>JSON.parse((await (await import('node:child_process')).execFileSync('node',['scripts/report-progressive-depth.mjs'],{cwd:new URL('../',import.meta.url)})).toString()))()
]);
const frozenForm=await read(current.fullForm.path);
const byId=new Map(bank.items.map(i=>[i.id,i]));
const choose=i=>['likert','paired_choice'].includes(i.responseType)?0:i.responseType==='ranking'?i.options.map(o=>o.id):i.options[0].id;
const newQuiz=(size,seed)=>{const q=createQuiz({bank,pilot,scalesDoc,formPolicy:policy,seed,size,sessionId:'synthetic-'+seed});seekQuestion(q,bank);return q;};
const fill=(q,answers=new Map())=>{if(q.index!==null)seekQuestion(q,bank,q.index);let steps=0;while(q.index!==null){assert.ok(++steps<=q.packet.size+2);const item=currentItem(q,bank),value=answers.get(item.id);answerQuestion(q,bank,scalesDoc,value===undefined?{state:'no_view',value:null}:{state:'answered',value});nextQuestion(q,bank);}return q;};
const restore=q=>restoreQuiz(structuredClone(q),{bank,pilot,scalesDoc,formPolicy:policy});
const compare=q=>compareWorldview({model,bank,scalesDoc,input:q.session,routeManifest:policy});
const plan=(q,domainId=null)=>planWorldviewFollowups({model,bank,scalesDoc,input:q.session,routeManifest:policy,allowedItemRefs:policy.routes.at(-1).itemRefs,domainId,maxItems:policy.clarificationBudget,affinityCatalog:catalog});
let checks=0;const check=(name,fn)=>{fn();checks++;console.log('PASS progressive depth: '+name);};
check('Three immutable nested routes preserve exact frozen revisions and domain/format spread',()=>{
 assert.deepEqual(policy.routes.map(r=>r.size),[64,120,240]);let prior=new Set();
 assert.deepEqual(policy.routes.at(-1).itemRefs,frozenForm.frozenItems);
 for(const route of policy.routes){const ids=new Set(route.itemRefs.map(x=>x.itemId));assert.equal(ids.size,route.size);for(const x of route.itemRefs){assert.equal(byId.get(x.itemId).revision,x.itemRevision);assert.ok(pilotManifest.route.exactItemRevisions.some(y=>y.itemId===x.itemId&&y.itemRevision===x.itemRevision));}for(const id of prior)assert.ok(ids.has(id));prior=ids;const row=report.routes.find(r=>r.routeId===route.id);assert.equal(row.itemCount,route.size);assert.equal(Object.values(row.domains).filter(Boolean).length,12);assert.equal(Object.values(row.responseScales).filter(Boolean).length,7);assert.deepEqual([...route.assessableDirectRuleIds].sort(),model.publicRuleIds.filter(id=>!row.unassessablePublicRuleIds.includes(id)).sort());assert.deepEqual([...route.assessableFacetIds].sort(),[...row.assessableFacetIds].sort());}
 assert.deepEqual(report.routes.map(r=>r.assessableDirectRules),[30,56,91]);
 assert.deepEqual(report.routes.map(r=>r.affinity.reduce((n,t)=>n+t.definingDirectlyAssessable,0)),[2,2,11]);
 assert.deepEqual(report.routes.map(r=>r.affinity.reduce((n,t)=>n+t.definingPartiallyAssessed,0)),[0,2,2]);
});
check('A short route cannot inherit unasked public or derived propositions',()=>{
 const q=fill(newQuiz(64,'all-no-view')),r=compare(q);
 assert.equal(r.commitments.filter(c=>model.publicRuleIds.includes(c.commitmentId)&&c.state==='not_measured').length,112);
 assert.ok(r.derived.every(d=>d.state!=='supported'));
 const s=buildQuizSummary({model,bank,scalesDoc,session:q.session,routeManifest:policy,affinityCatalog:catalog,affinityPilot:pilotManifest});
 assert.equal(s.affinities.traditions.length,catalog.traditions.length);
 assert.ok(s.affinities.traditions.some(t=>t.unmeasuredDefining.length));
 assert.equal(s.affinities.hasEstablishedAffinity,false);
 assert.equal(s.identity,null);assert.equal(s.matchPercent,null);
 assert.deepEqual(restore(q),q);
});
check('A branch-skipped discriminator is not counted as presented evidence',()=>{
 const quick=fill(newQuiz(64,'branch-skipped-agentic'),new Map([['RCI001','none']]));
 assert.equal(quick.session.presentedItems.find(entry=>entry.itemId==='RCI002').skippedByBranch,true);
 const quickResult=compare(quick).commitments.find(c=>c.commitmentId==='audit2-RC02-agentic-divinity');
 assert.equal(quickResult.availableSupportUnits,1);
 assert.equal(quickResult.availableOpposeUnits,1);
 assert.equal(quickResult.state,'not_measured');
 const full=fill(newQuiz(240,'branch-skipped-agentic-full'),new Map([['RCI001','none']]));
 assert.equal(full.session.presentedItems.find(entry=>entry.itemId==='RCI002').skippedByBranch,true);
 const fullResult=compare(full).commitments.find(c=>c.commitmentId==='audit2-RC02-agentic-divinity');
 assert.equal(fullResult.availableSupportUnits,2);
 assert.equal(fullResult.availableOpposeUnits,2);
 assert.equal(fullResult.state,'insufficient_evidence');
});
check('Political answers cannot fill missing metaphysics or manufacture a comprehensive affinity',()=>{
 const q=newQuiz(64,'politics-only');
 const answers=new Map(q.packet.entries.filter(e=>e.domainId==='PL').map(e=>[e.itemId,choose(byId.get(e.itemId))]));
 fill(q,answers);
 const r=compare(q),meta=r.commitments.filter(c=>model.publicRuleIds.includes(c.commitmentId)&&['OM','MS','RC'].includes(c.domainId));
 assert.ok(meta.every(c=>!['supported','opposed'].includes(c.state)));
 const s=buildQuizSummary({model,bank,scalesDoc,session:q.session,routeManifest:policy,affinityCatalog:catalog,affinityPilot:pilotManifest});
 const objectivism=s.affinities.traditions.find(t=>t.id==='objectivism-rand');
 assert.ok(objectivism.unmeasuredDefining.length>0);
 assert.notEqual(objectivism.summaryState,'overlap_on_measured_core');
 assert.equal(s.identity,null);
});
check('Defining doctrine can guide authored clarification only through a direct proposition mapping',()=>{
 const q=fill(newQuiz(64,'defining-clarification'));
 const p=plan(q,'ME'),direct=new Set(catalog.traditions.flatMap(t=>t.commitments)
  .filter(c=>c.role==='defining'&&c.mapping.status==='direct').map(c=>c.mapping.propositionId));
 const targeted=p.entries.filter(e=>e.reason==='clarify_defining_doctrine');
 assert.ok(targeted.length>0);
 assert.ok(targeted.every(e=>direct.has(e.ruleId)&&model.publicRuleIds.includes(e.ruleId)));
});
check('Positive, opposing, mixed and missing answers yield distinct proposition states',()=>{
 const ids=new Set(policy.routes[0].itemRefs.map(x=>x.itemId));
 const rule=model.commitments.find(c=>model.publicRuleIds.includes(c.id)&&c.minimumEvidenceUnits===2&&
  new Set(c.evidence.filter(e=>ids.has(e.itemId)&&e.support.length).map(e=>e.unitId)).size>=2&&
  new Set(c.evidence.filter(e=>ids.has(e.itemId)&&e.oppose.length).map(e=>e.unitId)).size>=2);
 assert.ok(rule);
 const units=direction=>[...new Map(rule.evidence.filter(e=>ids.has(e.itemId)&&e[direction].length).map(e=>[e.unitId,e])).values()].slice(0,2);
 const supporting=units('support'),opposing=units('oppose');
 const state=answers=>compare(fill(newQuiz(64,'state-'+checks+'-'+answers.size),answers)).commitments.find(c=>c.commitmentId===rule.id).state;
 assert.equal(state(new Map(supporting.map(e=>[e.itemId,e.support[0]]))),'supported');
 assert.equal(state(new Map(opposing.map(e=>[e.itemId,e.oppose[0]]))),'opposed');
 assert.equal(state(new Map([[supporting[0].itemId,supporting[0].support[0]],[opposing.find(e=>e.itemId!==supporting[0].itemId).itemId,opposing.find(e=>e.itemId!==supporting[0].itemId).oppose[0]]])),'mixed_context_dependent');
 assert.equal(state(new Map()),'insufficient_evidence');
});
check('Quick can clarify one domain, then continue to Standard and Full without repeat or loss',()=>{
 const q=fill(newQuiz(64,'progression'));recordDepthCheckpoint(q);
 const initialUnmeasured=compare(q).commitments.filter(c=>model.publicRuleIds.includes(c.commitmentId)&&c.state==='not_measured').length;
 const before=structuredClone(q.session.responses),beforeIds=new Set(q.packet.entries.map(e=>e.itemId));
 const domain=model.domains.map(d=>d.id).find(id=>plan(q,id).entries.length>0);assert.ok(domain);
 const p=plan(q,domain);assert.ok(p.entries.length<=6&&p.entries.every(e=>e.reason&&e.ruleId&&e.priorEvidenceState));
 const event=extendProgressiveQuiz({quiz:q,bank,policy,plan:p}).event;
 assert.equal(event.kind,'clarification');assert.equal(event.domainId,domain);
 assert.deepEqual(event.selected.map(e=>e.itemId),p.entries.map(e=>e.itemId));
 assert.deepEqual(q.session.responses,before);assert.deepEqual(restore(q),q);
 fill(q);recordDepthCheckpoint(q);assert.deepEqual(restore(q),q);
 const stateAfterClarify=compare(q);assert.ok(stateAfterClarify.commitments.filter(c=>model.publicRuleIds.includes(c.commitmentId)&&c.state==='not_measured').length<=initialUnmeasured);
 const newStandard=extendProgressiveQuiz({quiz:q,bank,policy,routeId:'standard'});assert.ok(newStandard.added>0&&newStandard.added<=56);
 assert.equal(q.depth.currentRouteId,'standard');assert.deepEqual(q.session.responses.slice(0,before.length),before);
 assert.deepEqual(restore(q),q);fill(q);recordDepthCheckpoint(q);
 assert.ok(compare(q).commitments.filter(c=>model.publicRuleIds.includes(c.commitmentId)&&c.state==='not_measured').length<=84);
 const newFull=extendProgressiveQuiz({quiz:q,bank,policy,routeId:'full'});assert.ok(newFull.added>0);
 assert.equal(new Set(q.packet.entries.map(e=>e.itemId)).size,240);assert.ok([...beforeIds].every(id=>q.packet.entries.some(e=>e.itemId===id)));
 assert.deepEqual(restore(q),q);fill(q);recordDepthCheckpoint(q);assert.deepEqual(restore(q),q);
 assert.equal(q.depth.checkpoints.length,4);
 assert.equal(plan(q).entries.length,0);
});
check('Standard can clarify and then continue to Full; prior answers survive',()=>{
 const q=fill(newQuiz(120,'standard-clarify')),before=structuredClone(q.session.responses);
 const domain=model.domains.map(d=>d.id).find(id=>plan(q,id).entries.length>0);assert.ok(domain);
 const added=extendProgressiveQuiz({quiz:q,bank,policy,plan:plan(q,domain)}).added;assert.ok(added>0&&added<=6);
 fill(q);extendProgressiveQuiz({quiz:q,bank,policy,routeId:'full'});
 assert.deepEqual(q.session.responses.slice(0,before.length),before);assert.deepEqual(restore(q),q);
});
check('Historical selection events and checkpoint records fail closed on tampering',()=>{
 const q=fill(newQuiz(64,'tamper'));recordDepthCheckpoint(q);
 const altered=structuredClone(q);altered.depth.events[0].entries[0].itemRevision++;assert.throws(()=>restore(altered));
 const changed=structuredClone(q);changed.depth.checkpoints[0].session.responses[0].itemRevision++;assert.throws(()=>restore(changed));
 const semantics=structuredClone(q);semantics.depth.checkpoints[0].resultSemanticsVersion='unknown';assert.throws(()=>restore(semantics));
 const p=plan(q);extendProgressiveQuiz({quiz:q,bank,policy,plan:p});
 const wrong=structuredClone(q);wrong.depth.events[1].selected[0].reason='';assert.throws(()=>restore(wrong));
 const repeated=structuredClone(q);repeated.packet.entries.at(-1).itemId=q.packet.entries[0].itemId;assert.throws(()=>restore(repeated));
});
check('No raw answer or research-only proposition bypasses the interpretation layer',()=>{
 const q=fill(newQuiz(64,'research-boundary'));
 const r=compare(q),summary=buildQuizSummary({model,bank,scalesDoc,session:q.session,routeManifest:policy,affinityCatalog:catalog,affinityPilot:pilotManifest});
 const publicSet=new Set(model.publicRuleIds);
 assert.ok(summary.affinities.traditions.every(t=>t.criteria.every(c=>!c.mapping.propositionId||!model.commitments.some(rule=>rule.id===c.mapping.propositionId)||publicSet.has(c.mapping.propositionId))));
 assert.equal(q.packet.selectionMethod,'progressive-fixed-1');assert.equal(r.publicIdentityLabel,null);
});
console.log('Progressive depth regressions passed:',checks);
