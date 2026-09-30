import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateResponseValue} from './engine/runtime/index.js';
import {compareWorldview} from './engine/worldview/index.js';
import {evaluatePhilosophicalAffinities} from './engine/worldview/affinities.js';
import {assessResearchReadiness,buildAuthoredClaimIndex,buildItemCodebook,diagnoseResearchRows,
 historicalEngineEquality} from './engine/research/handoff.js';
import {itemLocalization} from './engine/localization/index.js';

const root=path.resolve(process.argv[2]??path.dirname(fileURLToPath(import.meta.url)));
const read=async name=>readFile(path.join(root,name));
const json=async name=>JSON.parse(await read(name));
const rows=async name=>(await read(name)).toString().trim().split('\n').filter(Boolean).map(JSON.parse);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const files=async dir=>{const out=[];for(const entry of await readdir(dir,{withFileTypes:true})){
 const full=path.join(dir,entry.name);if(entry.isDirectory())out.push(...await files(full));
 else if(entry.isFile())out.push(path.relative(root,full));else throw Error('Unexpected file type in snapshot.');
 }return out;};
const noPrivateKeys=value=>{
 if(!value||typeof value!=='object')return;
 for(const [key,nested] of Object.entries(value)){
  assert.ok(!/email|username|accountid|ipaddress|sessionid|respondentkey|withdrawaltoken|sourcesessionfingerprint|supportticket/i.test(key),
   'Private identifier field in released row: '+key);
  noPrivateKeys(nested);
 }
};
const manifest=await json('manifest.json'),snapshot=await json('snapshot.json');
assert.equal(manifest.schemaVersion,'research-snapshot-manifest-1');
assert.equal(snapshot.schemaVersion,'research-snapshot-1.3.0');
assert.equal(snapshot.extractionLogicVersion,'research-snapshot-extractor-1.3.3');
assert.equal(snapshot.snapshotId,manifest.snapshotId);
for(const source of snapshot.engineReplay.sources){
 assert.ok(source.packagePath.startsWith('engine/')&&!source.packagePath.split('/').includes('..'));
 assert.equal(sha(await read(source.packagePath)),source.sha256,'Replay engine source mismatch.');
}
const listed=new Set(manifest.files.map(f=>f.path));
assert.equal(listed.size,manifest.files.length,'Duplicate package file.');
assert.deepEqual((await files(root)).sort(),[...listed,'manifest.json'].sort(),'Unlisted or missing package file.');
for(const file of manifest.files){
 assert.ok(!path.isAbsolute(file.path)&&!file.path.split('/').includes('..'),'Unsafe package path.');
 const bytes=await read(file.path);assert.equal(bytes.length,file.bytes,'Byte count mismatch: '+file.path);
 assert.equal(sha(bytes),file.sha256,'Hash mismatch: '+file.path);
}
const releaseByVersion=new Map(),archiveManifests=new Map();
for(const file of manifest.files.filter(f=>f.path.startsWith('model-release-')&&f.path.endsWith('.json'))){
 const release=await json(file.path);
 assert.ok(!releaseByVersion.has(release.releaseVersion),'Duplicate model release.');
 releaseByVersion.set(release.releaseVersion,release);
 for(const component of release.components){
  assert.ok(!path.isAbsolute(component.path)&&!component.path.split('/').includes('..'));
  assert.equal(sha(await read('model-components/'+component.path)),component.sha256,
   'Unavailable historical model component: '+component.path);
  if(component.key==='engine_source'){
   const engine=await json('model-components/'+component.path);
   assert.equal(engine.engineSourceVersion,component.version);
   archiveManifests.set(release.releaseVersion,engine);
   for(const source of engine.files){
    assert.ok(!path.isAbsolute(source.archivePath)&&!source.archivePath.split('/').includes('..'));
    assert.equal(sha(await read('model-components/'+source.archivePath)),source.sha256,
     'Unavailable historical engine source: '+source.archivePath);
   }
  }
 }
}
const [respondents,administrations,responses,items,codebook,claimIndex,derived,qualityFlags,versions,schema,bank,model,scalesDoc,catalog,pilot,form,diagnostics,readiness,registry,consentTerms,consentManifest,instrument]=await Promise.all([
 rows('respondents.ndjson'),rows('administrations.ndjson'),rows('responses.ndjson'),rows('items.ndjson'),
 rows('item-codebook.ndjson'),json('authored-claim-index.json'),rows('derived.ndjson'),rows('quality-flags.ndjson'),
 json('versions.json'),json('research-export.schema.json'),
 json('item-bank.json'),json('interpretation-model.json'),json('response-scales.json'),
 json('affinity-catalog.json'),json('pilot-manifest.json'),json('form-policy.json'),
 json('diagnostics.json'),json('readiness.json'),json('construct-registry.json'),
 json('consent-terms.json'),json('consent-manifest.json'),json('instrument-manifest.json')]);
