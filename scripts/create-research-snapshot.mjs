import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {access,link,mkdir,mkdtemp,open,readFile,readdir,realpath,rename,rm,stat,unlink,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assessResearchReadiness,buildAuthoredClaimIndex,buildItemCodebook,buildQualityFlags,diagnoseResearchRows,
 historicalEngineEquality,rekeyResearchRows,replayAuthoredRows} from '../packages/research/handoff.js';

const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2);
const flag=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
const store=flag('--store'),output=flag('--out'),snapshotId=flag('--id'),from=flag('--from'),through=flag('--through');
const exclusionsPath=flag('--exclusions');
const supersedes=flag('--supersedes'),correctionNote=flag('--correction-note');
const required=['--store','--out','--id','--from','--through'];
const allowedCount=required.length*2+(exclusionsPath?2:0)+(supersedes?2:0)+(correctionNote?2:0)+
 (args.includes('--quiesced')?1:0);
if(required.some(name=>!flag(name))||!args.includes('--quiesced')||args.length!==allowedCount)
 throw Error('Usage: node scripts/create-research-snapshot.mjs --store PRIVATE_STORE --out NEW_DIR --id SNAPSHOT_ID --from YYYY-MM-DD --through YYYY-MM-DD --quiesced [--exclusions PRIVATE_JSON] [--supersedes OLD_ID --correction-note TEXT]');
if(!/^wvs-research-[a-z0-9][a-z0-9.-]*-v[1-9][0-9]*$/.test(snapshotId))throw Error('Invalid snapshot ID.');
if(Boolean(supersedes)!==Boolean(correctionNote)||supersedes===snapshotId||
 (supersedes&&!/^wvs-research-[a-z0-9][a-z0-9.-]*-v[1-9][0-9]*$/.test(supersedes))||
 (correctionNote&&(correctionNote.length>500||!correctionNote.trim())))
 throw Error('A correction requires a distinct prior snapshot ID and a concise reason.');
const date=/^\d{4}-\d{2}-\d{2}$/;
const validDate=value=>date.test(value)&&Number.isFinite(Date.parse(value))&&
 new Date(value).toISOString().slice(0,10)===value;
if(!validDate(from)||!validDate(through)||from>through)
 throw Error('Invalid contribution-date window.');
const storeRoot=path.resolve(store),outRoot=path.resolve(output);
const escrowPath=path.join(storeRoot,'release-linkage-'+snapshotId+'.json');
if(path.basename(outRoot)!==snapshotId)throw Error('Snapshot directory name must equal its stable ID.');
if(outRoot===root||outRoot.startsWith(root+path.sep)||outRoot===storeRoot||outRoot.startsWith(storeRoot+path.sep))
 throw Error('Snapshot must be outside the repository and private store.');
if((await stat(storeRoot)).isDirectory()===false)throw Error('Research store is not a directory.');
const [realParent,realStore,realRoot]=await Promise.all([realpath(path.dirname(outRoot)),realpath(storeRoot),realpath(root)]);
if(realParent===realRoot||realParent.startsWith(realRoot+path.sep)||
 realParent===realStore||realParent.startsWith(realStore+path.sep))
 throw Error('Snapshot parent resolves inside the repository or contribution store.');
try{await access(outRoot);throw Error('Snapshot output already exists; release a new ID and directory.');}
catch(error){if(error.code!=='ENOENT')throw error;}
try{await access(escrowPath);throw Error('Private release linkage already exists for this snapshot ID.');}
catch(error){if(error.code!=='ENOENT')throw error;}
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const readJson=async file=>JSON.parse(await readFile(file,'utf8'));
const enginePaths=['packages/runtime/index.js','packages/runtime/packet-ordering.js',
 'packages/worldview/index.js','packages/worldview/affinities.js','packages/research/handoff.js',
 'packages/localization/index.js'];
