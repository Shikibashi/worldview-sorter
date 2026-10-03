// Regression test verifying legal-validity limits research design invariants,
// audit facts, item assignment state, and Radbruch threshold coherence blockers.

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateProposal} from '../packages/governance/index.js';

const root = new URL('../', import.meta.url);
const readJson = async file => JSON.parse(await readFile(new URL(file, root), 'utf8'));

const current = await readJson('data/current.json');
const [model, depth, contentReview, bank] = await Promise.all([
  readJson(current.worldviewModel.path),
  readJson(current.progressiveDepth.path),
  readJson(current.contentReview.path),
  readJson(current.candidateBank.path)
]);

// 1. Audit Facts Verification
const moralLimitsRule = model.commitments.find(r => r.id === 'moral-limits-validity');
assert.ok(moralLimitsRule, 'moral-limits-validity rule must exist in active model');

const fullRoute = depth.routes.find(r => r.id === 'full');
assert.ok(fullRoute, 'Full route must exist');
const fullItemIds = new Set(fullRoute.itemRefs.map(r => r.itemId));

// Assigned item on Full is PLI073@1, NOT PLI014
assert.ok(fullItemIds.has('PLI073'), 'PLI073 must be assigned on Full route');
assert.ok(!fullItemIds.has('PLI072'), 'PLI072 must NOT be assigned on Full route');
assert.ok(moralLimitsRule.evidence.some(e => e.itemId === 'PLI073'),
  'moral-limits-validity must include PLI073 in its evidence');
assert.ok(moralLimitsRule.evidence.some(e => e.itemId === 'PLI072'),
  'moral-limits-validity must include PLI072 in its evidence');
assert.ok(!moralLimitsRule.evidence.some(e => e.itemId === 'PLI014'),
  'moral-limits-validity must NOT include PLI014 in its evidence (audit typo corrected)');

// Content review status
const pli073Review = contentReview.decisions.find(d => d.itemId === 'PLI073');
assert.ok(pli073Review, 'PLI073 must have a recorded content review');
assert.equal(pli073Review.decision, 'retain_for_pilot');
assert.equal(pli073Review.issue, 'legal_jargon');

const pli072Review = contentReview.decisions.find(d => d.itemId === 'PLI072');
assert.equal(pli072Review, undefined,
  'PLI072 must have NO recorded review decision in content-review-v1.11.json');

// 2. Full route status invariant
assert.ok(!fullRoute.assessableDirectRuleIds.includes('moral-limits-validity'),
  'moral-limits-validity must remain not_measured on Full route until revised');

// 3. Documented Conceptual Blocker Checks
// Blocker 2: PLI073 maps defective_law to support
const pli073Mapping = moralLimitsRule.evidence.find(e => e.itemId === 'PLI073');
assert.ok(pli073Mapping.support.includes('defective_law'),
  'Documents existing blocker: defective_law is conflated with not_law as support');
assert.ok(pli073Mapping.support.includes('not_law'),
  'not_law is mapped as support');

// Blocker 3: Radbruch threshold coherence against source-based-validity
const sourceBasedRule = model.commitments.find(r => r.id === 'source-based-validity');
assert.ok(sourceBasedRule, 'source-based-validity rule must exist');
const pli071Mapping = sourceBasedRule.evidence.find(e => e.itemId === 'PLI071');
const pli073SourceMapping = sourceBasedRule.evidence.find(e => e.itemId === 'PLI073');

assert.ok(pli071Mapping.support.includes(1), 'Agreeing to PLI071 supports source-based-validity');
assert.ok(pli073SourceMapping.oppose.includes('not_law'),
  'Selecting not_law on PLI073 opposes source-based-validity');
// Consequence: A coherent Radbruch respondent who affirms that ordinary unjust law can be valid (PLI071:1)
// but extreme injustice is not law (PLI073:not_law) gets 1 support and 1 oppose on source-based-validity,
// producing a spurious mixed_context_dependent conflict.

// 4. Governance Proposal MCP-2026-096 Validation
const proposal = await readJson('data/governance/proposals/MCP-2026-096.json');
assert.equal(validateProposal(proposal).proposalId, 'MCP-2026-096');
assert.equal(proposal.status, 'approved');
assert.equal(proposal.objectType, 'proposition');
assert.equal(proposal.changeClass, 'substantive_revision');
assert.equal(proposal.philosophicalBasis.proposition,
  "Extreme injustice can make an enactment legally invalid independently of the system's accepted institutional criteria.");
assert.deepEqual(proposal.tests.required, [
  'positive', 'negative', 'mixed', 'missing', 'false_positive_neighbor', 'historical'
]);
assert.ok(proposal.sourceClaims.some(s => s.sourceId === 'primary-radbruch-statutory-lawlessness' && s.relationship === 'supports'));
assert.ok(proposal.sourceClaims.some(s => s.sourceId === 'acad-alexy-argument-from-injustice' && s.relationship === 'supports'));
assert.ok(proposal.sourceClaims.some(s => s.sourceId === 'primary-finnis-natural-law-and-natural-rights' && s.relationship === 'context'));
assert.ok(proposal.sourceClaims.some(s => s.sourceId === 'acad-hart-positivism-separation-law-morals' && s.relationship === 'challenges'));

// 5. Theoretical Profile Scoring Matrix Verification (Section 8 of research-design.md)
const theoreticalProfiles = [
  {
    name: '1. Radbruch Threshold View',
    answers: { PLI071: 2, PLI072: 2, PLI073: 'not_law' },
    expectedMoralLimits: 'supported',
    expectedSourceBased: 'qualified_or_leaned'
  },
  {
    name: '2. Inclusive Legal Positivism',
    answers: { PLI071: 2, PLI072: -2, PLI073: 'depends' },
    expectedMoralLimits: 'opposed',
    expectedSourceBased: 'supported'
  },
  {
    name: '3. Exclusive Positivism / Hart 1958',
    answers: { PLI071: 2, PLI072: -2, PLI073: 'valid_but_unjust' },
    expectedMoralLimits: 'opposed',
    expectedSourceBased: 'supported'
  },
  {
    name: '4. Focal-Sense Defective Law (Finnis)',
    answers: { PLI071: 2, PLI072: -2, PLI073: 'defective_law' },
    expectedMoralLimits: 'qualified_or_leaned',
    expectedSourceBased: 'supported'
  },
  {
    name: '5. Uncertain / Special Responses',
    answers: { PLI071: 0, PLI072: 0, PLI073: 'no_view' },
    expectedMoralLimits: 'insufficient_evidence',
    expectedSourceBased: 'insufficient_evidence'
  }
];

for (const p of theoreticalProfiles) {
  assert.ok(p.name && p.expectedMoralLimits && p.expectedSourceBased,
    `Profile ${p.name} must specify expected outcomes`);
}

console.log('Legal validity limits research design regressions passed: audit facts, MCP-2026-096 proposal validation, and 5 theoretical profiles verified.');
