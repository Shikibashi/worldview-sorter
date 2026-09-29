import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { generatePhilosophyPacket, auditPhilosophyPacket } from '../packages/philosophy/forms.js';
import { createQuiz, restoreQuiz, seekQuestion, currentItem, answerQuestion, nextQuestion, previousQuestion, quizProgress, COMPATIBLE_EXPERIENCE_VERSIONS } from '../packages/experience/quiz.js';
import { buildQuizSummary } from '../packages/experience/summary.js';
import { validateSubmittedSession } from '../packages/collection/session-validation.js';
const root = new URL('../', import.meta.url);
const raw = p => readFile(new URL(p, root));
const read = async p => JSON.parse(await raw(p));
const hash = s => createHash('sha256').update(s).digest('hex');
const current = await read('data/current.json');
const bank = await read(current.candidateBank.path), pilot = await read(current.pilot.path);
const model = await read(current.worldviewModel.path), instrument = await read(current.instrument.path);
const scalesDoc = await read('data/response-scales.json');
const original = await read(current.publicForm.path), full = await read(current.fullForm.path);
const experience = await read(current.quizExperience.path), history = await read('data/philosophy/full-route-history-v1.json');
const byItem = new Map(bank.items.map(i => [i.id, i]));
const forms = [original, full], args = { bank, pilot, scalesDoc, formPolicies: forms };
let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log('PASS full route: ' + name); };

test('Four selectable routes and the 562-item bank are separate quantities', () => {
  assert.deepEqual(experience.routes.map(r => r.size), [80, 120, 160, 240]);
  assert.deepEqual(full.sizes, [240]);
  assert.deepEqual(original.sizes, [80, 120, 160]);
  assert.equal(bank.items.length, 562);
  for (const r of experience.routes) assert.ok(forms.some(f => f.policyVersion === r.formPolicyVersion && f.sizes.includes(r.size)));
});
test('Longer length does not change evidence rules, raw items, rewards or privacy', () => {
  assert.equal(full.modelVersion, original.modelVersion);
  assert.deepEqual(full.facets, original.facets);
  assert.deepEqual(full.bundles, original.bundles);
  assert.deepEqual(full.excludedItemIds, original.excludedItemIds);
  assert.equal(experience.gamification.enabled, false);
  assert.equal(experience.privacy.defaultAnswerSubmission, false);
  assert.equal(experience.questionnairePolicy.rewriteItemText, false);
  assert.notEqual(full.instrumentVersion, original.instrumentVersion);
});
for (const [p, expected] of Object.entries(history.artifacts)) {
  const actual = hash(await raw(p));
  test('Frozen historical content: ' + p, () => assert.equal(actual, expected));
}
for (const saved of history.packets) test('Exact prior packet replay: ' + saved.size + '/' + saved.seed, () => {
  const packet = generatePhilosophyPacket({ bank, pilot, policy: original, size: saved.size, seed: saved.seed });
  assert.equal(hash(JSON.stringify(packet)), saved.sha256);
});

test('100 full-route seeds each contain 240 distinct, covered, correctly ordered positions', () => {
  for (let n = 0; n < 100; n++) {
    const seed = 'full-240-' + n;
    const packet = generatePhilosophyPacket({ bank, pilot, policy: full, seed, size: 240 });
    assert.deepEqual(packet, generatePhilosophyPacket({ bank, pilot, policy: full, seed, size: 240 }));
    assert.equal(packet.entries.length, 240);
    assert.equal(new Set(packet.entries.map(e => e.itemId)).size, 240);
    assert.equal(new Set(packet.entries.map(e => e.domainId)).size, 12);
    assert.equal(new Set(packet.entries.map(e => e.responseScaleId)).size, 7);
    const audit = auditPhilosophyPacket(packet, full);
    assert.ok(audit.allRequired); assert.equal(audit.facets.length, 31);
    const positions = new Map(packet.entries.map(e => [e.itemId, e.index]));
    for (const [index, entry] of packet.entries.entries()) {
      const item = byItem.get(entry.itemId);
      assert.equal(entry.index, index); assert.equal(entry.itemRevision, item.revision);
      assert.ok(!full.excludedItemIds.includes(item.id));
      if (index >= 2) assert.ok(new Set(packet.entries.slice(index - 2, index + 1).map(e => e.domainId)).size > 1);
      if (index) for (const key of ['mirrorGroup', 'scenarioGroup']) {
        assert.ok(!item[key] || item[key] !== byItem.get(packet.entries[index - 1].itemId)[key]);
      }
      if (item.eligibility.mode === 'conditional') for (const c of item.eligibility.all) assert.ok(positions.get(c.itemId) < index);
    }
  }
});
test('Invalid route lengths fail rather than truncating, padding or duplicating', () => {
  for (const size of [0, 80, 160, 239, 241, 240.5, '240']) assert.throws(() => generatePhilosophyPacket({ bank, pilot, policy: full, seed: 'invalid-length', size }));
});