const localizationBundles=await Promise.all(manifest.files.filter(file=>
 file.path.startsWith('localization-bundle-')&&file.path.endsWith('.json')).map(file=>json(file.path)));
const localizationCatalogs=await Promise.all(manifest.files.filter(file=>
 file.path.startsWith('localization-catalog-')&&file.path.endsWith('.json')).map(file=>json(file.path)));
assert.equal(versions.datasetSchemaVersion,snapshot.sourcePackageSchemaVersion);
assert.equal(versions.consentVersion,consentTerms.consentVersion);
assert.equal(consentManifest.consentVersion,consentTerms.consentVersion);
assert.equal(versions.consentSha256,consentManifest.sha256);
assert.equal(sha(await read('consent-terms.json')),consentManifest.sha256,'Consent terms do not match their pin.');
assert.equal(versions.catalogSha256,sha(await read('affinity-catalog.json')),'Affinity catalog pin mismatch.');
assert.equal(versions.bankVersion,bank.bankVersion);
assert.equal(versions.instrumentVersion,instrument.instrumentVersion);
assert.equal(versions.instrumentVersion,form.instrumentVersion);
assert.equal(versions.instrumentVersion,model.pilotInstrumentVersion);
assert.equal(versions.formPolicyVersion,form.policyVersion);
assert.equal(versions.modelVersion,model.modelVersion);
assert.equal(versions.modelVersion,form.modelVersion);
assert.equal(versions.resultSemanticsVersion,model.resultSemanticsVersion);
assert.equal(versions.derivedInferenceVersion,pilot.derivedInference.version);
assert.equal(versions.affinityCatalogVersion,catalog.catalogVersion);
assert.equal(versions.pilotCandidateVersion,pilot.pilotCandidateVersion);
assert.equal(catalog.modelVersion,model.modelVersion);
assert.equal(catalog.instrumentVersion,versions.instrumentVersion);
assert.equal(catalog.resultSemanticsVersion,versions.resultSemanticsVersion);
assert.deepEqual(versions.localizationCatalogVersions,localizationCatalogs.map(value=>value.catalogVersion));
assert.deepEqual(versions.localizationBundleVersions,localizationBundles.map(value=>value.bundleVersion));
assert.deepEqual(versions.modelReleaseVersions,[...releaseByVersion.keys()]);
assert.equal(snapshot.engineReplay.historicalSourceEquality,historicalEngineEquality({administrations,
 engineSources:snapshot.engineReplay.sources,releases:[...releaseByVersion.values()],archiveManifests}));
assert.equal(snapshot.engineReplay.engineVersion,model.engineVersion);
assert.equal(snapshot.includedAdministrationCount,administrations.length);
assert.deepEqual(snapshot.includedRoutes,[...new Set(administrations.map(a=>
 a.instrumentVersion+' / '+a.formPolicyVersion))].sort(),'Snapshot route inventory mismatch.');
assert.deepEqual(snapshot.includedModelVersions,[...new Set(administrations.map(a=>a.modelVersion))].sort(),
 'Snapshot model inventory mismatch.');
assert.deepEqual(snapshot.includedLocalizationVersions,[...new Set(administrations.map(a=>
 a.localizationBundleVersion).filter(Boolean))].sort(),'Snapshot localization inventory mismatch.');
assert.deepEqual(snapshot.includedItemRevisions,items.map(item=>({itemId:item.itemId,itemRevision:item.itemRevision})),
 'Snapshot item-revision inventory mismatch.');
assert.ok(Object.values(snapshot.excludedCounts).every(value=>Number.isInteger(value)&&value>=0));
assert.ok(['active','withdrawn'].every(key=>Number.isInteger(snapshot.sourceStatusCounts[key])&&
 snapshot.sourceStatusCounts[key]>=0));
assert.equal(administrations.length+Object.values(snapshot.excludedCounts).reduce((sum,value)=>sum+value,0),
 snapshot.sourceStatusCounts.active,'Snapshot source-status accounting mismatch.');
