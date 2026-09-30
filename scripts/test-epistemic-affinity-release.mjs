import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareWorldview} from '../packages/worldview/index.js';
import {evaluatePhilosophicalAffinities,validateAffinityCatalog} from '../packages/worldview/affinities.js';
import {currentFromManifest,loadSnapshot,validateContentIntegrity} from '../packages/governance/release.js';

const root=new URL('../',import.meta.url),read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const current=currentFromManifest(await read('data/releases/model-release-v1.6.0.json'));
const reviewedRefs=currentFromManifest(await read('data/releases/model-release-v1.6.0.json'));
const [bank,model,scalesDoc,routes,pilot,catalog,oldRelease]=await Promise.all([
 read(reviewedRefs.candidateBank.path),read(reviewedRefs.worldviewModel.path),read(reviewedRefs.responseScales.path),
 read(reviewedRefs.progressiveDepth.path),read(reviewedRefs.pilotCandidate.path),read(reviewedRefs.affinityCatalog.path),
 read('data/releases/model-release-v1.5.0.json')]);
const oldRefs=currentFromManifest(oldRelease);
const [oldModel,oldCatalog,oldRoutes]=await Promise.all([
 read(oldRefs.worldviewModel.path),read(oldRefs.affinityCatalog.path),read(oldRefs.progressiveDepth.path)]);
assert.equal(validateAffinityCatalog({catalog,model,pilot}),true);
assert.deepEqual(validateContentIntegrity(await loadSnapshot(new URL('../',import.meta.url).pathname,current)).traditions,9);
assert.deepEqual(routes.routes.map(route=>route.itemRefs),oldRoutes.routes.map(route=>route.itemRefs),
 'Affinity review must not change any route question or revision.');
assert.deepEqual(model.commitments.map(rule=>rule.evidence),oldModel.commitments.map(rule=>rule.evidence),
 'New source claims cannot change the evidence rule behavior.');
assert.equal(oldCatalog.traditions.length,7);
assert.equal(catalog.traditions.length,9);
const byItem=new Map(bank.items.map(item=>[item.id,item]));
const session=(answers,routeId)=>{
 const assigned=routes.routes.find(route=>route.id===routeId).itemRefs;
 const included=new Set(assigned.map(ref=>ref.itemId));
 for(const id of Object.keys(answers))assert.ok(included.has(id),'Unassigned answer '+id);
 const responses=Object.entries(answers).map(([itemId,value])=>({itemId,itemRevision:byItem.get(itemId).revision,
  state:value===null?'no_view':'answered',value}));
 return {pilotId:routes.administrationId,bankVersion:bank.bankVersion,
  instrumentVersion:routes.instrumentVersion,
  presentedItems:assigned.map(ref=>({...ref,presented:Object.hasOwn(answers,ref.itemId),skippedByBranch:false})),responses};
};
const interpreted=(answers,routeId='full')=>compareWorldview({model,bank,scalesDoc,
 input:session(answers,routeId),routeManifest:routes});
const affinity=(answers,routeId='full')=>evaluatePhilosophicalAffinities({catalog,
 report:interpreted(answers,routeId),model,pilot});
const criterion=(result,id)=>result.commitments.find(row=>row.commitmentId===id);
const tradition=(result,id)=>result.traditions.find(row=>row.id===id);
const fallible='fallibilism-about-knowledge',empiric='sensory-empiricism-about-the-external-world';
const falliblePositive={EPI100:2,EPI101:2},fallibleNegative={EPI100:-2,EPI101:-2};
const empiricPositive={EPI115:2,EPI117:-2},empiricNegative={EPI115:-2,EPI117:2};

assert.equal(criterion(interpreted(falliblePositive),'construct-EP15').state,'supported');
assert.equal(tradition(affinity(falliblePositive),fallible).summaryState,'overlap_on_measured_core');
assert.equal(criterion(interpreted(fallibleNegative),'construct-EP15').state,'opposed');
assert.equal(tradition(affinity(fallibleNegative),fallible).summaryState,'material_divergence');
assert.equal(criterion(interpreted({EPI100:2,EPI101:-2}),'construct-EP15').state,'mixed_context_dependent');
assert.equal(tradition(affinity({EPI100:2,EPI101:-2}),fallible).criteria[0].finding,'contradictory');
assert.equal(tradition(affinity({EPI100:2}),fallible).criteria[0].finding,'unresolved');
assert.equal(tradition(affinity({EPI100:null,EPI101:null}),fallible).criteria[0].finding,'unresolved');
assert.equal(tradition(affinity({},'quick'),fallible).criteria[0].finding,'unmeasured');
assert.equal(tradition(affinity(falliblePositive,'standard'),fallible).summaryState,'overlap_on_measured_core');
assert.equal(tradition(affinity(falliblePositive),'pragmatism').summaryState,'no_sufficiently_established_affinity',
 'Fallible knowledge cannot substitute for the pragmatic maxim.');

assert.equal(criterion(interpreted(empiricPositive),'construct-EP20').state,'supported');
assert.equal(tradition(affinity(empiricPositive),empiric).summaryState,'overlap_on_measured_core');
assert.equal(criterion(interpreted(empiricNegative),'construct-EP20').state,'opposed');
assert.equal(tradition(affinity(empiricNegative),empiric).summaryState,'material_divergence');
assert.equal(tradition(affinity({EPI115:2,EPI117:2}),empiric).criteria[0].finding,'contradictory');
assert.equal(tradition(affinity({EPI115:null,EPI117:null}),empiric).criteria[0].finding,'unresolved');
assert.equal(tradition(affinity({},'standard'),empiric).criteria[0].finding,'unmeasured');
const scienceOnly={EPI004:2,EPI026:-2};
assert.equal(tradition(affinity(scienceOnly),empiric).summaryState,'no_sufficiently_established_affinity',
 'Trust in public testing is not a sensory source-of-knowledge thesis.');
const both=affinity({...falliblePositive,...empiricPositive});
assert.ok([fallible,empiric].every(id=>tradition(both,id).summaryState==='overlap_on_measured_core'));
assert.equal(both.ranking,null);assert.equal(both.matchPercent,null);assert.equal(both.identity,null);
assert.equal(affinity({}).hasEstablishedAffinity,false);
assert.ok(catalog.traditions.slice(-2).every(row=>row.identityClaimAllowed===false&&
 row.commitments.some(c=>c.role==='characteristic'&&c.mapping.status==='not_measured')&&
 row.commitments.some(c=>c.role==='disputed'&&c.mapping.status==='not_measured')));

const oldInput=session({...falliblePositive,...empiricPositive},'full');
const oldReport=compareWorldview({model:oldModel,bank,scalesDoc,input:oldInput,routeManifest:oldRoutes});
const newReport=interpreted({...falliblePositive,...empiricPositive});
assert.deepEqual(newReport.commitments.map(row=>[row.commitmentId,row.state,row.supportingUnits,row.opposingUnits]),
 oldReport.commitments.map(row=>[row.commitmentId,row.state,row.supportingUnits,row.opposingUnits]),
 'The new catalog release must not change interpreted respondent states.');
assert.equal(oldCatalog.traditions.length,7,'Historical catalog stays intact.');
assert.equal((await read(oldRefs.affinityCatalog.manifestPath)).catalogVersion,oldCatalog.catalogVersion);
console.log('Epistemic affinity release: direct support/opposition, mixed, missing, route gaps, false-positive neighbors, overlapping affinities, and historical behavior passed.');
