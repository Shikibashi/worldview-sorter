import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

// These modules determine route replay, response validity, direct and derived
// propositions, respondent summaries, and doctrinal affinity. Presentation
// code is outside this archive's stated scope.
export const ENGINE_SOURCE_PATHS=Object.freeze([
 'packages/runtime/index.js',
 'packages/runtime/packet-ordering.js',
 'packages/philosophy/forms.js',
 'packages/localization/index.js',
 'packages/beta/release.js',
 'packages/experience/quiz.js',
 'packages/experience/summary.js',
 'packages/worldview/index.js',
 'packages/worldview/affinities.js'
]);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const safe=relative=>typeof relative==='string'&&!path.isAbsolute(relative)&&
 !relative.split('/').includes('..')&&!relative.includes('\\');

export async function verifyEngineSource(root,ref,{checkLive=false}={}){
 assert.ok(ref&&/^engine-source-[0-9]+\.[0-9]+\.[0-9]+$/.test(ref.version)&&safe(ref.path),
  'Invalid engine-source release reference.');
 assert.equal(ref.path,'data/releases/engine-sources/'+ref.version+'/manifest.json',
  'Engine-source manifest must use its versioned archive path.');
 const bytes=await readFile(path.join(root,ref.path)),manifest=JSON.parse(bytes);
 assert.equal(manifest.schemaVersion,'worldview-engine-source-1');
 assert.equal(manifest.engineSourceVersion,ref.version);
 assert.equal(manifest.scope,'route_response_interpretation_affinity');
 assert.ok(Array.isArray(manifest.files));
 assert.deepEqual(manifest.files.map(x=>x.sourcePath),ENGINE_SOURCE_PATHS);
 const archiveRoot=path.posix.dirname(ref.path);
 for(const file of manifest.files){
  assert.ok(safe(file.archivePath)&&file.archivePath===archiveRoot+'/'+file.sourcePath,
   'Unsafe or relocated engine archive path.');
  assert.match(file.sha256,/^[0-9a-f]{64}$/);
  assert.equal(sha(await readFile(path.join(root,file.archivePath))),file.sha256,
   'Archived engine source changed: '+file.sourcePath);
  if(checkLive)assert.equal(sha(await readFile(path.join(root,file.sourcePath))),file.sha256,
   'Active engine code differs from pinned release: '+file.sourcePath);
 }
 return manifest;
}

export async function describeEngineSource(root,version,archiveRoot){
 assert.match(version,/^engine-source-[0-9]+\.[0-9]+\.[0-9]+$/);
 assert.ok(safe(archiveRoot)&&archiveRoot.startsWith('data/releases/engine-sources/'));
 const files=[];
 for(const sourcePath of ENGINE_SOURCE_PATHS){const bytes=await readFile(path.join(root,sourcePath));
  files.push({sourcePath,archivePath:archiveRoot+'/'+sourcePath,sha256:sha(bytes)});}
 return {schemaVersion:'worldview-engine-source-1',engineSourceVersion:version,
  scope:'route_response_interpretation_affinity',files};
}