assert.equal(codebook.length,items.length);
assert.deepEqual(codebook,buildItemCodebook({items,bank,model,registry,localizationBundles,scalesDoc}),
 'Item codebook cannot be reproduced from the released authored sources.');
assert.deepEqual(claimIndex,buildAuthoredClaimIndex({model,catalog,items}),
 'Authored claim index cannot be reproduced from the released model and catalog.');
const schemaValue=(value,spec,label)=>{
 if(spec.$ref){
  const target=spec.$ref.split('/').slice(1).reduce((part,key)=>part?.[key.replaceAll('~1','/').replaceAll('~0','~')],schema);
  assert.ok(target,`Unresolved schema reference at ${label}`);return schemaValue(value,target,label);
 }
 const types=spec.type===undefined?[]:Array.isArray(spec.type)?spec.type:[spec.type];
 const matches=type=>type==='null'?value===null:type==='array'?Array.isArray(value):
  type==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):
  type==='integer'?Number.isInteger(value):type==='number'?typeof value==='number'&&Number.isFinite(value):
  typeof value===type;
 if(types.length)assert.ok(types.some(matches),`Invalid type at ${label}`);
 if(Object.hasOwn(spec,'const'))assert.deepEqual(value,spec.const,`Invalid constant at ${label}`);
 if(spec.enum)assert.ok(spec.enum.some(option=>Object.is(option,value)),`Invalid category at ${label}`);
 if(spec.minimum!==undefined)assert.ok(value>=spec.minimum,`Value below minimum at ${label}`);
 if(spec.pattern)assert.match(value,new RegExp(spec.pattern),`Invalid pattern at ${label}`);
 if(spec.format==='date')assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(value)&&
  Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value,
  `Invalid date at ${label}`);
 if(Array.isArray(value)&&spec.items)for(const [index,member] of value.entries())
  schemaValue(member,spec.items,`${label}[${index}]`);
 if(value!==null&&typeof value==='object'&&!Array.isArray(value)){
  for(const key of spec.required??[])assert.ok(Object.hasOwn(value,key),`Missing ${label}.${key}`);
  for(const [key,member] of Object.entries(value)){
   if(spec.additionalProperties===false)assert.ok(Object.hasOwn(spec.properties??{},key),`Unexpected ${label}.${key}`);
   if(spec.properties?.[key])schemaValue(member,spec.properties[key],`${label}.${key}`);
  }
 }
};
const exactFields=(row,definition)=>{schemaValue(row,schema.$defs[definition],definition);noPrivateKeys(row);};
const respondentMap=new Map(),administrationMap=new Map(),itemMap=new Map(bank.items.map(i=>[i.id,i]));
const scaleMap=new Map(scalesDoc.scales.map(s=>[s.id,s]));
for(const r of respondents){exactFields(r,'respondent');assert.ok(!respondentMap.has(r.researchRespondentId));
 respondentMap.set(r.researchRespondentId,r);}
