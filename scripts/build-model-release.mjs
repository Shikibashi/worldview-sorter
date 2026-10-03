import assert from 'node:assert/strict';
import {access,mkdir,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {releaseNotes,semanticDiff,validateProposal,validateReleaseTransition} from '../packages/governance/index.js';
import {captureRelease,currentFromManifest,loadSnapshot,readJson,validateContentIntegrity} from '../packages/governance/release.js';
import {verifyEngineSource} from '../packages/governance/engine-source.js';
import {StagedWrites} from '../packages/governance/successor.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2),flag=name=>args.includes(name)?args[args.indexOf(name)+1]:null;
const current=await readJson(root,'data/current.json');
validateContentIntegrity(await loadSnapshot(root,current));
const write=async(relative,value)=>{await mkdir(path.dirname(path.join(root,relative)),{recursive:true});
 return writeFile(path.join(root,relative),JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
if(args.includes('--bootstrap')){
 assert.equal(current.modelRelease,undefined,'Model release already exists.');
 const version='model-release-1.0.0',relative='data/releases/model-release-v1.json';
 const manifest=await captureRelease(root,current,version);
 await write(relative,manifest);
 current.modelRelease={version,path:relative};
 current.modelReleaseVersions=[current.modelRelease];
 await writeFile(path.join(root,'data/current.json'),JSON.stringify(current,null,2)+'\n');
 await write('data/releases/current.json',{schemaVersion:'model-release-index-1',current:current.modelRelease,
  versions:current.modelReleaseVersions});
 console.log('Pinned existing operational pilot as '+version+'; this records prior review artifacts, not a new approval.');
}else if(flag('--new-version')){
 const version=flag('--new-version'),relative=flag('--out');
 if(!relative||!/^data\/releases\/model-release-v[0-9.]+\.json$/.test(relative))
  throw Error('Specify a new versioned data/releases/model-release-v*.json output.');
 if(current.modelRelease?.version===version){
  // Re-running a finished release verifies reproducibility instead of colliding with its own output.
  assert.equal(current.modelRelease.path,relative,'Release '+version+' is already active at '+current.modelRelease.path+', not '+relative+'.');
  assert.deepEqual(await captureRelease(root,current,version),await readJson(root,relative),
   'Release '+version+' is not reproducible from the committed component pointers.');
  console.log(version+' is already built and reproducible from the committed tree; no files changed.');
  process.exit(0);
 }
 const previous=await readJson(root,current.modelRelease.path),oldCurrent=currentFromManifest(previous);
 assert.deepEqual(await captureRelease(root,oldCurrent,previous.releaseVersion),previous,
  'Historical model release has changed in place.');
 if(current.engineSource)await verifyEngineSource(root,current.engineSource,{checkLive:true});
 const next=await captureRelease(root,current,version);
 const changes=semanticDiff(await loadSnapshot(root,oldCurrent),await loadSnapshot(root,current));
 const beforeEngine=previous.components.find(c=>c.key==='engine_source');
 const afterEngine=next.components.find(c=>c.key==='engine_source');
 if(afterEngine&&(!beforeEngine||beforeEngine.sha256!==afterEngine.sha256))changes.push({
  objectType:'result_semantics',id:'engine-source',component:'engine_source',
  kind:beforeEngine?'modified':'added',changedFields:['engine_source'],risk:'meaning_sensitive'});
 const proposalDir=path.join(root,'data/governance/proposals');
 const proposalFiles=await readdir(proposalDir).catch(error=>{if(error.code==='ENOENT')return [];throw error;});
 const proposals=await Promise.all(proposalFiles.filter(name=>name.endsWith('.json'))
  .map(name=>readJson(root,'data/governance/proposals/'+name)));
 proposals.forEach(validateProposal);
 const nextSnapshot=await loadSnapshot(root,current);
 const sourceIds=new Set([...nextSnapshot.sources.sources,...nextSnapshot.sourceLedger.sources,
  ...nextSnapshot.model.sources,...nextSnapshot.affinity.sources].map(s=>s.id));
 for(const proposal of proposals.filter(p=>['approved','released'].includes(p.status))){
  for(const claim of proposal.sourceClaims)assert.ok(sourceIds.has(claim.sourceId),proposal.proposalId+' cites missing source '+claim.sourceId);
  for(const testPath of proposal.tests.paths){assert.ok(!path.isAbsolute(testPath)&&!testPath.split('/').includes('..'),'Unsafe test path');
   await access(path.join(root,testPath));}
 }
 const review=validateReleaseTransition({previousManifest:previous,nextManifest:next,changes,proposals,nextSnapshot});
 assert.ok(changes.length,'No governed content changed; no new model release is needed.');
 current.modelRelease={version,path:relative};
 current.modelReleaseVersions=[...(current.modelReleaseVersions??[]),current.modelRelease];
 const staged=new StagedWrites(root);
 staged.create(relative,next);
 staged.replace('data/current.json',current);
 staged.replace('data/releases/current.json',{schemaVersion:'model-release-index-1',
  current:current.modelRelease,versions:current.modelReleaseVersions});
 await staged.commit();
 console.log(JSON.stringify({releaseVersion:version,review,notes:releaseNotes(changes)},null,2));
}else throw Error('Use --bootstrap once or --new-version VERSION --out NEW_FILE with approved proposals.');
