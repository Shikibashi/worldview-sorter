import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {orderSelectedItems} from '../packages/runtime/packet-ordering.js';
import {generatePilotPacket} from '../packages/runtime/index.js';
import {generatePilotPacket as legacyGenerate} from '../packages/runtime/legacy-v0.8.js';
const root=new URL('../',import.meta.url);
const text=p=>readFile(new URL(p,root),'utf8');
const read=async p=>JSON.parse(await text(p));
const current=await read('data/current.json');
const bank=await read(current.candidateBank.path), pilot=await read(current.pilot.path);
assert.equal(pilot.administration.packetOrdering,'constraint-search-v1');
const make=(id,domainId,deps=[])=>({id,domainId,eligibility:deps.length?{mode:'conditional',all:deps.map(itemId=>({itemId}))}:{mode:'always'}});
function check(items,ids,limit=2) {
  assert.equal(ids.length,items.length); assert.equal(new Set(ids).size,items.length);
  const map=new Map(items.map(i=>[i.id,i])); let last=null,run=0; const done=new Set();
  for(const id of ids) {
    const item=map.get(id); assert.ok(item);
    run=item.domainId===last?run+1:1; last=item.domainId; assert.ok(run<=limit,'Hard domain-run constraint');
    for(const dependency of item.eligibility.all??[]) assert.ok(done.has(dependency.itemId),'Prerequisite order');
    done.add(id);
  }
}
for(let seed=0;seed<500;seed++) {
  const sizes=[10,16,7,17,12,8,6,11,9,6,12,26];
  const items=sizes.flatMap((n,d)=>Array.from({length:n},(_,j)=>make('I'+d+'_'+j,'D'+d)));
  for(let j=1;j<9;j++) items.find(i=>i.id==='I8_'+j).eligibility={mode:'conditional',all:[{itemId:'I8_0'}]};
  const ids=orderSelectedItems({items,seed}); check(items,ids);
  assert.deepEqual(ids,orderSelectedItems({items,seed}));
}
assert.throws(()=>orderSelectedItems({items:[make('a','X'),make('b','X'),make('c','X')],seed:0}),/No packet order/);
assert.throws(()=>orderSelectedItems({items:[make('a','X',['b']),make('b','Y',['a'])],seed:0}),/cycle/);
assert.throws(()=>orderSelectedItems({items:[make('a','X',['missing'])],seed:0}),/Missing/);
assert.throws(()=>orderSelectedItems({items:[make('a','X'),make('a','X')],seed:0}),/Duplicate/);
assert.throws(()=>orderSelectedItems({items:[make('a','X')],seed:0,maxSameDomainConsecutive:0}),/positive integer/);
const byId=new Map(bank.items.map(i=>[i.id,i]));
const bankCounts=new Map();
for(const i of bank.items) bankCounts.set(i.domainId,(bankCounts.get(i.domainId)??0)+1);
let packets=0;
for(const size of [80,120,160]) for(let n=0;n<400;n++) {
  const args={bank,pilot,seed:'academic-parity-'+size+'-'+n,size};
  const packet=generatePilotPacket(args);
  check(packet.entries.map(e=>byId.get(e.itemId)),packet.entries.map(e=>e.itemId));
  assert.deepEqual(packet,generatePilotPacket(args));
  const counts=new Map();
  for(const e of packet.entries) counts.set(e.domainId,(counts.get(e.domainId)??0)+1);
  for(const [domain,pool] of bankCounts) assert.ok(Math.abs((counts.get(domain)??0)-size*pool/bank.items.length)<=1.1,'Domain allocation preserved');
  packets++;
}
const oldBank=await read('data/items/candidate-v0.8.json'), oldPilot=await read('data/pilots/pilot-0.1.json');
const legacySource=await text('packages/runtime/legacy-v0.8.js');
const gitHash=createHash('sha1').update('blob '+Buffer.byteLength(legacySource)+'\0').update(legacySource).digest('hex');
assert.equal(gitHash,'a9203c1dffd253e64977cb08c4db9cd253f394e1','Historical runtime archive must be exact');
for(const size of [80,120,160]) for(let n=0;n<20;n++) {
  const args={bank:oldBank,pilot:oldPilot,seed:'legacy-replay-'+size+'-'+n,size};
  assert.deepEqual(generatePilotPacket(args),legacyGenerate(args),'Historical packets remain exactly reproducible');
}
const supplement=await read(current.academicSupplement.path);
assert.equal(supplement.measurementClaim,'explicit_reported_endorsement_not_implicit_commitment');
assert.ok(supplement.sources.some(s=>s.id==='acad-yang-2026'));
console.log('Academic ordering tests passed: '+packets+' new packets, 500 synthetic ordering cases, 60 exact historical replays; no silent constraint relaxation.');