for(const [index,item] of items.entries()){
 exactFields(item,'item');assert.equal(item.position,index);
 assert.equal(form.frozenItems[index].itemId,item.itemId);assert.equal(form.frozenItems[index].itemRevision,item.itemRevision);
 const canonical=itemMap.get(item.itemId);assert.equal(canonical?.revision,item.itemRevision);
 assert.equal(canonical.text,item.text);assert.equal(codebook[index].canonicalText,item.text);
 assert.equal(codebook[index].itemId,item.itemId);assert.equal(codebook[index].itemRevision,item.itemRevision);
 for(const use of codebook[index].authoredRuleUses){
  const rule=model.commitments.find(candidate=>candidate.id===use.propositionId);
  assert.ok(rule?.evidence.some(e=>e.itemId===item.itemId&&e.itemRevision===item.itemRevision));
  assert.equal(use.proposition,rule.proposition??null);
  assert.equal(use.scope,rule.scope??null);
  assert.equal(use.propositionBasis,rule.proposition?'explicit_rule_proposition':'inherited_rule_scope');
 }
}
for(const a of administrations){exactFields(a,'administration');assert.ok(!administrationMap.has(a.researchAdministrationId));
 assert.ok(respondentMap.has(a.researchRespondentId));assert.equal(a.consentVersion,versions.consentVersion);
 assert.equal(a.bankVersion,versions.bankVersion);assert.equal(a.instrumentVersion,versions.instrumentVersion);
 assert.equal(a.formPolicyVersion,versions.formPolicyVersion);assert.equal(a.modelVersion,versions.modelVersion);
 assert.equal(a.resultSemanticsVersion,versions.resultSemanticsVersion);
 assert.equal(a.derivedInferenceVersion,versions.derivedInferenceVersion);
 assert.equal(a.affinityCatalogVersion,versions.affinityCatalogVersion);
 assert.ok(['en','en-US',null].includes(a.respondentLocale),'Unsupported exported respondent locale.');
 assert.equal(a.presentationLocale,'en-US','Unsupported exported presentation locale.');
 assert.ok(['en',null].includes(a.interfaceLanguage),'Unsupported exported interface language.');
 assert.ok(a.contributedDate>=snapshot.contributionDateWindow.from&&a.contributedDate<=snapshot.contributionDateWindow.through);
 if(a.localizationBundleVersion){const bundle=localizationBundles.find(value=>value.bundleVersion===a.localizationBundleVersion);
  assert.ok(bundle,'Pinned localization bundle unavailable.');
  assert.equal(bundle.locale,a.presentationLocale);assert.equal(bundle.status,'approved');
  assert.equal(a.interfaceLanguage,bundle.language);
  assert.ok(localizationCatalogs.some(localization=>localization.catalogVersion===a.localizationCatalogVersion&&
   localization.locales.some(entry=>entry.locale===bundle.locale&&entry.bundleVersion===bundle.bundleVersion)),
   'Pinned localization catalog does not contain the wording bundle.');
 }else assert.equal(a.localizationCatalogVersion,null);
 if(a.modelReleaseVersion){const release=releaseByVersion.get(a.modelReleaseVersion);
  assert.ok(release,'Administration model release unavailable.');
  const components=new Map(release.components.map(component=>[component.key,component.version]));
  for(const [key,value] of [['bank',a.bankVersion],['full_form',a.formPolicyVersion],
   ['model',a.modelVersion],['affinity',a.affinityCatalogVersion]])
   assert.equal(components.get(key),value,'Administration release component mismatch: '+key);
  if(a.localizationBundleVersion)
   assert.equal(components.get('localization_bundle:'+a.presentationLocale),a.localizationBundleVersion);
  if(a.localizationCatalogVersion)
   assert.equal(components.get('localization_catalog'),a.localizationCatalogVersion);
 }
 administrationMap.set(a.researchAdministrationId,a);
}
const byAdministration=new Map(administrations.map(a=>[a.researchAdministrationId,[]]));
for(const r of responses){exactFields(r,'response');const a=administrationMap.get(r.researchAdministrationId);
 assert.ok(a,'Orphan response');const expected=items[r.position];
 assert.equal(r.itemId,expected?.itemId);assert.equal(r.itemRevision,expected?.itemRevision);
 assert.equal(r.domainId,expected.domainId);assert.equal(r.responseType,expected.responseType);
 assert.equal(r.responseScaleId,expected.responseScaleId);
 if(r.responseState==='answered'){
  assert.equal(r.missingReason,null);assert.equal(r.presented,true);
  validateResponseValue(itemMap.get(r.itemId),scaleMap.get(r.responseScaleId),'answered',r.rawValue);
 }else if(r.responseState===null){
  assert.ok(['not_reached','branch_not_shown'].includes(r.missingReason));assert.equal(r.rawValue,null);
  if(r.missingReason==='branch_not_shown')assert.equal(r.presented,false);
 }else{
  assert.equal(r.missingReason,r.responseState);assert.equal(r.presented,true);assert.equal(r.rawValue,null);
  validateResponseValue(itemMap.get(r.itemId),scaleMap.get(r.responseScaleId),r.responseState,null);
 }
 if(a.localizationBundleVersion){
  const bundle=localizationBundles.find(value=>value.bundleVersion===a.localizationBundleVersion);
  const expectedWording=itemLocalization(bundle,itemMap.get(r.itemId));
  assert.ok(expectedWording,'Localized item wording unavailable.');
  assert.equal(r.translationStatus,'approved');
  assert.equal(r.textVersion,expectedWording.textVersion,'Pinned response text version mismatch.');
  assert.equal(r.variantId,expectedWording.variantId,'Pinned response variant mismatch.');
 }else {assert.equal(r.translationStatus,'historical_canonical_unpinned');
  assert.equal(r.textVersion,null);assert.equal(r.variantId,null);}
 byAdministration.get(r.researchAdministrationId).push(r);
}
for(const a of administrations){const observed=byAdministration.get(a.researchAdministrationId).sort((x,y)=>x.position-y.position);
 assert.equal(observed.length,a.assignedItems);assert.equal(observed.length,items.length);
 assert.equal(observed.filter(r=>r.responseState!==null).length,a.recordedResponses);
 assert.ok(observed.every((r,i)=>r.position===i),'Duplicate or missing route position.');
}
const repeatCounts=new Map();for(const a of administrations)
 repeatCounts.set(a.researchRespondentId,(repeatCounts.get(a.researchRespondentId)??0)+1);
