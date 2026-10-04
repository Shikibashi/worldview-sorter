import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {evaluateSemanticLinks,validateSemanticLinkSet,SemanticLinkError} from '../packages/worldview/semantic-links.js';

const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
// This immutable link set belongs to the 1.20 release, not the active successor.
const model=await read('data/generic/model-v1.17-pilot.json');
const linkSet=await read('data/exploration/semantic-links-v1.json');

assert.equal(validateSemanticLinkSet({linkSet,model}),true);

const row=(commitmentId,state)=>({commitmentId,state});
const report={modelVersion:model.modelVersion,commitments:[
  row('construct-EP15','supported'),
  row('construct-EP16','not_measured'),
  row('construct-EP19','supported'),
  row('construct-NE15','not_measured'),
  row('construct-NE17','supported'),
  row('construct-NE19','supported'),
  row('construct-NE20','supported')
],derived:[]};

const before=JSON.stringify(report);
const evaluated=evaluateSemanticLinks({linkSet,model,report});
assert.equal(JSON.stringify(report),before,'Semantic links must not mutate respondent interpretation.');
assert.equal(evaluated.interpretationChanged,false);
assert.deepEqual(new Set(evaluated.findings.map(row=>row.id)),new Set([
  'fallible-knowledge-and-contextual-certainty-can-coexist',
  'fallibilism-does-not-establish-pragmatic-clarification',
  'ownness-does-not-establish-ethical-egoism',
  'continuing-assent-and-reliance-repair-can-coexist'
]));
assert.equal(evaluated.findings.find(row=>row.id==='fallibilism-does-not-establish-pragmatic-clarification').status,
  'boundary_active_target_not_established');

const independent=structuredClone(report);
independent.commitments.find(row=>row.commitmentId==='construct-EP16').state='supported';
assert.equal(evaluateSemanticLinks({linkSet,model,report:independent}).findings
  .find(row=>row.id==='fallibilism-does-not-establish-pragmatic-clarification').status,
  'boundary_active_target_independently_observed');

const bad=structuredClone(linkSet);
bad.links[0].when[0].propositionId='not-a-proposition';
assert.throws(()=>validateSemanticLinkSet({linkSet:bad,model}),SemanticLinkError);

const tinyModel={modelVersion:'tiny',sources:[{id:'source'}],commitments:[{id:'a'},{id:'b'}],derivedRules:[]};
const explanatory={schemaVersion:'1.0.0',linkSetVersion:'tiny-1',modelVersion:'tiny',mayChangeInterpretation:false,links:[{
  id:'a-supports-b',kind:'explanatory_support',mayChangeInterpretation:false,
  when:[{propositionId:'a',state:'supported'}],target:{propositionId:'b',state:'supported'},
  explanation:'Synthetic explanatory link.',sourceClaims:[{sourceId:'source',relationship:'supports_link',claim:'Synthetic source claim.'}]
}]};
const tinyReport={modelVersion:'tiny',commitments:[row('a','supported'),row('b','not_measured')],derived:[]};
const result=evaluateSemanticLinks({linkSet:explanatory,model:tinyModel,report:tinyReport});
assert.equal(result.findings[0].status,'explanation_only');
assert.equal(result.findings[0].target.observedState,'not_measured');

const cycle=structuredClone(explanatory);
cycle.links.push({
  id:'b-supports-a',kind:'explanatory_support',mayChangeInterpretation:false,
  when:[{propositionId:'b',state:'supported'}],target:{propositionId:'a',state:'supported'},
  explanation:'Synthetic reverse edge.',sourceClaims:[{sourceId:'source',relationship:'supports_link',claim:'Synthetic source claim.'}]
});
assert.throws(()=>validateSemanticLinkSet({linkSet:cycle,model:tinyModel}),/acyclic/);

console.log('Independent semantic links: source provenance, no-inference boundary, and cycle checks passed.');
