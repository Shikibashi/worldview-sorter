import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {generatePhilosophyPacket} from '../packages/philosophy/forms.js';
import {evaluatePhilosophicalAffinities,validateAffinityCatalog} from '../packages/worldview/affinities.js';
import {buildQuizSummary} from '../packages/experience/summary.js';

const root=new URL('../',import.meta.url);
const bytes=path=>readFile(new URL(path,root));
const read=async path=>JSON.parse(await bytes(path));
const [catalog,manifest,model,pilot,bank,scalesDoc,form,pilotPlan,current]=await Promise.all([
 read('data/affinities/catalog-v1.json'),read('data/affinities/manifest-v1.json'),read('data/generic/model-v1.0-pilot.json'),
 read('data/pilots/pilot-candidate-v1.json'),read('data/items/candidate-v0.9.json'),read('data/response-scales.json'),
 read('data/philosophy/public-pilot-v1.json'),read('data/pilots/pilot-0.2.json'),read('data/current.json')]);
const measured=new Set(pilot.interpretationRules.routeMeasuredDirectRuleIds);
const report=changes=>({schemaVersion:'3.0.0',modelVersion:model.modelVersion,resultSemanticsVersion:model.resultSemanticsVersion,
 publicRuleIds:[...model.publicRuleIds],commitments:model.publicRuleIds.map(id=>({commitmentId:id,
  state:changes[id]?.state??(measured.has(id)?'insufficient_evidence':'not_measured'),leanDirection:changes[id]?.leanDirection??null})),
 derived:model.derivedRules.map(rule=>({id:rule.id,state:'not_measured'}))});
const observation=(id,state,leanDirection)=>({[id]:{state,leanDirection}});
const result=changes=>evaluatePhilosophicalAffinities({catalog,report:report(changes),model,pilot});
const entry=(r,id)=>r.traditions.find(t=>t.id===id);
let assertions=0;
const check=(condition,message)=>{assert.ok(condition,message);assertions++;};

check(validateAffinityCatalog({catalog,model,pilot})===true,'catalog validation');
const leakedModel=structuredClone(model),leakedId=leakedModel.researchOnlyRuleIds[0];
leakedModel.commitments.find(rule=>rule.id===leakedId).tier='primary';leakedModel.publicRuleIds.push(leakedId);
assert.throws(()=>validateAffinityCatalog({catalog,model:leakedModel,pilot}),/disjoint/);assertions++;
const derivedLeak=structuredClone(model);derivedLeak.derivedRules[0].requires[0].ruleId=derivedLeak.researchOnlyRuleIds[0];
assert.throws(()=>validateAffinityCatalog({catalog,model:derivedLeak,pilot}),/nonpublic propositions/);assertions++;
const derivedCatalog=structuredClone(catalog),derivedRule=model.derivedRules[0];
const derivedTradition=derivedCatalog.traditions[0];
derivedTradition.commitments.push({id:'synthetic-derived-core',role:'defining',doctrine:'Synthetic derived doctrine',
 sourceIds:[derivedTradition.secondarySourceIds[0]],mapping:{status:'derived',propositionId:derivedRule.id,
 expectedState:'supported',note:'Synthetic validator fixture'}});
assert.throws(()=>validateAffinityCatalog({catalog:derivedCatalog,model,pilot}),
 /derived mapping lacks an exact sourced conclusion/);assertions++;
const sourcedDerivedModel=structuredClone(model),sourcedDerivedRule=sourcedDerivedModel.derivedRules[0];
sourcedDerivedRule.sourceClaims=[{sourceId:sourcedDerivedRule.sourceIds[0],relationship:'supports',claim:'Synthetic derived basis.'}];
assert.throws(()=>validateAffinityCatalog({catalog:derivedCatalog,model:sourcedDerivedModel,pilot}),
 /derived mapping lacks an exact sourced public prerequisite/);assertions++;
for(const dependency of sourcedDerivedRule.requires){
 const direct=sourcedDerivedModel.commitments.find(rule=>rule.id===dependency.ruleId);
 direct.proposition??='Synthetic exact prerequisite.';
 direct.sourceClaims=[{sourceId:direct.sourceIds[0],relationship:'supports',claim:'Synthetic prerequisite basis.'}];
}
check(validateAffinityCatalog({catalog:derivedCatalog,model:sourcedDerivedModel,pilot})===true,
 'A derived defining criterion requires a sourced exact conclusion and every sourced exact public prerequisite');
