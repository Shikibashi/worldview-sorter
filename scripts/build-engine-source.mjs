import assert from 'node:assert/strict';
import {copyFile,mkdir,mkdtemp,rename,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describeEngineSource,ENGINE_SOURCE_PATHS,verifyEngineSource} from '../packages/governance/engine-source.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2);
assert.ok(args.length===2&&args[0]==='--version'&&/^engine-source-[0-9]+\.[0-9]+\.[0-9]+$/.test(args[1]),
 'Usage: node scripts/build-engine-source.mjs --version engine-source-X.Y.Z');
const version=args[1],relative='data/releases/engine-sources/'+version;
const parent=path.join(root,'data/releases/engine-sources');
await mkdir(parent,{recursive:true});
const staging=await mkdtemp(path.join(parent,'.building-'));
let published=false,created=false;
try{
 for(const source of ENGINE_SOURCE_PATHS){
  const target=path.join(staging,source);
  await mkdir(path.dirname(target),{recursive:true});
  await copyFile(path.join(root,source),target);
 }
 const manifest=await describeEngineSource(root,version,relative);
 await writeFile(path.join(staging,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 await rename(staging,path.join(parent,version));
 created=true;
 await verifyEngineSource(root,{version,path:relative+'/manifest.json'},{checkLive:true});
 published=true;
 console.log(JSON.stringify({version,path:relative+'/manifest.json',files:manifest.files.length,
  nextStep:'Review as result_semantics:engine-source in a model-change proposal, then pin in a new model release.'}));
}finally{if(!published){await rm(staging,{recursive:true,force:true});
 if(created)await rm(path.join(parent,version),{recursive:true,force:true});}}
