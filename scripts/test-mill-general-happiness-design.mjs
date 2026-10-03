import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateProposal} from '../packages/governance/index.js';

const root=new URL('../',import.meta.url);
const read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));

const current = await read('data/current.json');
const [model,bank,routes,referenceCurrent,proposal]=await Promise.all([
  read(current.worldviewModel.path),
  read(current.candidateBank.path),
  read(current.progressiveDepth.path),
  read('data/reference/current.json'),
  read('data/governance/proposals/MCP-2026-094.json')
]);
const catalog=await read(referenceCurrent.catalogPath);

if (current.modelRelease.version === 'model-release-1.20.0') {
  assert.equal(current.worldviewModel.version, 'generic-1.17.0-pilot');
  assert.equal(current.candidateBank.version, '0.20.0');
  assert.equal(current.progressiveDepth.version, 'progressive-depth-2.8.0');
} else {
  assert.equal(current.modelRelease.version, 'model-release-1.19.0');
  assert.equal(current.worldviewModel.version, 'generic-1.16.0-pilot');
  assert.equal(current.candidateBank.version, '0.19.0');
  assert.equal(current.progressiveDepth.version, 'progressive-depth-2.7.0');
}
assert.ok(['reference-profile-catalog-1.2.0', 'reference-profile-catalog-1.3.0'].includes(referenceCurrent.catalogVersion));

assert.equal(validateProposal(proposal),proposal);
const proposedRule='reviewed-NE26-general-happiness-ultimate-standard';
if (current.modelRelease.version === 'model-release-1.20.0') {
  assert.equal(proposal.status, 'approved');
  assert.ok(model.commitments.some(row => row.id === proposedRule),
    'Model release 1.20.0 activates NE26 after release gate is satisfied.');
  assert.ok(bank.items.some(row => row.id === 'NEI134') && bank.items.some(row => row.id === 'NEI135'),
    'Active bank 0.20.0 contains NEI134 and NEI135.');
} else {
  assert.equal(proposal.status, 'under_review');
  assert.ok(!model.commitments.some(row=>row.id===proposedRule),
    'The design must not silently activate NE26 before its release gate is satisfied.');
  assert.ok(!bank.items.some(row=>row.id==='NEI134'||row.id==='NEI135'),
    'Proposed evidence units must remain absent from the active 0.19.0 bank.');
  assert.ok(!model.commitments.some(row=>row.constructId==='NE26'),
    'No active proposition may claim the reserved NE26 construct before release.');
}

for(const id of [
  'reviewed-NE22-act-consequence-criterion',
  'reviewed-NE23-rule-consequence-criterion',
  'reviewed-NE24-welfarist-outcome-value',
  'reviewed-NE25-total-welfare-maximization'
]) assert.ok(model.commitments.some(row=>row.id===id),'Missing neighboring proposition '+id);

if (referenceCurrent.catalogVersion === 'reference-profile-catalog-1.2.0') {
  assert.ok(!catalog.profiles.some(row=>/mill/i.test(row.id)||/john stuart mill/i.test(row.label)),
    'Mill must remain unprofiled while NE26 is only a design.');
} else {
  assert.ok(catalog.profiles.some(row=>row.id === 'john-stuart-mill-general-happiness-scoped'),
    'Mill scoped profile is present in catalog 1.3.0 after NE26 canary activation.');
}

for(const route of routes.routes){
  if (route.id === 'full' && current.modelRelease.version === 'model-release-1.20.0') {
    assert.equal(route.size, 251);
    assert.ok(route.itemRefs.some(ref=>ref.itemId==='NEI134'||ref.itemId==='NEI135'));
  } else {
    assert.ok(!route.itemRefs.some(ref=>ref.itemId==='NEI134'||ref.itemId==='NEI135'),
      'No current route may administer proposed NE26 evidence.');
  }
}

const required=new Set(proposal.tests.required);
for(const name of [
  'positive','negative','mixed','missing','false_positive_neighbor','historical',
  'single_item_lean','route_omission','neighbor_non_substitution',
  'act_rule_neutrality','source_claim_trace','reference_profile_gate'
]) assert.ok(required.has(name),'Missing governed future regression: '+name);

const neighbors=proposal.philosophicalBasis.neighboringViews.join(' ').toLowerCase();
for(const phrase of ['act consequentialism','rule consequentialism','welfarist','pluralist'])
  assert.ok(neighbors.includes(phrase),'Design omits required neighboring view '+phrase);

const nonEntailments=proposal.philosophicalBasis.nonEntailments.join(' ').toLowerCase();
assert.ok(nonEntailments.includes('act-utilitarian'));
assert.ok(nonEntailments.includes('rule-utilitarian'));
assert.ok(nonEntailments.includes('total-welfare'));
assert.ok(nonEntailments.includes('complete mill profile'));

console.log('Mill general-happiness design: current gap preserved, neighbor boundaries pinned, and future qualification regressions governed.');
