import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareWorldview} from '../packages/worldview/index.js';
import {evaluatePhilosophicalAffinities} from '../packages/worldview/affinities.js';
import {currentFromManifest,loadSnapshot,validateContentIntegrity} from '../packages/governance/release.js';

const root=new URL('../',import.meta.url),read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const current=currentFromManifest(await read('data/releases/model-release-v1.8.0.json')),
 previous=await read('data/releases/model-release-v1.7.0.json');
const old=currentFromManifest(previous);
const [bank,model,scalesDoc,depth,pilot,catalog,oldModel,oldDepth,oldCatalog,draft]=await Promise.all([
 read(current.candidateBank.path),read(current.worldviewModel.path),read(current.responseScales.path),
 read(current.progressiveDepth.path),read(current.pilotCandidate.path),read(current.affinityCatalog.path),
 read(old.worldviewModel.path),read(old.progressiveDepth.path),read(old.affinityCatalog.path),
 read('data/items/affinity-gap-draft-v1.json')]);
const ruleId='reviewed-NE23-rule-consequence-criterion';
assert.equal(validateContentIntegrity(await loadSnapshot(root.pathname,current)).items,566);
assert.equal(bank.items.length,566);
for(const id of ['NEI122','NEI123'])assert.equal(bank.items.find(item=>item.id===id).revision,1);
assert.deepEqual(bank.items.find(item=>item.id==='NEI123').options,
 draft.items.find(item=>item.id==='NEI123').options);
assert.equal(bank.items.find(item=>item.id==='NEI123').text,
 draft.items.find(item=>item.id==='NEI123').text);
assert.equal(oldModel.commitments.some(rule=>rule.id===ruleId),false);
assert.equal(oldDepth.routes.find(route=>route.id==='full').size,242);
assert.equal(oldCatalog.traditions.length,9);
assert.equal(catalog.traditions.length,9);
assert.ok(catalog.traditions.every(tradition=>tradition.commitments.every(c=>
 c.mapping.propositionId!==ruleId)),'The new criterion must not silently expand a tradition.');
const ref=itemId=>({itemId,itemRevision:bank.items.find(item=>item.id===itemId).revision});
const assigned=id=>depth.routes.find(route=>route.id===id).itemRefs;
assert.deepEqual(depth.routes.map(route=>route.size),[64,120,243]);
assert.ok(['NEI122','NEI123'].every(id=>assigned('full').some(row=>row.itemId===id)));
assert.ok(['quick','standard'].every(routeId=>['NEI122','NEI123'].every(id=>
 !assigned(routeId).some(row=>row.itemId===id))));
assert.deepEqual(assigned('full').filter(row=>row.itemId!=='NEI123'),
 oldDepth.routes.find(route=>route.id==='full').itemRefs,
 'The 242 historical Full item revisions retain their order.');
const input=(answers,routeId='full')=>({pilotId:depth.administrationId,
 bankVersion:bank.bankVersion,instrumentVersion:depth.instrumentVersion,
 presentedItems:assigned(routeId).map(row=>({...row,presented:Object.hasOwn(answers,row.itemId),skippedByBranch:false})),
 responses:Object.entries(answers).map(([itemId,value])=>({
  ...ref(itemId),state:value===null?'no_view':'answered',value}))});
const report=(answers,routeId='full')=>compareWorldview({model,bank,scalesDoc,
 input:input(answers,routeId),routeManifest:depth});
const result=(answers,routeId='full')=>report(answers,routeId).commitments.find(row=>row.commitmentId===ruleId);
assert.equal(result({NEI122:'rule_outcome',NEI123:'general_consequences'}).state,'supported');
assert.equal(result({NEI122:'rule_independent',NEI123:'person_constraint'}).state,'opposed');
assert.equal(result({NEI122:'act_outcome',NEI123:'person_constraint'}).state,'opposed');
assert.equal(result({NEI122:'act_outcome',NEI123:'general_consequences'}).state,'mixed_context_dependent');
assert.equal(result({NEI122:'rule_outcome',NEI123:'person_constraint'}).state,'mixed_context_dependent');
assert.equal(result({NEI122:'rule_outcome'}).state,'leaned_toward');
assert.equal(result({NEI123:'general_consequences'}).state,'leaned_toward');
assert.equal(result({NEI122:null,NEI123:null}).state,'insufficient_evidence');
assert.equal(result({}).state,'insufficient_evidence');
assert.equal(result({},'quick').state,'not_measured');
assert.equal(result({},'standard').state,'not_measured');
assert.equal(result({NEI123:'agreement'}).state,'insufficient_evidence',
 'Contractualist acceptance can coexist with a consequence-grounded rule.');
assert.equal(result({NEI037:2,NEI040:'rules_primary'}).state,'insufficient_evidence',
 'Generic rule guidance cannot fill the ultimate criterion.');
assert.equal(result({NEI001:2,NEI025:'strong'}).state,'insufficient_evidence',
 'Generic outcome concern cannot fill a consequence-justified rule criterion.');
const positive=report({NEI122:'rule_outcome',NEI123:'general_consequences'});
assert.equal(evaluatePhilosophicalAffinities({catalog,report:positive,model,pilot}).identity,null);
assert.equal(evaluatePhilosophicalAffinities({catalog,report:positive,model,pilot}).matchPercent,null);
assert.deepEqual(model.commitments.filter(rule=>rule.id!==ruleId).map(rule=>[rule.id,rule.evidence]),
 oldModel.commitments.map(rule=>[rule.id,rule.evidence]),'Existing evidence maps are unchanged.');
console.log('Rule-consequence release: positive, negative, mixed, missing, route omission, nearby false positives, stable affinity, and historical evidence passed.');