const rows=async(dir,name)=>(await readFile(path.join(dir,name),'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
const ndjson=values=>values.map(value=>JSON.stringify(value)).join('\n')+(values.length?'\n':'');
const fingerprint=async()=>{
 const names=(await readdir(storeRoot)).filter(name=>/^[0-9a-f-]{36}\.json$/i.test(name)).sort();
 const hash=createHash('sha256'),counts={active:0,withdrawn:0},contributionByAdministration=new Map();
 for(const name of names){const bytes=await readFile(path.join(storeRoot,name)),record=JSON.parse(bytes);
  if(!Object.hasOwn(counts,record.status))throw Error('Unknown contribution status in private store.');
  counts[record.status]++;hash.update(name);hash.update(bytes);
  if(record.status==='active'){
   if(record.contributionId!==name.slice(0,-5)||typeof record.researchAdministrationId!=='string'||
    contributionByAdministration.has(record.researchAdministrationId))
    throw Error('Private contribution identifiers are inconsistent or duplicated.');
   contributionByAdministration.set(record.researchAdministrationId,record.contributionId);
  }}
 return {hash:hash.digest('hex'),counts,contributionByAdministration};
};
const before=await fingerprint();
const staging=await mkdtemp(path.join(os.tmpdir(),'worldview-research-stage-'));
let building=null,escrowCreated=false;
try{
 const base=path.join(staging,'base');
 const exported=spawnSync(process.execPath,[path.join(root,'scripts/export-research-package.mjs'),
  '--store',storeRoot,'--out',base,'--from',from,'--through',through],
  {cwd:root,encoding:'utf8',maxBuffer:1024*1024*16});
 if(exported.status!==0)throw Error('Base export failed: '+exported.stderr.trim());
 const [baseManifest,versions,sourceRespondents,sourceAdministrations,sourceResponses,items,bank,model,
  registry,scalesDoc,catalog,pilot]=await Promise.all([
  readJson(path.join(base,'manifest.json')),readJson(path.join(base,'versions.json')),
  rows(base,'respondents.ndjson'),rows(base,'administrations.ndjson'),rows(base,'responses.ndjson'),
  rows(base,'items.ndjson'),readJson(path.join(base,'item-bank.json')),readJson(path.join(base,'interpretation-model.json')),
  readJson(path.join(base,'construct-registry.json')),readJson(path.join(base,'response-scales.json')),
  readJson(path.join(base,'affinity-catalog.json')),readJson(path.join(base,'pilot-manifest.json'))]);
 for(const file of baseManifest.files)assert.equal(digest(await readFile(path.join(base,file.path))),file.sha256,'Base export hash mismatch.');
 const knownIds=new Set(sourceAdministrations.map(a=>a.researchAdministrationId));
 const excluded=exclusionsPath?await readJson(path.resolve(exclusionsPath)):[];
 if(exclusionsPath){const privateFile=await stat(path.resolve(exclusionsPath));
  if(process.platform!=='win32'&&(privateFile.mode&0o077))throw Error('Reviewed exclusion list must be private.');}
 const withinWindow=new Set(sourceAdministrations.filter(a=>a.contributedDate>=from&&a.contributedDate<=through)
  .map(a=>a.researchAdministrationId));
 if(!Array.isArray(excluded)||excluded.some(e=>!e||!knownIds.has(e.researchAdministrationId)||
  !withinWindow.has(e.researchAdministrationId)||
  !['known_test','known_automation','known_incident','known_duplicate'].includes(e.reason))||
  new Set(excluded.map(e=>e.researchAdministrationId)).size!==excluded.length)
  throw Error('Invalid private exclusion list; each entry needs a known administration and reviewed reason.');
 const excludedIds=new Set(excluded.map(e=>e.researchAdministrationId));
 const administrations=sourceAdministrations.filter(a=>a.contributedDate>=from&&a.contributedDate<=through&&!excludedIds.has(a.researchAdministrationId));
 const selectedIds=new Set(administrations.map(a=>a.researchAdministrationId));
 const respondents=sourceRespondents.filter(r=>administrations.some(a=>a.researchRespondentId===r.researchRespondentId));
 const responses=sourceResponses.filter(r=>selectedIds.has(r.researchAdministrationId));
 const rekeyed=rekeyResearchRows({respondents,administrations,responses});
 const releaseMappings=administrations.map((administration,index)=>({
  contributionId:before.contributionByAdministration.get(administration.researchAdministrationId),
  releasedResearchAdministrationId:rekeyed.administrations[index]?.researchAdministrationId}));
 if(releaseMappings.some(mapping=>!mapping.contributionId||!mapping.releasedResearchAdministrationId)||
  new Set(releaseMappings.map(mapping=>mapping.releasedResearchAdministrationId)).size!==releaseMappings.length)
  throw Error('Cannot link each released administration to exactly one private contribution.');
 const localized=baseManifest.files.filter(file=>file.path.startsWith('localization-bundle-'));
 const bundles=await Promise.all(localized.map(file=>readJson(path.join(base,file.path))));
 const codebook=buildItemCodebook({items,bank,model,registry,localizationBundles:bundles,scalesDoc});
 const claimIndex=buildAuthoredClaimIndex({model,catalog,items});
 const authored=replayAuthoredRows({...rekeyed,bank,model,scalesDoc,catalog,pilot});
 const qualityFlags=buildQualityFlags(rekeyed);
 const diagnostic=diagnoseResearchRows({...rekeyed,items,model,consentAudit:before.counts});
 const readiness=assessResearchReadiness(diagnostic);
 const exclusionCounts={outside_contribution_window:before.counts.active-sourceAdministrations.length};
 for(const entry of excluded)exclusionCounts[entry.reason]=(exclusionCounts[entry.reason]??0)+1;
 const engineSources=await Promise.all(enginePaths.map(async sourcePath=>({
  sourcePath,packagePath:'engine/'+sourcePath.slice('packages/'.length),
  sha256:digest(await readFile(path.join(root,sourcePath)))})));
 const releases=await Promise.all(baseManifest.files.filter(file=>file.path.startsWith('model-release-')&&file.path.endsWith('.json'))
  .map(file=>readJson(path.join(base,file.path))));
 const archiveManifests=new Map(await Promise.all(releases.map(async release=>{
  const component=release.components.find(row=>row.key==='engine_source');
  if(!component)return [release.releaseVersion,null];
  if(path.isAbsolute(component.path)||component.path.split('/').includes('..'))
   throw Error('Unsafe engine-source manifest path.');
  const bytes=await readFile(path.join(root,component.path));
  assert.equal(digest(bytes),component.sha256,'Historical engine-source manifest changed.');
  return [release.releaseVersion,JSON.parse(bytes)];
 })));
 const historicalSourceEquality=historicalEngineEquality({administrations:rekeyed.administrations,
  engineSources,releases,archiveManifests});
 const snapshot={schemaVersion:'research-snapshot-1.3.0',snapshotId,extractedAt:new Date().toISOString(),
  extractionLogicVersion:'research-snapshot-extractor-1.3.3',supersedes:supersedes??null,
  correctionNote:correctionNote??null,
  contributionDateWindow:{from,through},sourcePackageSchemaVersion:versions.datasetSchemaVersion,
  consentRule:'Active, explicitly affirmed research-consent-1.0.0 contribution at quiesced extraction; withdrawn tombstones excluded.',
  includedAdministrationCount:rekeyed.administrations.length,excludedCounts:exclusionCounts,
  sourceStatusCounts:before.counts,excludedKnownTestRecords:excluded.filter(e=>e.reason==='known_test').length,
  botAndIncidentReview:'Only records listed in the private reviewed exclusion file are excluded; absence of a list is not proof of no bots or incidents.',
  includedRoutes:[...new Set(rekeyed.administrations.map(a=>a.instrumentVersion+' / '+a.formPolicyVersion))].sort(),
  includedModelVersions:[...new Set(rekeyed.administrations.map(a=>a.modelVersion))].sort(),
  includedLocalizationVersions:[...new Set(rekeyed.administrations.map(a=>a.localizationBundleVersion).filter(Boolean))].sort(),
  includedItemRevisions:items.map(i=>({itemId:i.itemId,itemRevision:i.itemRevision})),
  engineReplay:{engineVersion:model.engineVersion,capturedAt:'extraction',sources:engineSources,
   historicalSourceEquality,
   scope:historicalSourceEquality==='pinned_inference_modules_match_extraction'
    ?'The packaged replay inference modules match the engine archives pinned by all included administrations; research curation code is extraction-time code.'
    :'Replays authored states from released rows with extraction-time source; exact historical production inference code identity is not established for every included administration.'},
  access:'restricted_by_default',observedAndAuthoredLayers:'responses.ndjson is observed; derived.ndjson is authored replay only.',
  corrections:'Never edit this directory in place; issue a new snapshot ID and document the correction.'};
 const buildingPath=outRoot+'.building-'+process.pid;await mkdir(buildingPath,{mode:0o700});building=buildingPath;
 const written=[];
 const put=async(name,value)=>{const bytes=Buffer.isBuffer(value)?value:Buffer.from(typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');
  await writeFile(path.join(building,name),bytes,{flag:'wx',mode:0o600});written.push({path:name,sha256:digest(bytes),bytes:bytes.length});};
 await put('respondents.ndjson',ndjson(rekeyed.respondents));
 await put('administrations.ndjson',ndjson(rekeyed.administrations));
 await put('responses.ndjson',ndjson(rekeyed.responses));
 await put('derived.ndjson',ndjson(authored));
 await put('quality-flags.ndjson',ndjson(qualityFlags));
 await put('item-codebook.ndjson',ndjson(codebook));
 await put('authored-claim-index.json',claimIndex);
 await put('snapshot.json',snapshot);await put('diagnostics.json',diagnostic);await put('readiness.json',readiness);
 for(const file of baseManifest.files){
  if(['respondents.ndjson','administrations.ndjson','responses.ndjson'].includes(file.path))continue;
  await put(file.path,await readFile(path.join(base,file.path)));
 }
 const copiedComponents=new Set();
 for(const file of baseManifest.files.filter(f=>f.path.startsWith('model-release-')&&f.path.endsWith('.json'))){
  const release=await readJson(path.join(base,file.path));
  for(const component of release.components){
   if(copiedComponents.has(component.path))continue;
   if(path.isAbsolute(component.path)||component.path.split('/').includes('..'))throw Error('Unsafe model component path.');
   const bytes=await readFile(path.join(root,component.path));
   assert.equal(digest(bytes),component.sha256,'Historical model component changed: '+component.path);
   const target='model-components/'+component.path;
   await mkdir(path.dirname(path.join(building,target)),{recursive:true,mode:0o700});
   await put(target,bytes);copiedComponents.add(component.path);
   if(component.key==='engine_source'){
    const engine=JSON.parse(bytes);
    assert.equal(engine.engineSourceVersion,component.version);
    for(const source of engine.files){
     if(path.isAbsolute(source.archivePath)||source.archivePath.split('/').includes('..'))
      throw Error('Unsafe archived engine path.');
     const sourceBytes=await readFile(path.join(root,source.archivePath));
     assert.equal(digest(sourceBytes),source.sha256,'Historical engine source changed: '+source.archivePath);
     if(copiedComponents.has(source.archivePath))continue;
     const sourceTarget='model-components/'+source.archivePath;
     await mkdir(path.dirname(path.join(building,sourceTarget)),{recursive:true,mode:0o700});
     await put(sourceTarget,sourceBytes);copiedComponents.add(source.archivePath);
    }
   }
  }
 }
 for(const [fromFile,toFile] of [
  ['research/RESEARCHER_README.md','README.md'],['research/ANALYSIS_POSSIBILITIES.md','ANALYSIS.md'],
  ['research/ANALYSIS_WARNINGS.md','WARNINGS.md'],['research/SNAPSHOT_DICTIONARY.md','snapshot-dictionary.md'],
  ['research/load_snapshot.py','load_snapshot.py'],['research/load_snapshot.R','load_snapshot.R'],
  ['research/verify_snapshot.mjs','verify_snapshot.mjs'],['research/package.json','package.json'],
  ['packages/runtime/index.js','engine/runtime/index.js'],['packages/runtime/packet-ordering.js','engine/runtime/packet-ordering.js'],
  ['packages/worldview/index.js','engine/worldview/index.js'],['packages/worldview/affinities.js','engine/worldview/affinities.js'],
  ['packages/research/handoff.js','engine/research/handoff.js'],
  ['packages/localization/index.js','engine/localization/index.js']]){
   const target=path.join(building,toFile);await mkdir(path.dirname(target),{recursive:true,mode:0o700});
   await put(toFile,await readFile(path.join(root,fromFile)));
  }
 await put('manifest.json',{schemaVersion:'research-snapshot-manifest-1',snapshotId,files:written,
  citation:`Worldview Sorter research snapshot ${snapshotId}, research-snapshot-1.3.0, extracted ${snapshot.extractedAt.slice(0,10)}.`,
  note:'No DOI assigned. Hash this manifest when depositing the unchanged package.'});
 const verified=spawnSync(process.execPath,[path.join(building,'verify_snapshot.mjs'),building],
  {cwd:building,encoding:'utf8',maxBuffer:1024*1024*16});
 if(verified.status!==0)throw Error('Snapshot integrity verification failed: '+verified.stderr.trim());
 if((await fingerprint()).hash!==before.hash)throw Error('Contribution store changed during extraction; quiesce it and retry.');
 try{await access(outRoot);throw Error('Snapshot output appeared during extraction; refusing to overwrite it.');}
 catch(error){if(error.code!=='ENOENT')throw error;}
 const escrowTemp=path.join(storeRoot,'.release-linkage-'+snapshotId+'.creating-'+randomUUID());
 try{
  const privateLinkage={schemaVersion:'research-release-linkage-1',snapshotId,
   snapshotManifestSha256:digest(await readFile(path.join(building,'manifest.json'))),
   createdAt:new Date().toISOString(),mappings:releaseMappings};
  const handle=await open(escrowTemp,'wx',0o600);
  try{await handle.writeFile(JSON.stringify(privateLinkage,null,2)+'\n');await handle.sync();}
  finally{await handle.close();}
  await link(escrowTemp,escrowPath);escrowCreated=true;
 }finally{await rm(escrowTemp,{force:true});}
 await rename(building,outRoot);building=null;
 if((await fingerprint()).hash!==before.hash){await rm(outRoot,{recursive:true,force:true});
  throw Error('Contribution store changed during publication; snapshot was not released.');}
 escrowCreated=false;
 console.log(JSON.stringify({snapshotId,output:outRoot,administrations:rekeyed.administrations.length,
  respondentPseudonyms:rekeyed.respondents.length,responses:rekeyed.responses.length,
  verification:JSON.parse(verified.stdout)}));
}finally{if(escrowCreated)await unlink(escrowPath);if(building)await rm(building,{recursive:true,force:true});await rm(staging,{recursive:true,force:true});}
