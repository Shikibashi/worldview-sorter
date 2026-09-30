import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const serverFile=path.join(root,'apps/server/server.mjs');
const env={...process.env,NODE_ENV:'production',HOST:'127.0.0.1',PORT:'0'};
delete env.WORLDVIEW_ENABLE_RESEARCH_CONTRIBUTIONS;
delete env.WORLDVIEW_ENABLE_LEGACY_COLLECTION;
const digest=async file=>createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');
const current=JSON.parse(await readFile(path.join(root,'data/current.json'),'utf8'));
const tracked=['data/current.json',current.affinityCatalog.manifestPath,'data/research/consent-v1.json'];
const before=await Promise.all(tracked.map(digest));
const rejected=spawnSync(process.execPath,[serverFile],{cwd:root,env:{...env,WORLDVIEW_ENABLE_LEGACY_COLLECTION:'true'},encoding:'utf8',timeout:10000});
assert.notEqual(rejected.status,0,'Development collector must fail in production.');
const missingStore=spawnSync(process.execPath,[serverFile],{cwd:root,env:{...env,WORLDVIEW_ENABLE_RESEARCH_CONTRIBUTIONS:'true'},encoding:'utf8',timeout:10000});
assert.notEqual(missingStore.status,0,'Production research writes require an explicit private store.');
const child=spawn(process.execPath,[serverFile],{cwd:root,env,stdio:['ignore','pipe','pipe']});
let stdout='',stderr='';child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
child.stdout.on('data',chunk=>{stdout+=chunk;});child.stderr.on('data',chunk=>{stderr+=chunk;});
try{
 const started=await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('Production server startup timed out: '+stderr)),10000);
  const onOutput=()=>{for(const line of stdout.split('\n')){try{const event=JSON.parse(line);if(event.event==='server_started'){clearTimeout(timeout);resolve(event);return;}}catch{}}};
  child.stdout.on('data',onOutput);
  child.once('exit',code=>{clearTimeout(timeout);reject(Error('Production server exited '+code+': '+stderr));});
  onOutput();
 });
 const base='http://127.0.0.1:'+started.port;
 const health=await fetch(base+'/api/health');assert.equal(health.status,200);
 assert.equal((await health.json()).status,'ok');
 assert.equal((await fetch(base+'/api/research/config').then(r=>r.json())).enabled,false);
 assert.equal((await fetch(base+'/data/research/consent-v1.json')).status,404);
 assert.equal((await fetch(base+'/data/current.json')).status,200);
 assert.equal(started.researchContributionEnabled,false);
}finally{
 child.kill('SIGTERM');
 await new Promise(resolve=>{if(child.exitCode!==null||child.signalCode!==null)resolve();else child.once('exit',resolve);});
}
assert.deepEqual(await Promise.all(tracked.map(digest)),before,'Production startup must not rewrite pinned release files.');
console.log('Production startup, configuration boundaries, and read-only release checks passed.');
