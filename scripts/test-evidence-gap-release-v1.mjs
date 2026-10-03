import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareWorldview} from '../packages/worldview/index.js';
import {currentFromManifest} from '../packages/governance/release.js';

const root=new URL('../',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));

const current=await read('data/current.json');
const previousManifest=await read('data/releases/model-release-v1.19.0.json');
const previous=currentFromManifest(previousManifest);
const [bank,model,scales,routes,ledger,oldBank,oldModel,oldRoutes,referenceCurrent,reference11]=await Promise.all([
  read(current.candidateBank.path),read(current.worldviewModel.path),read(current.responseScales.path),
  read(current.progressiveDepth.path),read(current.worldviewSourceLedger.path),
  read(previous.candidateBank.path),read(previous.worldviewModel.path),read(previous.progressiveDepth.path),
  read('data/reference/current.json'),read('data/reference/reference-profiles-v1.1.0.json')
]);
const reference=await read(referenceCurrent.catalogPath);

assert.equal(previousManifest.releaseVersion,'model-release-1.19.0');
assert.equal(current.modelRelease.version,'model-release-1.20.0');
assert.equal(oldBank.bankVersion,'0.19.0');
assert.equal(bank.bankVersion,'0.20.0');
assert.equal(oldBank.items.length,575);
assert.equal(bank.items.length,579);
assert.deepEqual(bank.items.slice(0,oldBank.items.length),oldBank.items,
  'Released 0.19 item definitions must remain byte-equivalent prefixes.');
assert.deepEqual(oldRoutes.routes.map(route=>route.size),[64,120,249]);
assert.deepEqual(routes.routes.map(route=>route.size),[64,120,255]);
assert.deepEqual(routes.routes.find(route=>route.id==='quick').itemRefs,
  oldRoutes.routes.find(route=>route.id==='quick').itemRefs,'Quick must remain byte-for-byte unchanged.');
assert.deepEqual(routes.routes.find(route=>route.id==='standard').itemRefs,
  oldRoutes.routes.find(route=>route.id==='standard').itemRefs,'Standard must remain byte-for-byte unchanged.');

const newRefs=['EPI010','EPI118','AHI001','AHI106','NEI134','NEI135'];
const full=routes.routes.find(route=>route.id==='full');
const fullIds=full.itemRefs.map(ref=>ref.itemId);
for(const id of newRefs){
  assert.ok(fullIds.includes(id),`Full is missing ${id}.`);
  assert.ok(!routes.routes.find(route=>route.id==='quick').itemRefs.some(ref=>ref.itemId===id));
  assert.ok(!routes.routes.find(route=>route.id==='standard').itemRefs.some(ref=>ref.itemId===id));
  assert.ok(!oldRoutes.routes.find(route=>route.id==='full').itemRefs.some(ref=>ref.itemId===id));
}
for(const [a,b] of [['EPI010','EPI118'],['AHI001','AHI106'],['NEI134','NEI135']])
  assert.ok(Math.abs(fullIds.indexOf(a)-fullIds.indexOf(b))>30,`${a}/${b} should be widely separated on Full.`);

const ruleIds={
  ep:'reviewed-EP03-fallible-truth-attainability',
  ah:'reviewed-AH01-some-human-free-will',
  mill:'reviewed-NE26-general-happiness-ultimate-standard'
};
for(const id of Object.values(ruleIds)){
  assert.ok(model.publicRuleIds.includes(id),`${id} must be a public direct rule.`);
  assert.ok(!oldModel.commitments.some(rule=>rule.id===id),`${id} leaked into release 1.19.`);
}
const ep=model.commitments.find(rule=>rule.id===ruleIds.ep);
const ah=model.commitments.find(rule=>rule.id===ruleIds.ah);
const mill=model.commitments.find(rule=>rule.id===ruleIds.mill);
assert.deepEqual(ep.evidence.map(row=>[row.itemId,row.itemRevision,row.unitId]),
  [['EPI010',1,'EPI010'],['EPI118',1,'EPI118']]);
assert.deepEqual(ah.evidence.map(row=>[row.itemId,row.itemRevision,row.unitId]),
  [['AHI001',2,'AHI001'],['AHI106',1,'AHI106']]);
assert.deepEqual(mill.evidence.map(row=>[row.itemId,row.itemRevision,row.unitId]),
  [['NEI134',1,'NEI134'],['NEI135',1,'NEI135']]);
for(const rule of [ep,ah,mill])assert.equal(rule.minimumEvidenceUnits,2);

assert.deepEqual(ep.evidence.find(row=>row.itemId==='EPI118').oppose,['support_only','practical_only']);
assert.deepEqual(ah.evidence.find(row=>row.itemId==='AHI106').support,['some_free_will']);
assert.deepEqual(ah.evidence.find(row=>row.itemId==='AHI106').oppose,['no_free_will']);
assert.ok(!ah.evidence.find(row=>row.itemId==='AHI106').support.includes('conditional_free_will'));
assert.ok(mill.nonEntailments.some(value=>/act-utilitarian/i.test(value)));
assert.ok(mill.nonEntailments.some(value=>/rule-utilitarian/i.test(value)));
assert.ok(mill.falsePositives.some(value=>/NE22, NE23, NE24, and NE25/.test(value)));

