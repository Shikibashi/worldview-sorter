// Test tension/conflict UX: verify that generic tension copy is replaced
// with exact answer meanings, whether they conflict/coexist, why, and discriminating questions.

import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {formatTensionDetails} from '../packages/experience/result-overview.js';

const root = fileURLToPath(new URL('../', import.meta.url));

// 1. Test formatTensionDetails on general-case divergence (coexistence)
const sampleSummary = {
  schemaVersion: 'quiz-summary-3',
  domains: [
    {id: 'EP', title: 'Epistemology & Inquiry'},
    {id: 'RC', title: 'Religion & Culture'}
  ],
  rows: [
    {
      id: 'audit2-EP02-complex-knowledge',
      label: 'Knowledge in complex fields is interconnected',
      proposition: 'Knowledge in complex fields is interconnected and revisable as inquiry develops.',
      status: 'mixed_context_dependent',
      domainId: 'EP',
      evidence: [
        {
          itemId: 'EPI009',
          itemRevision: 1,
          text: 'In complex subjects, understanding develops through an interconnected web of ideas rather than isolated facts.',
          answer: 'Strongly agree',
          meaning: 'support'
        },
        {
          itemId: 'EPI028',
          itemRevision: 1,
          text: 'A research team debates how their field develops...',
          answer: 'Knowledge is mainly a collection of separate facts.',
          meaning: 'oppose'
        }
      ]
    },
    {
      id: 'audit2-RC05-miracles',
      label: 'Miracles can occur',
      proposition: 'Miraculous events can occur through divine action.',
      status: 'supported',
      domainId: 'RC',
      evidence: [
        {
          itemId: 'RCI010',
          itemRevision: 1,
          text: 'Miracles can happen in the real world.',
          answer: 'Agree',
          meaning: 'support'
        }
      ]
    },
    {
      id: 'ph-supernatural-reality',
      label: 'Supernatural reality exists',
      proposition: 'Supernatural realities exist beyond the physical world.',
      status: 'opposed',
      domainId: 'RC',
      evidence: [
        {
          itemId: 'RCI003',
          itemRevision: 1,
          text: 'There is a supernatural realm beyond physical reality.',
          answer: 'Disagree',
          meaning: 'oppose'
        }
      ]
    }
  ],
  tensions: [
    {
      id: 'within-audit2-EP02-complex-knowledge',
      kind: 'general_case_divergence',
      domainId: 'EP',
      ruleIds: ['audit2-EP02-complex-knowledge'],
      supportingItemIds: ['EPI009'],
      opposingItemIds: ['EPI028'],
      explanation: 'A general answer and a concrete case point in different directions. The distinction may depend on context.'
    },
    {
      id: 'miracle-supernatural-conflict',
      kind: 'competing_propositions',
      domainId: 'RC',
      ruleIds: ['audit2-RC05-miracles', 'ph-supernatural-reality'],
      explanation: 'The answers favor genuinely miraculous action while rejecting supernatural reality. These claims need clarification; neither answer is erased.'
    }
  ]
};

// General case divergence -> coexistence
const generalDetails = formatTensionDetails(sampleSummary.tensions[0], sampleSummary);
assert.ok(generalDetails, 'Must format general-case tension details');
assert.equal(generalDetails.relation, 'coexistence', 'General case divergence must be classified as coexistence');
assert.equal(generalDetails.relationLabel, 'Can coexist across contexts');
assert.equal(generalDetails.answers.length, 2, 'Must include both supporting and opposing answers');

assert.equal(generalDetails.answers[0].itemId, 'EPI009');
assert.equal(generalDetails.answers[0].answer, 'Strongly agree');
assert.ok(generalDetails.answers[0].meaning.includes('Supports: "Knowledge in complex fields is interconnected'));

assert.equal(generalDetails.answers[1].itemId, 'EPI028');
assert.equal(generalDetails.answers[1].answer, 'Knowledge is mainly a collection of separate facts.');
assert.ok(generalDetails.answers[1].meaning.includes('Opposes: "Knowledge in complex fields is interconnected'));

assert.ok(generalDetails.why.includes('default guidance'), 'Must explain why general rules and concrete dilemmas can coexist');
assert.ok(generalDetails.discriminatingQuestions.length > 0, 'Must provide discriminating questions');
assert.ok(generalDetails.discriminatingQuestions[0].options.length >= 2, 'Must offer discriminating options');

// Competing propositions -> conflict
const conflictDetails = formatTensionDetails(sampleSummary.tensions[1], sampleSummary);
assert.ok(conflictDetails, 'Must format competing propositions tension details');
assert.equal(conflictDetails.relation, 'conflict', 'Competing propositions must be classified as conflict');
assert.equal(conflictDetails.relationLabel, 'Competing commitments');
assert.ok(conflictDetails.answers.length >= 2, 'Must include answers from both competing rules');
assert.ok(conflictDetails.why.includes('supernatural reality'), 'Must explain philosophical conflict between miracles and naturalism');
assert.ok(conflictDetails.discriminatingQuestions.length > 0, 'Must provide discriminating questions for miracles');

// 2. Test TensionCard SSR rendering via Vite
const server = await createServer({
  configFile: path.resolve(root, 'apps/quiz-react/vite.config.js'),
  server: {middlewareMode: true}
});

let TensionCard;
try {
  const mod = await server.ssrLoadModule('/src/components/ResultsView.jsx');
  TensionCard = mod.TensionCard;
  assert.ok(TensionCard, 'TensionCard must be exported from ResultsView.jsx');
} finally {
  await server.close();
}

// Render coexistence tension card
const coexistenceHtml = renderToStaticMarkup(
  React.createElement(TensionCard, {
    tension: sampleSummary.tensions[0],
    summary: sampleSummary
  })
);

assert.ok(coexistenceHtml.includes('Can coexist across contexts'), 'Render must include coexistence badge');
assert.ok(coexistenceHtml.includes('Epistemology &amp; Inquiry') || coexistenceHtml.includes('Epistemology & Inquiry'), 'Render must include domain title');
assert.ok(coexistenceHtml.includes('EPI009:'), 'Render must display item ID');
assert.ok(coexistenceHtml.includes('Strongly agree'), 'Render must display user response');
assert.ok(coexistenceHtml.includes('Evidence meaning:'), 'Render must display evidence meaning');
assert.ok(coexistenceHtml.includes('Why these answers differ:'), 'Render must display why section');
assert.ok(coexistenceHtml.includes('Discriminating questions to consider:'), 'Render must display discriminating questions');

// Render conflict tension card
const conflictHtml = renderToStaticMarkup(
  React.createElement(TensionCard, {
    tension: sampleSummary.tensions[1],
    summary: sampleSummary
  })
);

assert.ok(conflictHtml.includes('Competing commitments'), 'Render must include conflict badge');
assert.ok(conflictHtml.includes('RCI010:'), 'Render must display miracle item');
assert.ok(conflictHtml.includes('RCI003:'), 'Render must display supernatural item');
assert.ok(conflictHtml.includes('Do you view miracles as literal interventions'), 'Render must display miracle discriminating prompt');

console.log('Tension/conflict UX regressions passed: exact answer meanings, coexistence/conflict badges, substantive rationales, and discriminating questions verified in SSR.');
