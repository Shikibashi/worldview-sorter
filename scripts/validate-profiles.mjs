import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateProfileCatalog} from '../packages/profiles/matcher.js';
const root=new URL('../',import.meta.url);
const read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const current=await read('data/current.json');
const catalog=await read(current.profileCatalog.path);
const policy=await read(current.profileMatchingPolicy.path);
// The nine engineering prototypes are bound to the historical 0.9 bank.
const bank=await read('data/items/candidate-v0.9.json');
const scalesDoc=await read('data/response-scales.json');
const sourceIds=new Set((await read('data/sources.json')).sources.map(s=>s.id));
validateProfileCatalog({catalog,policy,bank,scalesDoc});
for (const p of catalog.profiles) {
  assert.ok(p.sourceIds.every(id=>sourceIds.has(id)));
  for(const c of p.criteria) assert.ok(c.sourceIds.every(id=>sourceIds.has(id)));
}
console.log('Academic profile contracts passed: '+catalog.profiles.length+' scoped reference comparisons; no identity outputs.');
