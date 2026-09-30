import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateModel} from '../packages/worldview/index.js';
import {validateAffinityCatalog} from '../packages/worldview/affinities.js';
import {validateLocalizationBundle,validateLocalizationCatalog} from '../packages/localization/index.js';
import {generatePhilosophyPacket,auditPhilosophyPacket} from '../packages/philosophy/forms.js';

// An explicit successor to the frozen 1.0 pilot. It retires one conflated
// interpretation without changing any raw question, item revision, or route item.
const root=new URL('../',import.meta.url);
const read=async relative=>JSON.parse(await readFile(new URL(relative,root),'utf8'));
const json=value=>JSON.stringify(value,null,2)+'\n';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const writeNew=async(relative,value)=>{
 const bytes=json(value),url=new URL(relative,root);
 try{const previous=await readFile(url,'utf8');assert.equal(previous,bytes,'Versioned artifact changed: '+relative);}
 catch(error){if(error.code!=='ENOENT')throw error;await writeFile(url,bytes,{flag:'wx'});}
 return digest(bytes);
};
const exact=(actual,expected,label)=>assert.equal(actual,expected,label+' changed in frozen predecessor');
const remove=(rows,predicate,label)=>{const kept=rows.filter(row=>!predicate(row));exact(rows.length-kept.length,1,label);return kept;};
const ruleId='audit2-SO09-moral-scope';
const [bank,scalesDoc,modelBefore,formBefore,pilotBefore,routeBefore,affinityBefore,
 catalogBefore,enBefore,esBefore,arBefore,experienceBefore]=await Promise.all([
 read('data/items/candidate-v0.9.json'),read('data/response-scales.json'),
 read('data/generic/model-v1.0-pilot.json'),read('data/philosophy/public-pilot-v1.json'),
 read('data/pilots/pilot-candidate-v1.json'),read('data/experience/progressive-depth-v1.json'),
 read('data/affinities/catalog-v1.json'),read('data/localization/catalog-v1.json'),
 read('data/localization/en-US-v1.json'),read('data/localization/es-ES-draft-v1.json'),
 read('data/localization/ar-draft-v1.json'),read('data/experience/policy-v1.6.json')]);
exact(modelBefore.modelVersion,'generic-1.0.0-pilot','Model version');
exact(formBefore.policyVersion,'philosophy-pilot-1.0.0','Form version');
exact(routeBefore.policyVersion,'progressive-depth-1.0.0','Route version');
const model=structuredClone(modelBefore);
model.modelVersion='generic-1.1.0-pilot';model.parentModelVersion=modelBefore.modelVersion;
model.commitments=remove(model.commitments,row=>row.id===ruleId,'SO09 rule');
model.publicRuleIds=remove(model.publicRuleIds,id=>id===ruleId,'SO09 public membership');
model.comparisons=remove(model.comparisons,row=>row.criteria.some(c=>c.commitmentId===ruleId),'SO09 comparison');
const covered=model.coverage.constructs.find(row=>row.id==='SO09');assert.ok(covered);
exact(covered.ruleIds[0],ruleId,'SO09 coverage');covered.ruleIds=[];
covered.status='candidate_or_reference_only_no_inference_rule';
covered.auditDecision='reopened_after_item_target_review';covered.disposition='unresolved';
covered.auditRationale='SOI004@2 asks whether an equal claim can occur; SOI029@1 asks usual priority in one matched choice. These do not corroborate or oppose the same proposition.';
covered.coverageGap='A separate direct indicator is needed for possible equal claims, or an independently corroborated usual-priority proposition must be authored.';
for(const row of model.coverage.items)row.ruleIds=row.ruleIds.filter(id=>id!==ruleId);
for(const facet of model.facets)facet.ruleIds=facet.ruleIds.filter(id=>id!==ruleId);
model.limitations.push('SO09 moral scope remains an item target but has no successor interpretation: possible equal claims and usual priority are distinct questions.');
validateModel({model,bank,scalesDoc});
const modelPath='data/generic/model-v1.1-pilot.json';
const modelHash=await writeNew(modelPath,model);

