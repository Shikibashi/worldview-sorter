import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const policy=await read('data/reference/authoring-policy-v1.json');

assert.equal(policy.thirdPartyProfileDatasetsAsContentSources,false);
assert.equal(policy.requiresOriginalProse,true);
assert.equal(policy.requiresIndependentCoverageSelection,true);
assert.equal(policy.publicComparison.aggregateScoreAllowed,false);
assert.equal(policy.publicComparison.identityAssignmentAllowed,false);

const forbiddenKeys=new Set([
  'vector','coordinates','axisValues','score','matchPercentage','nearestProfile',
  'externalProfileId','sourceDataset','importedProfileId'
]);
const inspect=(value,path)=>{
  if(Array.isArray(value)){value.forEach((row,index)=>inspect(row,path+'['+index+']'));return;}
  if(!value||typeof value!=='object')return;
  for(const [key,row] of Object.entries(value)){
    assert.ok(!forbiddenKeys.has(key),path+' contains forbidden imported/classifier field '+key);
    inspect(row,path+'.'+key);
  }
};

const files=(await readdir(new URL('data/reference/',root))).filter(name=>/^reference-profiles-v.*\.json$/.test(name));
assert.ok(files.length>0,'Expected at least one independently authored reference-profile catalog.');
for(const name of files){
  const catalog=await read('data/reference/'+name);
  assert.equal(catalog.origin,'independent_authoring',name+' must declare independent authoring.');
  assert.ok(Array.isArray(catalog.profiles),name+' must contain profile records.');
  for(const profile of catalog.profiles){
    assert.equal(profile.origin,'independent_authoring',profile.id+' must declare independent authoring.');
    inspect(profile,name+'#'+profile.id);
  }
  inspect(catalog.sources,name+'#sources');
}

console.log('Independent authoring policy: source boundary, no classifier fields, and profile-origin checks passed.');
