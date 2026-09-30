import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=process.argv[2];
if(!base||!/^[0-9a-f]{7,40}$/i.test(base))throw Error('Usage: node scripts/check-model-release-history.mjs BASE_COMMIT_SHA');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const oldFiles=git('ls-tree','-r','--name-only',base,'data/releases').trim().split('\n').filter(name=>
 /^data\/releases\/model-release-v[0-9.]+\.json$/.test(name));
const current=JSON.parse(await readFile(path.join(root,'data/current.json'),'utf8'));
const retained=new Set((current.modelReleaseVersions??[]).map(x=>x.version));
for(const file of oldFiles){const oldBytes=execFileSync('git',['show',base+':'+file],{cwd:root});
 const nowBytes=await readFile(path.join(root,file));
 assert.equal(sha(nowBytes),sha(oldBytes),'Historical release manifest edited: '+file);
 const manifest=JSON.parse(oldBytes);
 assert.ok(retained.has(manifest.releaseVersion),'Historical release removed from registry: '+manifest.releaseVersion);
 for(const component of manifest.components){const bytes=await readFile(path.join(root,component.path));
  assert.equal(sha(bytes),component.sha256,'Historical model artifact changed: '+component.path);
  if(component.key==='engine_source'){
   const engine=JSON.parse(bytes);
   assert.equal(engine.engineSourceVersion,component.version);
   for(const source of engine.files){
    assert.ok(!path.isAbsolute(source.archivePath)&&!source.archivePath.split('/').includes('..'));
    assert.equal(sha(await readFile(path.join(root,source.archivePath))),source.sha256,
     'Historical engine source changed: '+source.archivePath);
   }
  }}
}
console.log('Historical model releases retained:',oldFiles.length);