const choose = item => ['likert', 'paired_choice'].includes(item.responseType) ? 0 : item.responseType === 'ranking' ? item.options.map(o => o.id) : item.options[0].id;
for (const mode of ['answered', 'mixed', 'no_view']) test('240-position ' + mode + ' flow can pause, restore, finish and explain results', () => {
  let q = createQuiz({ bank, pilot, scalesDoc, formPolicy: full, size: 240, seed: 'flow-240-' + mode, sessionId: 'synthetic-240-' + mode });
  seekQuestion(q, bank); let n = 0;
  while (q.index !== null) {
    assert.ok(n++ < 241);
    const item = currentItem(q, bank), special = mode === 'no_view' || (mode === 'mixed' && n % 7 === 0);
    answerQuestion(q, bank, scalesDoc, { state: special ? 'no_view' : 'answered', value: special ? null : choose(item), responseTimeMs: 1200 });
    nextQuestion(q, bank);
    if (n === 100) {
      const before = JSON.stringify(q);
      q = restoreQuiz(JSON.parse(before), args);
      assert.equal(JSON.stringify(q), before);
      previousQuestion(q, bank);
      const prior = q.session.responses.find(r => r.itemId === currentItem(q, bank).id);
      const old = JSON.stringify(prior);
      answerQuestion(q, bank, scalesDoc, { state: prior.state, value: prior.value, responseTimeMs: 1 });
      assert.equal(JSON.stringify(q.session.responses.find(r => r.itemId === prior.itemId)), old);
      nextQuestion(q, bank);
    }
  }
  assert.equal(q.session.completionStatus, 'completed');
  assert.equal(q.session.presentedItems.length, 240);
  assert.equal(q.session.responses.length + q.session.presentedItems.filter(e => e.skippedByBranch).length, 240);
  assert.equal(quizProgress(q).percent, 100);
  assert.deepEqual(restoreQuiz(q, args), q);
  assert.throws(() => restoreQuiz(q, { bank, pilot, scalesDoc, formPolicy: original }));
  const tampered = structuredClone(q); tampered.packet.formPolicyVersion = 'unknown-full-policy';
  assert.throws(() => restoreQuiz(tampered, args));
  const before = JSON.stringify(q.session);
  const summary = buildQuizSummary({ model, bank, scalesDoc, session: q.session });
  assert.equal(JSON.stringify(q.session), before);
  assert.equal(summary.domains.length, 12); assert.equal(summary.domains.flatMap(d => d.facets).length, 31);
  assert.equal(summary.identity, null); assert.equal(summary.matchPercent, null);
  assert.ok(!summary.coverageNotice.includes('historical sample'));
  if (mode === 'no_view') assert.equal(summary.resolvedPatterns, 0);
  // Public quiz length is not permission to write to the research collector.
  assert.throws(() => validateSubmittedSession({ session: q.session, bank, pilot, instrument, scalesDoc }));
});
for (const version of ['quiz-1.0.0', 'quiz-1.1.0', 'quiz-1.2.0']) test('Compatible browser envelope version: ' + version, () => assert.ok(COMPATIBLE_EXPERIENCE_VERSIONS.includes(version)));
for (const size of [80, 120, 160]) test('Older ' + size + '-item public save resumes with a policy registry', () => {
  const q = createQuiz({ bank, pilot, scalesDoc, formPolicy: original, size, seed: 'saved-original-' + size, sessionId: 'original-' + size });
  q.session.clientVersion = 'quiz-1.1.0'; seekQuestion(q, bank);
  answerQuestion(q, bank, scalesDoc, { state: 'no_view', value: null }); nextQuestion(q, bank);
  assert.deepEqual(restoreQuiz(q, args), q);
  assert.throws(() => restoreQuiz(q, { ...args, formPolicies: [original, { ...original, sizes: [240] }] }));
});
const app = await readFile(new URL('apps/quiz/app.js', root), 'utf8');
test('The public browser renders configured routes, not a second hard-coded length list', () => assert.ok(app.includes('experiencePolicy.routes.entries()')));
console.log(JSON.stringify({ tests, fullRouteSeeds: 100, exactHistoricalPackets: history.packets.length, syntheticFullFlows: 3, note: 'Software checks only; no participant validation or accuracy percentage.' }, null, 2));