const form=structuredClone(formBefore);
form.policyVersion='philosophy-pilot-1.1.0';form.modelVersion=model.modelVersion;
form.parentPolicyVersion=formBefore.policyVersion;
form.facets=remove(form.facets,row=>row.ruleIds.includes(ruleId),'SO09 form facet');
form.bundles=remove(form.bundles,row=>row.commitmentId===ruleId,'SO09 form bundle');
form.frozenPlannedFacets=remove(form.frozenPlannedFacets,row=>row.facetId===ruleId+':opportunity','SO09 frozen plan');
assert.deepEqual(form.frozenItems,formBefore.frozenItems,'No item revision or order may change.');
const formPath='data/philosophy/public-pilot-v1.1.json';
const formHash=await writeNew(formPath,form);
const pilot=await read('data/pilots/pilot-0.2.json');
const packet=generatePhilosophyPacket({bank,pilot,policy:form,size:238,seed:'so09-successor-validation'});
assert.ok(auditPhilosophyPacket(packet,form).allRequired,'Retirement must not invalidate other form guarantees.');

const affinity=structuredClone(affinityBefore);
affinity.catalogVersion='philosophical-affinity-1.1.0';affinity.modelVersion=model.modelVersion;
const affinityPilot=structuredClone(pilotBefore);
affinityPilot.interpretationRules.routeMeasuredDirectRuleIds=
 remove(affinityPilot.interpretationRules.routeMeasuredDirectRuleIds,id=>id===ruleId,'SO09 affinity pilot opportunity');
validateAffinityCatalog({catalog:affinity,model,pilot:affinityPilot});
const affinityPath='data/affinities/catalog-v1.1.json';
const affinityHash=await writeNew(affinityPath,affinity);
const affinityManifestPath='data/affinities/manifest-v1.1.json';
await writeNew(affinityManifestPath,{manifestVersion:'philosophical-affinity-manifest-1.0.0',
 catalogVersion:affinity.catalogVersion,path:affinityPath,sha256:affinityHash,modelVersion:model.modelVersion,
 instrumentVersion:form.instrumentVersion,affinitySemanticsVersion:affinity.affinitySemanticsVersion});

const routes=structuredClone(routeBefore);
routes.policyVersion='progressive-depth-1.1.0';routes.modelVersion=model.modelVersion;
routes.affinityCatalogVersion=affinity.catalogVersion;routes.pilotFormPolicyVersion=form.policyVersion;
routes.adaptivePolicyVersion='authored-clarify-1.1.0';
routes.selectionBasis+=' The successor retires SO09 interpretation without changing assigned items.';
for(const route of routes.routes){route.routeVersion=route.id+'-1.1.0';
 route.assessableDirectRuleIds=remove(route.assessableDirectRuleIds,id=>id===ruleId,route.id+' SO09 assessability');}
const routePath='data/experience/progressive-depth-v1.1.json';
const routeHash=await writeNew(routePath,routes);
const routeManifestPath='data/experience/progressive-depth-v1.1.manifest.json';
await writeNew(routeManifestPath,{schemaVersion:'immutable-content-manifest-1',policyVersion:routes.policyVersion,
 path:routePath,sha256:routeHash});

const sourceLedger=await read('data/generic/source-ledger-v0.4.json');
exact(sourceLedger.version,'0.4.0','Source ledger version');
sourceLedger.version='0.5.0';
const cosmopolitanSource=sourceLedger.sources.find(source=>source.id==='domain-cosmopolitanism');
assert.ok(cosmopolitanSource);
cosmopolitanSource.useByRules=remove(cosmopolitanSource.useByRules,id=>id===ruleId,'SO09 source-ledger rule link');
await writeNew('data/generic/source-ledger-v0.5.json',sourceLedger);