check(current.affinityCatalogVersions.some(x=>x.version===current.affinityCatalog.version&&
 x.path===current.affinityCatalog.path),'active catalog remains registered alongside the historical catalog');
check(current.affinityCatalogVersions.some(x=>x.version===catalog.catalogVersion&&x.path===manifest.path),'historical catalog registry');
check(manifest.sha256==='eabdeee147a5e05ccc232ee927855aa10033146b0daa03be4847129943fb6af6','v1 catalog manifest is immutable');
check(createHash('sha256').update(await bytes(manifest.path)).digest('hex')===manifest.sha256,'frozen catalog bytes');
check(catalog.traditions.length===6,'compact catalog');
check(catalog.traditions.every(t=>t.commitments.some(c=>c.role==='defining')&&t.nonEntailments.length&&t.discriminators.length),'doctrinal content');

const none=result({});
check(none.hasEstablishedAffinity===false&&none.traditions.every(t=>t.summaryState==='no_sufficiently_established_affinity'),'no close affinity');
check(none.identity===null&&none.matchPercent===null&&none.ranking===null,'no identity, percentage, or ranking');
for(const tradition of catalog.traditions){
 const directCore=tradition.commitments.filter(c=>c.role==='defining'&&c.mapping.status==='direct');
 check(directCore.length>0,tradition.id+' has assessable defining doctrine');
 const all=Object.fromEntries(directCore.map(c=>[c.mapping.propositionId,{state:c.mapping.expectedState}]));
 const positive=entry(result(all),tradition.id);
 check(positive.overlap.filter(c=>c.role==='defining').length===directCore.length,tradition.id+' clear measured overlap');
 check(!positive.divergence.some(c=>c.role==='defining'),tradition.id+' positive has no core divergence');
 check(positive.unmeasuredDefining.length===tradition.commitments.filter(c=>c.role==='defining'&&c.mapping.status==='not_measured').length,tradition.id+' retains unmeasured core');
 const first=directCore[0],reverse=first.mapping.expectedState==='supported'?'opposed':'supported';
 const negative=entry(result({...all,[first.mapping.propositionId]:{state:reverse}}),tradition.id);
 check(negative.summaryState==='material_divergence',tradition.id+' clear negative');
 const mixed=entry(result({...all,[first.mapping.propositionId]:{state:'mixed_context_dependent'}}),tradition.id);
 check(mixed.contradictory.some(c=>c.id===first.id),tradition.id+' contradictory evidence');
 const missing=entry(result({...all,[first.mapping.propositionId]:{state:'insufficient_evidence'}}),tradition.id);
 check(missing.unresolved.some(c=>c.id===first.id),tradition.id+' missing response evidence');
 const lean=entry(result({...all,[first.mapping.propositionId]:{state:'leaned_toward',leanDirection:'support'}}),tradition.id);
 check(lean.unresolved.some(c=>c.id===first.id),tradition.id+' lean cannot satisfy defining criterion');
 if(directCore.length>1){
  const partial=entry(result({[first.mapping.propositionId]:{state:first.mapping.expectedState}}),tradition.id);
  check(partial.summaryState==='overlap_with_unresolved_core'||partial.summaryState==='overlap_with_unmeasured_core',tradition.id+' partial overlap');
 }
}