for(const [rule,sourceIds] of [
  [ep,['acad-epistemology','iep-fallibilism']],
  [ah,['free-will-inventory','gen-agency','audit2-freewill-sep']],
  [mill,['primary-mill-utilitarianism-ch2','sep-mill-moral-political','sep-utilitarianism-history']]
]){
  for(const sourceId of sourceIds){
    assert.ok(rule.sourceClaims.some(row=>row.sourceId===sourceId),`${rule.id} lacks claim trace ${sourceId}.`);
    const source=ledger.sources.find(row=>row.id===sourceId);
    assert.ok(source?.useByRules?.includes(rule.id),`${sourceId} ledger entry does not name ${rule.id}.`);
    assert.equal(source.validatesOurItems,false,`${sourceId} must not be presented as item validation.`);
  }
}

const itemRevision=id=>bank.items.find(item=>item.id===id).revision;
const input=(routeId,answers)=>({
  pilotId:routes.administrationId,bankVersion:bank.bankVersion,instrumentVersion:routes.instrumentVersion,
  presentedItems:routes.routes.find(route=>route.id===routeId).itemRefs.map(ref=>({
    ...ref,presented:Object.hasOwn(answers,ref.itemId),skippedByBranch:false
  })),
  responses:Object.entries(answers).map(([itemId,value])=>({
    itemId,itemRevision:itemRevision(itemId),state:value===null?'no_view':'answered',value
  }))
});
const report=(routeId,answers)=>compareWorldview({model,bank,scalesDoc:scales,input:input(routeId,answers),routeManifest:routes});
const state=(ruleId,routeId,answers)=>report(routeId,answers).commitments.find(row=>row.commitmentId===ruleId).state;

// EP03: objective attainability without certainty.
assert.equal(state(ruleIds.ep,'full',{EPI010:2,EPI118:'fallible_knowledge'}),'supported');
assert.equal(state(ruleIds.ep,'full',{EPI010:-2,EPI118:'practical_only'}),'opposed');
assert.equal(state(ruleIds.ep,'full',{EPI010:2,EPI118:'practical_only'}),'mixed_context_dependent');
assert.equal(state(ruleIds.ep,'full',{EPI010:2}),'leaned_toward');
assert.equal(state(ruleIds.ep,'full',{EPI010:2,EPI118:'case_dependent'}),'leaned_toward');
assert.equal(state(ruleIds.ep,'full',{EPI010:null,EPI118:null}),'insufficient_evidence');
assert.equal(state(ruleIds.ep,'full',{EPI015:2,EPI029:'approximately'}),'insufficient_evidence',
  'Domain-limited skepticism or approximation must not substitute for EP03 direct evidence.');

// AH01: existence belief without a compatibility theory.
assert.equal(state(ruleIds.ah,'full',{AHI001:2,AHI106:'some_free_will'}),'supported');
assert.equal(state(ruleIds.ah,'full',{AHI001:-2,AHI106:'no_free_will'}),'opposed');
assert.equal(state(ruleIds.ah,'full',{AHI001:2,AHI106:'no_free_will'}),'mixed_context_dependent');
assert.equal(state(ruleIds.ah,'full',{AHI001:2}),'leaned_toward');
assert.equal(state(ruleIds.ah,'full',{AHI001:2,AHI106:'conditional_free_will'}),'leaned_toward');
assert.equal(state(ruleIds.ah,'full',{AHI001:null,AHI106:null}),'insufficient_evidence');
assert.equal(state(ruleIds.ah,'full',{AHI103:2,AHI108:'determination_rules_out_freedom'}),'insufficient_evidence',
  'Incompatibilist compatibility evidence must not substitute for belief that some human action is free.');

// NE26: first principle without an act/rule reconstruction.
assert.equal(state(ruleIds.mill,'full',{NEI134:'general_happiness',NEI135:'happiness_controls'}),'supported');
assert.equal(state(ruleIds.mill,'full',{NEI134:'independent_authority',NEI135:'independent_rule_authority'}),'opposed');
assert.equal(state(ruleIds.mill,'full',{NEI134:'general_happiness',NEI135:'independent_rule_authority'}),'mixed_context_dependent');
assert.equal(state(ruleIds.mill,'full',{NEI134:'general_happiness'}),'leaned_toward');
assert.equal(state(ruleIds.mill,'full',{NEI134:null,NEI135:null}),'insufficient_evidence');
assert.equal(state(ruleIds.mill,'full',{NEI122:'act_outcome',NEI125:'maximize_welfare',NEI133:2}),'insufficient_evidence',
  'NE22/NE25 neighbors must not substitute for the interpretation-neutral first principle.');

for(const id of Object.values(ruleIds)){
  assert.equal(state(id,'quick',{}),'not_measured');
  assert.equal(state(id,'standard',{}),'not_measured');
}

// Internal reference comparison advances only after NE26 exists.
assert.equal(reference.catalogVersion,'reference-profile-catalog-1.2.0');
assert.equal(reference11.catalogVersion,'reference-profile-catalog-1.1.0');
assert.ok(!reference11.profiles.some(profile=>/mill/i.test(profile.id)));
const millProfile=reference.profiles.find(profile=>profile.id==='john-stuart-mill-general-happiness-scoped');
assert.ok(millProfile);
assert.deepEqual(millProfile.claims.map(claim=>claim.propositionId),[ruleIds.mill]);
assert.equal(millProfile.identityOutputAllowed,false);
assert.equal(millProfile.percentageMatchAllowed,false);
assert.ok(!millProfile.claims.some(claim=>['reviewed-NE22-act-consequence-criterion','reviewed-NE23-rule-consequence-criterion',
  'reviewed-NE24-welfarist-outcome-value','reviewed-NE25-total-welfare-maximization'].includes(claim.propositionId)));

console.log('Evidence-gap release: three two-unit direct paths, route omission, mixed/missing/lean states, neighbor non-substitution, provenance, reference boundary, and frozen 1.19 history passed.');