const bundles=[];
for(const [before,version,file] of [[enBefore,'localization-en-US-1.1.0','en-US-v2.json'],
 [esBefore,'localization-es-ES-draft-2','es-ES-draft-v2.json'],
 [arBefore,'localization-ar-draft-2','ar-draft-v2.json']]){
 const bundle=structuredClone(before);bundle.bundleVersion=version;bundle.modelVersion=model.modelVersion;
 bundle.affinityCatalogVersion=affinity.catalogVersion;
 const relative='data/localization/'+file,sha256=await writeNew(relative,bundle);
 bundles.push({bundle,relative,sha256});
}
const catalog=structuredClone(catalogBefore);catalog.catalogVersion='localization-catalog-1.1.0';
catalog.modelVersion=model.modelVersion;catalog.affinityCatalogVersion=affinity.catalogVersion;
for(const row of catalog.locales){const replacement=bundles.find(x=>x.bundle.locale===row.locale);
 assert.ok(replacement);row.bundleVersion=replacement.bundle.bundleVersion;row.path=replacement.relative;}
validateLocalizationCatalog(catalog,{bank,model,affinityCatalog:affinity});
for(const {bundle} of bundles)validateLocalizationBundle(bundle,{catalog,bank,scalesDoc,model,affinityCatalog:affinity});
const catalogPath='data/localization/catalog-v2.json';
const catalogHash=await writeNew(catalogPath,catalog);
const localizationManifestPath='data/localization/manifest-v1.1.json';
await writeNew(localizationManifestPath,{schemaVersion:'worldview-localization-manifest-1',
 catalogVersion:catalog.catalogVersion,hashes:{[catalogPath]:catalogHash,
  'data/localization/terminology-review-v1.json':digest(await readFile(new URL('data/localization/terminology-review-v1.json',root))),
  ...Object.fromEntries(bundles.map(x=>[x.relative,x.sha256]))}});

const pilotManifest=structuredClone(pilotBefore);
pilotManifest.pilotCandidateVersion='pilot-candidate-1.1.0';
pilotManifest.route.version=form.policyVersion;pilotManifest.route.path=formPath;
pilotManifest.interpretationRules.version=model.modelVersion;pilotManifest.interpretationRules.path=modelPath;
for(const key of ['directRuleIds','routeMeasuredDirectRuleIds'])
 pilotManifest.interpretationRules[key]=remove(pilotManifest.interpretationRules[key],id=>id===ruleId,'Pilot '+key);
delete pilotManifest.frozenArtifactHashes['data/generic/model-v1.0-pilot.json'];
delete pilotManifest.frozenArtifactHashes['data/philosophy/public-pilot-v1.json'];
pilotManifest.frozenArtifactHashes[modelPath]=modelHash;pilotManifest.frozenArtifactHashes[formPath]=formHash;
pilotManifest.limitations.push('SO09 interpretation was retired in this successor; historical release 1.1.0 retains the original rule.');
const pilotPath='data/pilots/pilot-candidate-v1.1.json';
await writeNew(pilotPath,pilotManifest);

const experience=structuredClone(experienceBefore);
experience.formPolicies.push({version:form.policyVersion,path:formPath},{version:routes.policyVersion,path:routePath});
experience.modelPolicies.push({version:model.modelVersion,path:modelPath});
experience.pilotCandidate={version:pilotManifest.pilotCandidateVersion,path:pilotPath};
experience.progressivePolicy={version:routes.policyVersion,path:routePath,manifestPath:routeManifestPath};
experience.localizationCatalogVersion=catalog.catalogVersion;experience.localizationCatalogPath=catalogPath;
for(const row of experience.routes)row.formPolicyVersion=row.id==='full'?form.policyVersion:routes.policyVersion;
await writeNew('data/experience/policy-v1.7.json',experience);
console.log(JSON.stringify({model:model.modelVersion,form:form.policyVersion,routes:routes.policyVersion,
 affinity:affinity.catalogVersion,localization:catalog.catalogVersion,pilot:pilotManifest.pilotCandidateVersion,
 itemRevisionsUnchanged:true,builderDoesNotChangeActivePointer:true},null,2));
