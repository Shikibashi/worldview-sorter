import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {evaluateWorldviewRelations,validateRelationGraph,WorldviewRelationError} from '../packages/worldview/relations.js';

const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const current=await read('data/current.json');
const model=await read(current.worldviewModel.path);
const graph=await read('data/exploration/semantic-relations-v1.json');

assert.equal(validateRelationGraph({graph,model}),true);

const state=(commitmentId,value)=>({commitmentId,state:value});
const report={
  modelVersion:model.modelVersion,
  commitments:[
    state('construct-EP15','supported'),
    state('construct-EP16','not_measured'),
    state('construct-EP19','supported'),
    state('construct-NE15','not_measured'),
    state('construct-NE17','supported'),
    state('construct-NE19','supported'),
    state('construct-NE20','supported')
  ],
  derived:[]
};
const frozen=JSON.stringify(report);
const evaluated=evaluateWorldviewRelations({graph,model,report});
assert.equal(evaluated.inferenceApplied,false);
assert.equal(JSON.stringify(report),frozen,'Semantic exploration must not mutate the interpretation report.');
assert.deepEqual(new Set(evaluated.findings.map(row=>row.id)),new Set([
  'fallibilism-contextual-certainty-compatible',
  'fallibilism-does-not-entail-pragmatic-maxim',
  'ownness-does-not-entail-ethical-egoism',
  'exit-and-reliance-repair-compatible'
]));
assert.equal(evaluated.findings.find(row=>row.id==='fallibilism-does-not-entail-pragmatic-maxim').status,
  'guard_active_conclusion_not_established');
assert.ok(evaluated.findings.every(row=>row.inferenceApplied===false));

const withIndependentConclusion=structuredClone(report);
withIndependentConclusion.commitments.find(row=>row.commitmentId==='construct-EP16').state='supported';
const independentlyObserved=evaluateWorldviewRelations({graph,model,report:withIndependentConclusion});
assert.equal(independentlyObserved.findings.find(row=>row.id==='fallibilism-does-not-entail-pragmatic-maxim').status,
  'guard_active_conclusion_independently_observed');

const noCompatibility=structuredClone(report);
noCompatibility.commitments.find(row=>row.commitmentId==='construct-EP19').state='opposed';
assert.ok(!evaluateWorldviewRelations({graph,model,report:noCompatibility}).findings
  .some(row=>row.id==='fallibilism-contextual-certainty-compatible'));

const unknown=structuredClone(graph);
unknown.relations[0].members[0].propositionId='missing-proposition';
assert.throws(()=>validateRelationGraph({graph:unknown,model}),WorldviewRelationError);

const missingClaim=structuredClone(graph);
missingClaim.relations[0].sourceClaims=[];
assert.throws(()=>validateRelationGraph({graph:missingClaim,model}),WorldviewRelationError);

const tinyModel={
  modelVersion:'tiny',
  sources:[{id:'source'}],
  commitments:[{id:'a'},{id:'b'}],
  derivedRules:[]
};
const grounding={
  schemaVersion:'1.0.0',graphVersion:'tiny-1',modelVersion:'tiny',inferenceAllowed:false,
  relations:[{
    id:'a-grounds-b',type:'grounding',presentation:'explanatory_grounding',inferenceAllowed:false,
    premises:[{propositionId:'a',state:'supported'}],
    conclusion:{propositionId:'b',state:'supported'},
    explanation:'Synthetic grounding relation used only to test the no-inference contract.',
    sourceClaims:[{sourceId:'source',relationship:'supports_relation',claim:'Synthetic test source claim.'}]
  }]
};
const tinyReport={modelVersion:'tiny',commitments:[state('a','supported'),state('b','not_measured')],derived:[]};
const groundingResult=evaluateWorldviewRelations({graph:grounding,model:tinyModel,report:tinyReport});
assert.equal(groundingResult.findings[0].status,'grounding_context_only');
assert.equal(groundingResult.findings[0].conclusionObservation.observedState,'not_measured');
assert.equal(groundingResult.inferenceApplied,false);

const cycle=structuredClone(grounding);
cycle.relations.push({
  id:'b-grounds-a',type:'grounding',presentation:'explanatory_grounding',inferenceAllowed:false,
  premises:[{propositionId:'b',state:'supported'}],
  conclusion:{propositionId:'a',state:'supported'},
  explanation:'Synthetic cycle.',
  sourceClaims:[{sourceId:'source',relationship:'supports_relation',claim:'Synthetic test source claim.'}]
});
assert.throws(()=>validateRelationGraph({graph:cycle,model:tinyModel}),/acyclic/);

console.log('Semantic relations: provenance, no-inference boundary, guards, compatibility, and grounding DAG checks passed.');
