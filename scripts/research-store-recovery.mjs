import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {access,chmod,lstat,mkdir,readFile,readdir,realpath,rename,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const [mode,sourceFlag,sourceArg,outFlag,outArg]=process.argv.slice(2);
if(!['backup','restore'].includes(mode)||sourceFlag!==(mode==='backup'?'--store':'--backup')||outFlag!=='--out'||!sourceArg||!outArg||process.argv.length!==7)
 throw Error('Usage: research-store-recovery.mjs backup --store PRIVATE_DIR --out NEW_BACKUP_DIR | restore --backup BACKUP_DIR --out NEW_STORE_DIR');
const source=path.resolve(sourceArg),output=path.resolve(outArg);
const inside=(p,dir)=>p===dir||p.startsWith(dir+path.sep);
const sourceReal=await realpath(source),outputParent=await realpath(path.dirname(output)),repoReal=await realpath(repoRoot);
if(inside(output,repoRoot)||inside(outputParent,repoReal))throw Error('Backup and restore output must be outside the repository.');
if(inside(output,source)||inside(outputParent,sourceReal))throw Error('Output must be separate from the source.');
try{await access(output);throw Error('Output directory already exists.');}catch(error){if(error.code!=='ENOENT')throw error;}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const recordName=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.json$/i;
const linkageName=/^release-linkage-wvs-research-[a-z0-9][a-z0-9.-]*-v[1-9][0-9]*\.json$/;
const allowedName=name=>recordName.test(name)||linkageName.test(name)||name==='export-audit.ndjson';
const names=(await readdir(source)).sort();
if(mode==='restore'&&!(await lstat(path.join(source,'backup-manifest.json'))).isFile())throw Error('Backup manifest must be a regular file.');
const expected=mode==='restore'?JSON.parse(await readFile(path.join(source,'backup-manifest.json'),'utf8')):null;
if(mode==='restore'){
 assert.equal(expected.schemaVersion,'research-store-backup-1.0.0');
 assert.deepEqual(names.filter(name=>name!=='backup-manifest.json'),expected.files.map(file=>file.path).sort());
}
const copyNames=names.filter(name=>name!=='backup-manifest.json');
for(const name of copyNames)if(!allowedName(name)||!(await lstat(path.join(source,name))).isFile())throw Error('Unexpected source entry: '+name);
const temp=output+'.building-'+randomUUID();await mkdir(temp,{mode:0o700});
const files=[];let active=0,withdrawn=0;
try{
for(const name of copyNames){
 const bytes=await readFile(path.join(source,name)),digest=hash(bytes);
 if(expected){const old=expected.files.find(file=>file.path===name);assert.equal(digest,old.sha256,'Backup hash mismatch: '+name);assert.equal(bytes.length,old.bytes);}
 if(recordName.test(name)){const record=JSON.parse(bytes);
  assert.ok(['active','withdrawn'].includes(record.status),'Unexpected record state.');
  if(record.status==='active')active++;else withdrawn++;
 }
 if(linkageName.test(name)){
  const linkage=JSON.parse(bytes),snapshotId=name.slice('release-linkage-'.length,-'.json'.length);
  assert.equal(linkage.schemaVersion,'research-release-linkage-1');assert.equal(linkage.snapshotId,snapshotId);
  assert.match(linkage.snapshotManifestSha256,/^[0-9a-f]{64}$/);
  assert.ok(Array.isArray(linkage.mappings));
  assert.equal(new Set(linkage.mappings.map(row=>row.contributionId)).size,linkage.mappings.length);
  assert.equal(new Set(linkage.mappings.map(row=>row.releasedResearchAdministrationId)).size,linkage.mappings.length);
  for(const row of linkage.mappings){assert.ok(recordName.test(row.contributionId+'.json'));
   assert.match(row.releasedResearchAdministrationId,/^a-[0-9a-f-]{36}$/i);}
 }
 await writeFile(path.join(temp,name),bytes,{flag:'wx',mode:0o600});await chmod(path.join(temp,name),0o600);
 files.push({path:name,sha256:digest,bytes:bytes.length});
}
if(mode==='backup')await writeFile(path.join(temp,'backup-manifest.json'),JSON.stringify({schemaVersion:'research-store-backup-1.0.0',createdAt:new Date().toISOString(),active,withdrawn,files},null,2)+'\n',{flag:'wx',mode:0o600});
else{assert.equal(active,expected.active);assert.equal(withdrawn,expected.withdrawn);}
await rename(temp,output);
}catch(error){await rm(temp,{recursive:true,force:true});throw error;}
console.log(JSON.stringify({mode,output,active,withdrawn,files:files.length}));