check(entry(result(observation('construct-EP15','supported')),'pragmatism').summaryState==='no_sufficiently_established_affinity','fallibilism is not pragmatism');
check(entry(result(observation('construct-NE15','supported')),'stirnerian-ownness').summaryState==='no_sufficiently_established_affinity','ethical egoism is not Stirnerian ownness');
check(entry(result(observation('construct-NE17','supported')),'ethical-egoism').summaryState==='no_sufficiently_established_affinity','ownness is not ethical egoism');
check(entry(result(observation('audit2-PL05-decentralization','supported')),'philosophical-anarchism').summaryState==='no_sufficiently_established_affinity','decentralism is not philosophical anarchism');
check(entry(result(observation('legacy-objectivism-market-coordination','supported')),'objectivism-rand').summaryState==='no_sufficiently_established_affinity','market coordination is not Objectivism');
check(entry(result(observation('divine-existence','opposed')),'ontological-naturalism').summaryState==='no_sufficiently_established_affinity','atheism is not ontological naturalism');
const simultaneous=result({'construct-EP16':{state:'supported'},'legacy-philosophical-anarchism-no-general-obedience':{state:'supported'},'construct-NE15':{state:'supported'}});
check(['pragmatism','philosophical-anarchism','ethical-egoism'].every(id=>entry(simultaneous,id).overlap.some(c=>c.role==='defining')),'multiple affinities coexist');
check(simultaneous.traditions.length===catalog.traditions.length&&simultaneous.ranking===null,'no winner selected');
const ignored=report({'ph-world-possibilities':{state:'supported'},'construct-NE15':{state:'supported'}});
ignored.commitments.push({commitmentId:'ph-world-possibilities',state:'supported'},{commitmentId:'deprecated-OM03',state:'supported'});
check(JSON.stringify(evaluatePhilosophicalAffinities({catalog,report:ignored,model,pilot}))===JSON.stringify(result(observation('construct-NE15','supported'))),'research and deprecated propositions do not leak');
const duplicatedPublic=report({});duplicatedPublic.commitments.push({commitmentId:model.publicRuleIds[0],state:'supported'});
assert.throws(()=>evaluatePhilosophicalAffinities({catalog,report:duplicatedPublic,model,pilot}),/complete and unique/);assertions++;
const missingPublic=report({});missingPublic.commitments.pop();
assert.throws(()=>evaluatePhilosophicalAffinities({catalog,report:missingPublic,model,pilot}),/complete and unique/);assertions++;
const duplicatedManifest=report({});duplicatedManifest.publicRuleIds[0]=duplicatedManifest.publicRuleIds[1];
assert.throws(()=>evaluatePhilosophicalAffinities({catalog,report:duplicatedManifest,model,pilot}),/manifest mismatch/);assertions++;
const forgedDerived=report({});forgedDerived.derived.push({...forgedDerived.derived[0],state:'supported'});
assert.throws(()=>evaluatePhilosophicalAffinities({catalog,report:forgedDerived,model,pilot}),/complete and unique/);assertions++;
assert.throws(()=>evaluatePhilosophicalAffinities({catalog,report:{responses:[{itemId:'NEI100',value:2}]},model,pilot}));assertions++;
assert.throws(()=>evaluatePhilosophicalAffinities({catalog,report:{...report({}),modelVersion:'generic-future'},model,pilot}));assertions++;
check(validateAffinityCatalog({catalog:{...catalog,catalogVersion:'philosophical-affinity-1.0.1'},model,pilot})===true,
 'A versioned catalog revision can reuse supported comparison semantics; the release manifest pins actual bytes.');
assert.throws(()=>validateAffinityCatalog({catalog:{...catalog,catalogVersion:'draft-latest'},model,pilot}),/invalid catalog version/);assertions++;
assert.throws(()=>validateAffinityCatalog({catalog:{...catalog,affinitySemanticsVersion:'doctrinal-comparison-2.0.0'},model,pilot}),
 /unsupported affinity semantics/);assertions++;
const foreignSource=structuredClone(catalog);
foreignSource.traditions.find(t=>t.id==='pragmatism').commitments[0].sourceIds=['sep-egoism'];
assert.throws(()=>validateAffinityCatalog({catalog:foreignSource,model,pilot}),/criterion source is not declared/);assertions++;

const packet=generatePhilosophyPacket({bank,pilot:pilotPlan,policy:form,size:238,seed:'affinity-integration'});
const session={bankVersion:bank.bankVersion,instrumentVersion:form.instrumentVersion,completionStatus:'completed',
 presentedItems:packet.entries.map(e=>({...e,presented:false,skippedByBranch:false})),responses:[]};
const summary=buildQuizSummary({model,bank,scalesDoc,session,affinityCatalog:catalog,affinityPilot:pilot});
check(summary.affinityCatalogVersion===catalog.catalogVersion&&summary.affinities.source==='interpreted_public_propositions_only','summary integrates catalog');
check(summary.affinities.traditions.every(t=>t.identityClaim===false&&t.percentage===null),'respondent output remains non-identity');
check(summary.affinities.traditions.every(t=>t.unmeasuredDefining.every(c=>c.finding==='unmeasured')),'summary retains doctrinal gaps');
console.log('Affinity catalog checks passed: '+assertions+' assertions across '+catalog.traditions.length+' traditions.');
