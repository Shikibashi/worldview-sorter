import assert from 'node:assert/strict';
import {lstat,readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';

const args=process.argv.slice(2);
if(args.length!==4||args[0]!=='--store'||args[2]!=='--contribution')
 throw Error('Usage: research-withdrawal-impact.mjs --store PRIVATE_STORE --contribution UUID');
const storeRoot=path.resolve(args[1]),contributionId=args[3];
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if(!uuid.test(contributionId))throw Error('Invalid private contribution ID.');
if(process.platform!=='win32'&&((await stat(storeRoot)).mode&0o077))
 throw Error('Private contribution store must be mode 0700.');
const record=JSON.parse(await readFile(path.join(storeRoot,contributionId+'.json'),'utf8'));
if(record.contributionId!==contributionId||record.status!=='withdrawn')
 throw Error('The private contribution must have a verified withdrawal tombstone.');
const names=(await readdir(storeRoot)).filter(name=>
 /^release-linkage-wvs-research-[a-z0-9][a-z0-9.-]*-v[1-9][0-9]*\.json$/.test(name)).sort();
const affected=[];
for(const name of names){
 const file=path.join(storeRoot,name),meta=await lstat(file);
 if(!meta.isFile()||(process.platform!=='win32'&&(meta.mode&0o077)))
  throw Error('Private release linkage is not a restricted regular file: '+name);
 const linkage=JSON.parse(await readFile(file,'utf8'));
 assert.equal(linkage.schemaVersion,'research-release-linkage-1');
 assert.equal(linkage.snapshotId,name.slice('release-linkage-'.length,-'.json'.length));
 assert.match(linkage.snapshotManifestSha256,/^[0-9a-f]{64}$/);
 assert.ok(Array.isArray(linkage.mappings));
 const matches=linkage.mappings.filter(row=>row.contributionId===contributionId);
 if(matches.length>1)throw Error('Duplicate private release linkage for a contribution.');
 if(matches.length)affected.push({snapshotId:linkage.snapshotId,
  releasedResearchAdministrationId:matches[0].releasedResearchAdministrationId,
  snapshotManifestSha256:linkage.snapshotManifestSha256});
}
console.log(JSON.stringify({affected}));
