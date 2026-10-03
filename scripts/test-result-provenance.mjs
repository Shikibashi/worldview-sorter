// Test result provenance rendering: verify that respondent evidence and
// scholarly/model provenance are decoupled across all row observation states.
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = await createServer({
  configFile: path.resolve(root, 'apps/quiz-react/vite.config.js'),
  server: {middlewareMode: true}
});

let Pattern;
try {
  const mod = await server.ssrLoadModule('/src/components/ResultsView.jsx');
  Pattern = mod.Pattern;
  assert.ok(Pattern, 'Pattern component must be exported from ResultsView.jsx');
} finally {
  await server.close();
}

const sampleSource = {
  id: 'sep-sample',
  title: 'Stanford Encyclopedia of Philosophy: Sample Topic',
  url: 'https://plato.stanford.edu/entries/sample/',
  locator: 'Section 2.1',
  access: 'text_reviewed',
  claimLinks: [{relationship: 'supports', claim: 'Scholarly claim supporting the distinction.'}],
  validatesThisQuiz: false
};

const sampleRule = {
  id: 'reviewed-PL01-sample',
  version: '1.0.0',
  kind: 'direct',
  neighbors: ['Neighboring view A', 'Neighboring view B'],
  nonEntailments: ['Does not entail theory X', 'Does not entail theory Y'],
  falsePositives: ['Alternative motivation Z']
};

// 1. Row with evidence and sources: renders answers and sources
const rowWithEvidence = {
  id: 'rule-with-evidence',
  label: 'Direct rule with responses',
  status: 'supported',
  proposition: 'Explicit proposition text.',
  evidence: [{
    itemId: 'PLI001',
    itemRevision: 1,
    text: 'Do you support principle P?',
    answer: 'Strongly agree',
    meaning: 'support'
  }],
  sources: [sampleSource],
  interpretationRule: sampleRule
};

const html1 = renderToStaticMarkup(React.createElement(Pattern, {row: rowWithEvidence}));
assert.ok(html1.includes('Why this appears · answers and sources'), 'Must label as answers and sources when evidence exists');
assert.ok(html1.includes('Do you support principle P?'), 'Must render answer text');
assert.ok(html1.includes('Your response:</strong> Strongly agree'), 'Must render user response');
assert.ok(html1.includes('Sources behind this interpretation'), 'Must render sources');
assert.ok(html1.includes('This source does not validate the questionnaire.'), 'Must retain disclaimer');
assert.ok(html1.includes('Nearby views not settled:</strong> Neighboring view A · Neighboring view B'));
assert.ok(html1.includes('This does not imply:</strong> Does not entail theory X · Does not entail theory Y'));
assert.ok(html1.includes('Similar answers can also reflect:</strong> Alternative motivation Z'));
assert.ok(html1.includes('Technical provenance'));

// 2. Row with not_measured and NO evidence, but WITH sources: provenance must NOT be hidden
const rowNotMeasured = {
  id: 'rule-not-measured',
  label: 'Unmeasured proposition with sources',
  status: 'not_measured',
  proposition: 'Scholarly proposition not administered on this route.',
  evidence: [],
  sources: [sampleSource],
  interpretationRule: sampleRule
};

const html2 = renderToStaticMarkup(React.createElement(Pattern, {row: rowNotMeasured}));
assert.ok(html2.includes('Why this appears · model provenance and sources'), 'Must render provenance summary when evidence is empty');
assert.ok(html2.includes('No direct answer observations were recorded for this proposition on the administered route.'), 'Must explicitly note absence of respondent evidence');
assert.ok(html2.includes('Sources behind this interpretation'), 'Must NOT hide sources when evidence is empty');
assert.ok(html2.includes('Stanford Encyclopedia of Philosophy: Sample Topic'), 'Must show source title');
assert.ok(html2.includes('Rule-linked source claim (supports): Scholarly claim supporting the distinction.'), 'Must show rule-linked source claim');
assert.ok(html2.includes('Nearby views not settled:</strong> Neighboring view A · Neighboring view B'), 'Must show neighbors');
assert.ok(html2.includes('This does not imply:</strong> Does not entail theory X · Does not entail theory Y'), 'Must show non-entailments');
assert.ok(html2.includes('Similar answers can also reflect:</strong> Alternative motivation Z'), 'Must show false-positive warning');
assert.ok(html2.includes('Technical provenance'), 'Must show technical provenance');

// 3. Derived rule with undefined evidence, but interpretation rule and non-entailments
const rowDerived = {
  id: 'rule-derived',
  label: 'Derived conclusion',
  status: 'supported',
  displayState: 'model_review_required',
  proposition: 'Synthesized derived conclusion.',
  sources: [],
  interpretationRule: sampleRule
};

const html3 = renderToStaticMarkup(React.createElement(Pattern, {row: rowDerived}));
assert.ok(html3.includes('Why this appears · model provenance and sources'), 'Must show details for derived rule without direct evidence');
assert.ok(html3.includes('No direct answer observations were recorded'), 'Must state no direct answers');
assert.ok(html3.includes('Nearby views not settled:'), 'Must show neighbors');
assert.ok(html3.includes('This does not imply:'), 'Must show non-entailments');
assert.ok(html3.includes('Technical provenance'), 'Must show technical provenance');

// 4. Row with neither evidence nor provenance: details block omitted cleanly
const rowBare = {
  id: 'rule-bare',
  label: 'Bare row without metadata',
  status: 'insufficient_evidence',
  proposition: 'Bare proposition.'
};

const html4 = renderToStaticMarkup(React.createElement(Pattern, {row: rowBare}));
assert.ok(!html4.includes('wvs-evidence-details'), 'Must omit details block when neither evidence nor provenance exists');

console.log('Result provenance regressions passed: evidence vs provenance decoupling, not_measured/derived/insufficient states, source disclaimers.');
