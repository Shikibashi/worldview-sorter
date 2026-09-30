import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {compareWorldview} from '../packages/worldview/index.js';
import {loadSnapshot,readJson,validateContentIntegrity} from '../packages/governance/release.js';
import {validateAffinityCatalog} from '../packages/worldview/affinities.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=path=>readJson(root,path);
const old=await read('data/generic/model-v1.0-pilot.json');
const model=await read('data/generic/model-v1.1-pilot.json');
const bank=await read('data/items/candidate-v0.9.json');
const scalesDoc=await read('data/response-scales.json');
const formBefore=await read('data/philosophy/public-pilot-v1.json');
const form=await read('data/philosophy/public-pilot-v1.1.json');
const pilot=await read('data/pilots/pilot-candidate-v1.1.json');
const routes=await read('data/experience/progressive-depth-v1.1.json');
const catalog=await read('data/affinities/catalog-v1.1.json');
const current=await read('data/current.json');
assert.equal(current.modelRelease.version,'model-release-1.3.0');
assert.equal((await read('data/releases/model-release-v1.2.0.json')).releaseVersion,'model-release-1.2.0');
assert.equal(current.worldviewModel.version,model.modelVersion);
assert.equal(current.progressiveDepth.version,routes.policyVersion);
assert.equal(current.affinityCatalog.version,catalog.catalogVersion);
assert.ok(!Object.hasOwn(current,'worldviewCoverage'),'Current coverage must come from the pinned model, not a stale standalone audit.');
assert.ok(current.localizationBundleVersions.some(ref=>ref.locale==='en-US'&&ref.version==='localization-en-US-1.0.0'&&ref.path==='data/localization/en-US-v1.json'));
assert.ok(current.localizationBundleVersions.some(ref=>ref.locale==='en-US'&&ref.version==='localization-en-US-1.1.0'&&ref.path==='data/localization/en-US-v2.json'));
const next=structuredClone(current);
next.worldviewModel={version:model.modelVersion,path:'data/generic/model-v1.1-pilot.json'};
next.worldviewSourceLedger={version:'0.5.0',path:'data/generic/source-ledger-v0.5.json'};
next.fullForm={version:form.policyVersion,path:'data/philosophy/public-pilot-v1.1.json'};
next.pilotCandidate={version:pilot.pilotCandidateVersion,path:'data/pilots/pilot-candidate-v1.1.json'};
next.progressiveDepth={version:routes.policyVersion,path:'data/experience/progressive-depth-v1.1.json',
 manifestPath:'data/experience/progressive-depth-v1.1.manifest.json'};
next.affinityCatalog={version:catalog.catalogVersion,path:'data/affinities/catalog-v1.1.json',
 manifestPath:'data/affinities/manifest-v1.1.json'};
next.localizationCatalog={version:'localization-catalog-1.1.0',path:'data/localization/catalog-v2.json',
 manifestPath:'data/localization/manifest-v1.1.json'};
next.localizationBundles=[{locale:'ar',version:'localization-ar-draft-2',path:'data/localization/ar-draft-v2.json'},
 {locale:'en-US',version:'localization-en-US-1.1.0',path:'data/localization/en-US-v2.json'},
 {locale:'es-ES',version:'localization-es-ES-draft-2',path:'data/localization/es-ES-draft-v2.json'}];
assert.deepEqual(validateContentIntegrity(await loadSnapshot(root,next)),{
 items:562,constructs:182,publicRules:140,derivedRules:1,routes:3,traditions:6,localizationBundles:3});
validateAffinityCatalog({catalog,model,pilot});
assert.deepEqual(form.frozenItems,formBefore.frozenItems,'The successor cannot change frozen respondent item revisions.');
assert.deepEqual(routes.routes.map(route=>route.itemRefs),
 (await read('data/experience/progressive-depth-v1.json')).routes.map(route=>route.itemRefs),
 'The successor cannot change route item order or revisions.');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const [path,hash] of Object.entries(pilot.frozenArtifactHashes))
 assert.equal(sha(await readFile(new URL(path,new URL('../',import.meta.url)))),hash,'Pilot artifact hash: '+path);
const id='audit2-SO09-moral-scope';
assert.ok(old.publicRuleIds.includes(id));assert.ok(!model.publicRuleIds.includes(id));
assert.ok(!model.commitments.some(rule=>rule.id===id),'The conflated rule must not compute research-only output.');
assert.ok(!model.comparisons.some(comparison=>comparison.criteria.some(criterion=>criterion.commitmentId===id)));
assert.deepEqual(model.coverage.constructs.find(construct=>construct.id==='SO09').ruleIds,[]);
for(const route of routes.routes)assert.ok(!route.assessableDirectRuleIds.includes(id));
const revisions=new Map(bank.items.map(item=>[item.id,item.revision]));
// The test uses conceptual answer patterns, not synthetic participant evidence.
for(const answers of [
 [['SOI004',2],['SOI029',2]], [['SOI004',-2],['SOI029',-2]],
 [['SOI004',2],['SOI029',-2]], [['SOI004',-2],['SOI029',2]],
 [['SOI004',null,'no_view']], []]){
 const input={bankVersion:bank.bankVersion,instrumentVersion:form.instrumentVersion,
  presentedItems:form.frozenItems.map(ref=>({...ref,presented:answers.some(answer=>answer[0]===ref.itemId),skippedByBranch:false})),
  responses:answers.map(([itemId,value,state='answered'])=>({itemId,itemRevision:revisions.get(itemId),value,state}))};
 const historical=compareWorldview({model:old,bank,scalesDoc,input});
 const successor=compareWorldview({model,bank,scalesDoc,input});
 assert.ok(historical.commitments.some(row=>row.commitmentId===id));
 assert.ok(!successor.commitments.some(row=>row.commitmentId===id));
 assert.ok(successor.domains.find(domain=>domain.id==='SO').unresolvedConstructIds.includes('SO09'));
 assert.ok(!successor.comparisons.some(row=>row.criteria.some(criterion=>criterion.commitmentId===id)));
}
console.log('SO09 successor regressions passed: immutable items, public retirement, coverage gap, old behavior.');
