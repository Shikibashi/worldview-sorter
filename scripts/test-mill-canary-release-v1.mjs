// Regressions for model-release-1.20.0 canary: Mill general happiness ultimate standard (NE26).
// Verifies exact proposition, two-unit polarity, mixed, missing, route isolation, and non-entailments.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = async file => JSON.parse(await readFile(fileURLToPath(new URL(file, import.meta.url)), 'utf8'));

const current = await read('../data/current.json');
assert.ok(['model-release-1.20.0', 'model-release-1.21.0'].includes(current.modelRelease.version), 'Active release must be at least 1.20.0');

const bank = await read('../' + current.candidateBank.path);
const model = await read('../' + current.worldviewModel.path);
const routes = await read('../' + current.progressiveDepth.path);
const proposal = await read('../data/governance/proposals/MCP-2026-094.json');

// 1. Bank items NEI134 and NEI135
const item134 = bank.items.find(i => i.id === 'NEI134');
const item135 = bank.items.find(i => i.id === 'NEI135');
assert.ok(item134 && item134.revision === 1, 'NEI134@1 must exist in bank');
assert.ok(item135 && item135.revision === 1, 'NEI135@1 must exist in bank');
assert.equal(item134.targets[0].constructId, 'NE26');
assert.equal(item135.targets[0].constructId, 'NE26');
assert.ok(bank.items.length >= 577, 'Bank must have at least 577 items');

// 2. Model rule reviewed-NE26-general-happiness-ultimate-standard
const ruleId = 'reviewed-NE26-general-happiness-ultimate-standard';
const rule = model.commitments.find(r => r.id === ruleId);
assert.ok(rule, 'reviewed-NE26 rule must be in model commitments');
assert.ok(model.publicRuleIds.includes(ruleId), 'reviewed-NE26 must be in publicRuleIds');
assert.equal(rule.proposition, proposal.philosophicalBasis.proposition, 'Proposition must exactly equal approved proposal');
assert.equal(rule.constructId, 'NE26');
assert.equal(rule.minimumEvidenceUnits, 2);
assert.equal(rule.evidence.length, 2);

// Check source claims are single-sourced from proposal
assert.deepEqual(rule.sourceClaims, proposal.sourceClaims, 'Rule sourceClaims must equal proposal sourceClaims');
assert.ok(rule.neighbors.length >= 4, 'Must retain neighboring views');
assert.ok(rule.nonEntailments.length >= 4, 'Must retain non-entailments');

// 3. Route allocation: Full has 251, Quick and Standard unchanged
const fullRoute = routes.routes.find(r => r.id === 'full');
const standardRoute = routes.routes.find(r => r.id === 'standard');
const quickRoute = routes.routes.find(r => r.id === 'quick');
assert.ok(fullRoute.size >= 251, 'Full route size must be at least 251');
assert.equal(standardRoute.size, 120);
assert.equal(quickRoute.size, 64);
assert.ok(fullRoute.itemRefs.some(r => r.itemId === 'NEI134' && r.itemRevision === 1));
assert.ok(fullRoute.itemRefs.some(r => r.itemId === 'NEI135' && r.itemRevision === 1));
assert.ok(!standardRoute.itemRefs.some(r => r.itemId === 'NEI134' || r.itemId === 'NEI135'));
assert.ok(!quickRoute.itemRefs.some(r => r.itemId === 'NEI134' || r.itemId === 'NEI135'));
assert.ok(fullRoute.assessableDirectRuleIds.includes(ruleId));

// 4. Scoring / inference behavior simulation
function scoreRule(answers) {
  const units = [];
  for (const e of rule.evidence) {
    const val = answers[e.itemId];
    if (val && e.support.includes(val)) units.push({unitId: e.unitId, dir: 'support'});
    else if (val && e.oppose.includes(val)) units.push({unitId: e.unitId, dir: 'oppose'});
  }
  const supCount = units.filter(u => u.dir === 'support').length;
  const oppCount = units.filter(u => u.dir === 'oppose').length;
  if (supCount >= 2) return 'supported';
  if (oppCount >= 2) return 'opposed';
  if (supCount >= 1 && oppCount >= 1) return 'mixed_context_dependent';
  if (supCount === 1 || oppCount === 1) return 'leaned_toward';
  return Object.keys(answers).length ? 'insufficient_evidence' : 'not_measured';
}

// Positive case
assert.equal(scoreRule({NEI134: 'general_happiness', NEI135: 'happiness_controls'}), 'supported');

// Negative cases (deontic / rights-first and pluralist)
assert.equal(scoreRule({NEI134: 'independent_authority', NEI135: 'independent_rule_authority'}), 'opposed');
assert.equal(scoreRule({NEI134: 'plural_ultimate', NEI135: 'plural_balance'}), 'opposed');

// Mixed case
assert.equal(scoreRule({NEI134: 'general_happiness', NEI135: 'independent_rule_authority'}), 'mixed_context_dependent');

// Leaned cases
assert.equal(scoreRule({NEI134: 'general_happiness'}), 'leaned_toward');
assert.equal(scoreRule({NEI135: 'independent_rule_authority'}), 'leaned_toward');

// Insufficient
assert.equal(scoreRule({NEI134: 'other', NEI135: 'other'}), 'insufficient_evidence');

// Not measured on shorter routes
assert.equal(scoreRule({}), 'not_measured');

// 5. Non-entailments & affinity boundaries
const affinity = await read('../' + current.affinityCatalog.path);
assert.ok(!affinity.traditions.some(t => /john stuart mill/i.test(t.name) || t.id === 'philosopher-mill'),
  'Mill must remain unprofiled as an individual tradition; NE26 is a general direct proposition.');

console.log('Mill canary release 1.20.0 regressions passed: proposition, items, route isolation, scoring states, non-entailments.');
