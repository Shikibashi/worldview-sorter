import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {validateLocalizationCatalog,validateLocalizationBundle} from '../localization/index.js';
import {verifyEngineSource} from './engine-source.js';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const unique=(values,label)=>assert.equal(new Set(values).size,values.length,'Duplicate '+label);
export const readJson=async(root,relative)=>JSON.parse(await readFile(path.join(root,relative),'utf8'));
const ref=(key,version,file)=>({key,version,path:file});
export function componentRefs(current){
 const refs=[
  ref('bank',current.candidateBank.version,current.candidateBank.path),
  ref('registry',current.registry?.version??current.registryVersion,current.registry?.path??'data/constructs.json'),
  ref('sources',current.sourceRegistry?.version??'legacy-unversioned',current.sourceRegistry?.path??'data/sources.json'),
  ref('model',current.worldviewModel.version,current.worldviewModel.path),
  ref('source_ledger',current.worldviewSourceLedger.version,current.worldviewSourceLedger.path),
  ref('pilot',current.pilotCandidate.version,current.pilotCandidate.path),
  ref('content_review',current.contentReview?.version??'pilot-content-review-1.0.0',current.contentReview?.path??'data/pilots/content-review-v1.json'),
  ref('unmapped_audit',current.unmappedAcademicAudit.version,current.unmappedAcademicAudit.path),
  ref('full_form',current.fullForm.version,current.fullForm.path),
  ref('progressive_routes',current.progressiveDepth.version,current.progressiveDepth.path),
  ref('progressive_manifest',current.progressiveDepth.version,current.progressiveDepth.manifestPath),
  ref('affinity',current.affinityCatalog.version,current.affinityCatalog.path),
  ref('affinity_manifest',current.affinityCatalog.version,current.affinityCatalog.manifestPath),
  ref('localization_catalog',current.localizationCatalog.version,current.localizationCatalog.path),
  ref('localization_manifest',current.localizationCatalog.version,current.localizationCatalog.manifestPath),
  ref('response_scales',current.responseScales?.version??'1.0.0',current.responseScales?.path??'data/response-scales.json'),
  ...(current.localizationBundles??[]).map(x=>ref('localization_bundle:'+x.locale,x.version,x.path)),
  ...(current.engineSource?[ref('engine_source',current.engineSource.version,current.engineSource.path)]:[])
 ];
 unique(refs.map(x=>x.key),'component key');
 return refs.sort((a,b)=>a.key.localeCompare(b.key));
}
export async function captureRelease(root,current,version){
 assert.match(version,/^model-release-[0-9]+\.[0-9]+\.[0-9]+$/);
 // The already published 1.0.0 manifest predates executable-source pinning.
 if(version!=='model-release-1.0.0')assert.ok(current.engineSource,
  'New model releases must pin a versioned engine-source archive.');
 if(current.engineSource)await verifyEngineSource(root,current.engineSource);
 const components=[];
 for(const component of componentRefs(current)){const bytes=await readFile(path.join(root,component.path));
  components.push({...component,sha256:sha(bytes)});}
 const model=await readJson(root,current.worldviewModel.path),affinity=await readJson(root,current.affinityCatalog.path);
 return {schemaVersion:'worldview-model-release-1',releaseVersion:version,releaseKind:'authored_operational_pilot',
  reviewBasis:[current.contentReview?.path??'data/pilots/content-review-v1.json',
   current.unmappedAcademicAudit?.path??'data/academic/unmapped-audit-v2.json',
   current.affinityCatalog.manifestPath,current.localizationCatalog.manifestPath],
  resultSemanticsVersion:model.resultSemanticsVersion,affinitySemanticsVersion:affinity.affinitySemanticsVersion,
  components};
}
export async function verifyRelease(root,current,manifest){
 assert.equal(manifest.schemaVersion,'worldview-model-release-1');
 assert.equal(current.modelRelease?.version,manifest.releaseVersion,'Current model release version mismatch');
 const actual=await captureRelease(root,current,manifest.releaseVersion);
 assert.deepEqual(actual,manifest,'Pinned model release changed; create a new release and approved proposal');
 return manifest;
}
export async function loadSnapshot(root,current){
 const [bank,registry,sources,sourceLedger,model,affinity,routes,pilotManifest,contentReview,localizationCatalog,scalesDoc]=await Promise.all([
  readJson(root,current.candidateBank.path),readJson(root,current.registry?.path??'data/constructs.json'),
  readJson(root,current.sourceRegistry?.path??'data/sources.json'),readJson(root,current.worldviewSourceLedger.path),
  readJson(root,current.worldviewModel.path),
  readJson(root,current.affinityCatalog.path),readJson(root,current.progressiveDepth.path),
  readJson(root,current.pilotCandidate.path),
  readJson(root,current.contentReview?.path??'data/pilots/content-review-v1.json'),readJson(root,current.localizationCatalog.path),
  readJson(root,current.responseScales?.path??'data/response-scales.json')]);
 const bundles=await Promise.all((current.localizationBundles??[]).map(x=>readJson(root,x.path)));
 return {bank,registry,sources,sourceLedger,model,affinity,routes,pilotManifest,contentReview,scalesDoc,
  localization:{catalog:localizationCatalog,bundles}};
}
export function currentFromManifest(manifest){
 const byKey=new Map(manifest.components.map(c=>[c.key,c])),get=key=>{const value=byKey.get(key);
  assert.ok(value,'Historical model release missing '+key);return value;};
 return {candidateBank:get('bank'),registryVersion:get('registry').version,registry:get('registry'),sourceRegistry:get('sources'),
  worldviewModel:get('model'),worldviewSourceLedger:get('source_ledger'),pilotCandidate:get('pilot'),
  contentReview:get('content_review'),fullForm:get('full_form'),
  progressiveDepth:{...get('progressive_routes'),manifestPath:get('progressive_manifest').path},
  unmappedAcademicAudit:get('unmapped_audit'),
  affinityCatalog:{...get('affinity'),manifestPath:get('affinity_manifest').path},
  localizationCatalog:{...get('localization_catalog'),manifestPath:get('localization_manifest').path},
  responseScales:get('response_scales'),localizationBundles:manifest.components.filter(c=>c.key.startsWith('localization_bundle:'))
   .map(c=>({locale:c.key.slice('localization_bundle:'.length),version:c.version,path:c.path})),
  ...(byKey.has('engine_source')?{engineSource:get('engine_source')}: {})};
}
export function validateContentIntegrity(snapshot){
 const {bank,registry,sources,sourceLedger,model,affinity,routes,contentReview,scalesDoc,localization}=snapshot;
 const ids=(rows,label)=>{unique(rows.map(x=>x.id),label);return new Map(rows.map(x=>[x.id,x]));};
 const items=ids(bank.items,'item ID'),constructs=ids(registry.constructs,'construct ID'),
  rules=ids(model.commitments,'proposition ID'),derived=ids(model.derivedRules,'derived ID'),
  sourceById=ids([...sources.sources,...sourceLedger.sources,...model.sources,...affinity.sources].filter((s,i,all)=>
   all.findIndex(x=>x.id===s.id)===i),'source ID'),
  traditions=ids(affinity.traditions,'tradition ID');
 const sharedSources=new Map();for(const source of [...sources.sources,...sourceLedger.sources,...model.sources,...affinity.sources]){
  const prior=sharedSources.get(source.id);if(prior)assert.ok(prior.title===source.title&&prior.url===source.url,
   'Source identity drift for '+source.id);
  else sharedSources.set(source.id,source);}
 unique(routes.routes.map(r=>r.id),'route ID');
 assert.equal(model.bankVersion,bank.bankVersion);
 assert.equal(model.registryVersion,registry.registryVersion);
 assert.equal(affinity.modelVersion,model.modelVersion);
 assert.equal(routes.modelVersion,model.modelVersion);
 const publicRules=new Set(model.publicRuleIds),researchRules=new Set(model.researchOnlyRuleIds);
 unique(model.publicRuleIds,'public rule ID');unique(model.researchOnlyRuleIds,'research rule ID');
 for(const id of publicRules)assert.ok(rules.has(id),'Unknown public proposition '+id);
 for(const id of researchRules)assert.ok(rules.has(id)&&!publicRules.has(id),'Research-only rule leaked into public inference '+id);
 const needSources=(references,context)=>{for(const id of references??[]){const source=sourceById.get(id);
  assert.ok(source,context+' references missing source '+id);
  assert.ok(source.status!=='deprecated'&&typeof source.title==='string'&&source.title&&
   typeof source.url==='string'&&/^https:\/\//.test(source.url),context+' references unusable source '+id);}};
 for(const item of items.values()){
  for(const target of item.targets??[])assert.ok(constructs.has(target.constructId),'Unknown item target '+item.id);
  needSources(item.provenance?.sourceRefs,'Item '+item.id);
 }
 for(const construct of constructs.values())needSources(construct.evidenceBasis,'Construct '+construct.id);
 for(const rule of rules.values()){
  assert.ok(constructs.has(rule.constructId),'Unknown proposition construct '+rule.id);
  for(const e of rule.evidence??[])assert.equal(items.get(e.itemId)?.revision,e.itemRevision,'Stale rule item revision '+rule.id);
  needSources(rule.sourceIds,'Proposition '+rule.id);
 }
 for(const rule of derived.values()){
  assert.ok(constructs.has(rule.constructId),'Unknown derived construct '+rule.id);
  for(const dep of rule.requires??[])assert.ok(publicRules.has(dep.ruleId)||derived.has(dep.ruleId),'Unknown derived dependency '+rule.id);
  needSources(rule.sourceIds,'Derived rule '+rule.id);
 }
 for(const source of sourceLedger.sources){
  assert.ok(source.status!=='deprecated'&&typeof source.title==='string'&&source.title&&
   typeof source.url==='string'&&/^https:\/\//.test(source.url),'Unusable source ledger record '+source.id);
  for(const id of source.useByItems??[])assert.ok(items.has(id),'Ledger source '+source.id+' refers to missing item '+id);
  for(const id of source.useByConstructs??[])assert.ok(constructs.has(id),'Ledger source '+source.id+' refers to missing construct '+id);
  for(const id of source.useByRules??[])assert.ok(rules.has(id)||derived.has(id),
   'Ledger source '+source.id+' refers to missing rule '+id);
 }
 const visiting=new Set(),visited=new Set(),visit=id=>{if(visited.has(id))return;
  assert.ok(!visiting.has(id),'Circular derived dependency '+id);visiting.add(id);
  for(const dep of derived.get(id)?.requires??[])if(derived.has(dep.ruleId))visit(dep.ruleId);
  visiting.delete(id);visited.add(id);};
 for(const id of derived.keys())visit(id);
 const decisions=new Map(contentReview.decisions.map(d=>[d.itemId,d]));
 for(const route of routes.routes){unique(route.itemRefs.map(r=>r.itemId),'route item '+route.id);
  for(const ref of route.itemRefs){const item=items.get(ref.itemId),decision=decisions.get(ref.itemId);
   assert.equal(item?.revision,ref.itemRevision,'Stale route item revision '+route.id+':'+ref.itemId);
   assert.ok(item.status!=='draft'&&item.status!=='deprecated','Ineligible item on active route '+ref.itemId);
   assert.equal(decision?.decision,'retain_for_pilot','Route item lacks frozen editorial review '+ref.itemId);}}
 for(const tradition of traditions.values()){
  unique(tradition.commitments.map(c=>c.id),'criterion '+tradition.id);
  needSources([...tradition.primarySourceIds,...tradition.secondarySourceIds],'Tradition '+tradition.id);
  for(const criterion of tradition.commitments){needSources(criterion.sourceIds,'Criterion '+tradition.id+'/'+criterion.id);
   const id=criterion.mapping?.propositionId;if(id)assert.ok((publicRules.has(id)||derived.has(id))&&!researchRules.has(id),
    'Affinity criterion points to unavailable proposition '+id);}}
 validateLocalizationCatalog(localization.catalog,{bank,model,affinityCatalog:affinity});
 for(const bundle of localization.bundles){const registered=localization.catalog.locales.some(r=>r.locale===bundle.locale&&r.bundleVersion===bundle.bundleVersion);
  if(registered)validateLocalizationBundle(bundle,{catalog:localization.catalog,bank,scalesDoc,model,affinityCatalog:affinity});}
 return {items:items.size,constructs:constructs.size,publicRules:publicRules.size,derivedRules:derived.size,
  routes:routes.routes.length,traditions:traditions.size,localizationBundles:localization.bundles.length};
}