assert.deepEqual(qualityFlags,administrations.map(a=>{
 const observed=byAdministration.get(a.researchAdministrationId),flags=[];
 if(a.completionStatus==='in_progress')flags.push('partial_administration');
 if(observed.some(r=>r.missingReason==='not_reached'))flags.push('unreached_positions');
 if(observed.some(r=>r.missingReason==='branch_not_shown'))flags.push('branch_exclusions');
 if(repeatCounts.get(a.researchRespondentId)>1)flags.push('linked_repeat');
 if(a.localizationBundleVersion===null)flags.push('historical_wording_unpinned');
 if(a.modelReleaseVersion===null)flags.push('model_release_unpinned');
 return {researchAdministrationId:a.researchAdministrationId,flags};
}),'Quality flags do not match released raw rows.');
assert.deepEqual(diagnostics,diagnoseResearchRows({respondents,administrations,responses,items,model,
 consentAudit:snapshot.sourceStatusCounts}),'Diagnostics cannot be reproduced from released raw rows.');
assert.deepEqual(readiness,assessResearchReadiness(diagnostics),
 'Readiness screening cannot be reproduced from released diagnostics.');
const ruleById=new Map(model.commitments.map(rule=>[rule.id,rule]));
const expectedDerived=administrations.map(a=>{
 const observed=byAdministration.get(a.researchAdministrationId);
 const input={bankVersion:a.bankVersion,instrumentVersion:a.instrumentVersion,
  presentedItems:observed.map(r=>({index:r.position,itemId:r.itemId,itemRevision:r.itemRevision,domainId:r.domainId,
   responseScaleId:r.responseScaleId,presented:r.presented,skippedByBranch:r.missingReason==='branch_not_shown'})),
  responses:observed.filter(r=>r.responseState!==null).map(r=>({itemId:r.itemId,itemRevision:r.itemRevision,
   state:r.responseState,value:r.rawValue,changedAnswerCount:r.changedAnswerCount}))};
 const report=compareWorldview({model,bank,scalesDoc,input});
 const affinities=evaluatePhilosophicalAffinities({catalog,report,model,pilot});
 return {researchAdministrationId:a.researchAdministrationId,modelVersion:a.modelVersion,
  resultSemanticsVersion:a.resultSemanticsVersion,affinityCatalogVersion:a.affinityCatalogVersion,
  propositions:report.commitments.filter(c=>model.publicRuleIds.includes(c.commitmentId)).map(c=>({id:c.commitmentId,
   domainId:c.domainId,constructId:c.constructId,
   proposition:ruleById.get(c.commitmentId).proposition??null,scope:c.scope,
   propositionBasis:ruleById.get(c.commitmentId).proposition?'explicit_rule_proposition':'inherited_rule_scope',
   state:c.state,leanDirection:c.leanDirection,supportingUnits:c.supportingUnits,opposingUnits:c.opposingUnits,
   measurementStatus:c.measurementStatus,
   evidence:c.observations.filter(o=>o.rawResponse).map(o=>({itemId:o.itemId,itemRevision:o.itemRevision,
    unitId:o.unitId,meaning:o.state})),sourceIds:c.sourceIds})),
  derived:report.derived.map(d=>({id:d.id,proposition:d.proposition,state:d.state,
   dependencies:d.dependencies,directConflictItemRefs:d.directConflicts.map(x=>({itemId:x.itemId,itemRevision:x.itemRevision})),
   sourceIds:d.sourceIds})),
  affinities:affinities.traditions.map(t=>({traditionId:t.id,summaryState:t.summaryState,
   criteria:t.criteria.map(c=>({criterionId:c.id,role:c.role,mappingStatus:c.mapping.status,
    mappedPropositionId:c.mapping.propositionId??null,finding:c.finding,observedState:c.observedState,
    sourceIds:c.sourceIds}))}))};
});
assert.deepEqual(derived,expectedDerived,'Authored output cannot be reproduced from released raw rows and pinned engine.');
console.log(JSON.stringify({snapshotId:snapshot.snapshotId,files:manifest.files.length,administrations:administrations.length,
 responses:responses.length,authoredReplay:'pass'}));
