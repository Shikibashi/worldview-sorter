import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareWorldview} from '../packages/worldview/index.js';
import {evaluatePhilosophicalAffinities,validateAffinityCatalog} from '../packages/worldview/affinities.js';
import {currentFromManifest,loadSnapshot,validateContentIntegrity} from '../packages/governance/release.js';

const root=new URL('../',import.meta.url),read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const current=currentFromManifest(await read('data/releases/model-release-v1.9.0.json')),
 old=currentFromManifest(await read('data/releases/model-release-v1.8.0.json'));
const [bank,model,scalesDoc,routes,pilot,catalog,oldRoutes,oldCatalog]=await Promise.all([
 read(current.candidateBank.path),read(current.worldviewModel.path),read(current.responseScales.path),
 read(current.progressiveDepth.path),read(current.pilotCandidate.path),read(current.affinityCatalog.path),
 read(old.progressiveDepth.path),read(old.affinityCatalog.path)]);
assert.equal(validateAffinityCatalog({catalog,model,pilot}),true);
assert.equal(validateContentIntegrity(await loadSnapshot(root.pathname,current)).traditions,11);
assert.equal(catalog.traditions.length,11);
assert.equal(oldCatalog.traditions.length,9);
assert.deepEqual(routes.routes.map(row=>row.itemRefs),oldRoutes.routes.map(row=>row.itemRefs));
assert.deepEqual(routes.routes.map(row=>row.size),[64,120,243]);
const byItem=new Map(bank.items.map(row=>[row.id,row]));
const assigned=routeId=>routes.routes.find(row=>row.id===routeId).itemRefs;
const session=(answers,routeId='full',route=routes)=>({
 pilotId:route.administrationId,bankVersion:bank.bankVersion,instrumentVersion:route.instrumentVersion,
 presentedItems:route.routes.find(row=>row.id===routeId).itemRefs.map(ref=>({
  ...ref,presented:Object.hasOwn(answers,ref.itemId),skippedByBranch:false})),
 responses:Object.entries(answers).map(([itemId,value])=>({
  itemId,itemRevision:byItem.get(itemId).revision,state:value===null?'no_view':'answered',value}))
});
const report=(answers,routeId='full',route=routes)=>compareWorldview({model,bank,scalesDoc,
 input:session(answers,routeId,route),routeManifest:route});
const result=(answers,routeId='full')=>evaluatePhilosophicalAffinities({catalog,report:report(answers,routeId),model,pilot});
const row=(out,id)=>out.traditions.find(tradition=>tradition.id===id);
const act='act-consequentialism-scoped',rule='rule-consequentialism-scoped';
const actPositive={NEI122:'act_outcome',NEI014:-2,NEI123:'person_constraint'};
const rulePositive={NEI122:'rule_outcome',NEI123:'general_consequences',NEI014:2};
assert.equal(row(result(actPositive),act).summaryState,'overlap_on_measured_core');
assert.equal(row(result(rulePositive),rule).summaryState,'overlap_on_measured_core');
assert.equal(row(result(actPositive),rule).summaryState,'material_divergence');
assert.equal(row(result(rulePositive),act).summaryState,'material_divergence');
assert.equal(row(result({NEI122:'act_outcome',NEI014:-2}),rule).summaryState,'no_sufficiently_established_affinity',
 'One opposed rule-criterion item does not establish divergence without corroboration.');
assert.equal(row(result({NEI122:'rule_outcome',NEI123:'general_consequences'}),act).summaryState,'no_sufficiently_established_affinity',
 'One opposed act-criterion item does not establish divergence without corroboration.');
assert.equal(row(result({NEI122:'rule_independent',NEI123:'person_constraint'}),rule).summaryState,'material_divergence');
assert.equal(row(result({NEI122:'rule_outcome',NEI123:'person_constraint'}),rule).criteria[0].finding,'contradictory');
assert.equal(row(result({NEI122:'act_outcome',NEI014:2}),act).criteria[0].finding,'contradictory');
assert.equal(row(result({NEI122:'rule_outcome'}),rule).criteria[0].finding,'unresolved');
assert.equal(row(result({NEI122:null,NEI123:null}),rule).criteria[0].finding,'unresolved');
assert.equal(row(result({},'quick'),rule).criteria[0].finding,'unmeasured');
assert.equal(row(result({},'standard'),act).criteria[0].finding,'unmeasured');
assert.equal(row(result({NEI123:'agreement'}),rule).summaryState,'no_sufficiently_established_affinity');
assert.equal(row(result({NEI037:2,NEI040:'rules_primary'}),rule).summaryState,'no_sufficiently_established_affinity',
 'Generic rule guidance is not the rule-consequentialist criterion.');
assert.equal(row(result({NEI001:2,NEI025:'strong'}),act).summaryState,'no_sufficiently_established_affinity',
 'Generic outcome concern is not the act-consequentialist criterion.');
assert.equal(row(result({NEI122:'rule_independent',NEI123:'general_consequences'}),rule).criteria[0].finding,'contradictory',
 'A consequence-justified useful rule does not establish a rule criterion when act rightness rests on independent duty.');
const overlapping=result({...actPositive,EPI100:2,EPI101:2});
assert.equal(row(overlapping,act).summaryState,'overlap_on_measured_core');
assert.equal(row(overlapping,'fallibilism-about-knowledge').summaryState,'overlap_on_measured_core');
assert.equal(result({}).hasEstablishedAffinity,false);
assert.equal(result({}).ranking,null);assert.equal(result({}).matchPercent,null);assert.equal(result({}).identity,null);
for(const comparison of catalog.traditions.slice(-2)){
 assert.equal(comparison.identityClaimAllowed,false);
 assert.ok(comparison.commitments.some(c=>c.role==='characteristic'&&c.mapping.status==='not_measured'));
 assert.ok(comparison.commitments.some(c=>c.role==='disputed'&&c.mapping.status==='not_measured'));
 assert.ok(comparison.nonEntailments.some(s=>s.includes('utilitarianism')));
}
assert.throws(()=>evaluatePhilosophicalAffinities({catalog,report:{responses:[{itemId:'NEI122',value:'act_outcome'}]},model,pilot}),
 /interpreted pilot report required/,'Raw answers cannot enter doctrinal affinity evaluation.');
const historicalAnswers={...actPositive,EPI100:2,EPI101:2};
const oldReport=report(historicalAnswers,'full',oldRoutes),newReport=report(historicalAnswers);
assert.deepEqual(newReport.commitments.map(c=>[c.commitmentId,c.state,c.supportingUnits,c.opposingUnits]),
 oldReport.commitments.map(c=>[c.commitmentId,c.state,c.supportingUnits,c.opposingUnits]));
const prior=evaluatePhilosophicalAffinities({catalog:oldCatalog,report:oldReport,model,pilot});
assert.equal(prior.catalogVersion,'philosophical-affinity-1.6.0');
assert.deepEqual(result(historicalAnswers).traditions.slice(0,9).map(t=>[t.id,t.summaryState]),
 prior.traditions.map(t=>[t.id,t.summaryState]));
console.log('Act/rule affinity release: positive, negative, mixed, missing, route omission, false positives, multiple affinities, raw-answer boundary, and historical replay passed.');
