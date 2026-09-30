import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { generatePhilosophyPacket, auditPhilosophyPacket } from '../packages/philosophy/forms.js';

const root = new URL('../', import.meta.url);
const raw = p => readFile(new URL(p, root), 'utf8');
const read = async p => JSON.parse(await raw(p));
const digest = s => createHash('sha256').update(s).digest('hex');
const output = new Set();
async function write(p, value) {
  await mkdir(new URL(p.slice(0, p.lastIndexOf('/') + 1), root), { recursive: true });
  await writeFile(new URL(p, root), typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
  output.add(p);
}

const current = await read('data/current.json');
const bank = await read(current.candidateBank.path);
const pilot = await read(current.pilot.path);
const originalPath = 'data/philosophy/public-form-v1.json';
const original = await read(originalPath);
assert.deepEqual(original.sizes, [80, 120, 160]);
const frozenPaths = [originalPath, 'data/experience/policy-v1.json', current.candidateBank.path,
  current.worldviewModel.path, current.instrument.path, current.pilot.path];
const frozen = Object.fromEntries(await Promise.all(frozenPaths.map(async p => [p, digest(await raw(p))])));

// A new, separately identified 240-item form. The shorter routes retain their
// existing policy, instrument, seed behavior, and saved-answer contract.
const full = {
  ...structuredClone(original),
  policyVersion: 'philosophy-full-1.0.0',
  parentPolicyVersion: original.policyVersion,
  administrationId: 'public-worldview-240-1',
  instrumentVersion: 'worldview-public-240-1.0.0',
  sizes: [240]
};
const fullPath = 'data/philosophy/public-full-v1.json';
const experience = await read('data/experience/policy-v1.json');
experience.experienceVersion = 'quiz-1.2.0';
experience.routes = [
  { size: 80, label: 'A first look', description: 'All core topics, with more distinctions left open.', formPolicyVersion: original.policyVersion },
  { size: 120, label: 'A wider view', description: 'All core topics, with more complete answer patterns.', formPolicyVersion: original.policyVersion },
  { size: 160, label: 'A deep dive', description: 'More perspectives across every field. No time limit.', formPolicyVersion: original.policyVersion },
  { size: 240, label: 'The full exploration', description: '240 questions across all twelve topics. Pause whenever you like.', formPolicyVersion: full.policyVersion }
];
experience.formPolicies = [
  { version: original.policyVersion, path: originalPath },
  { version: full.policyVersion, path: fullPath }
];
experience.routeLengthMeaning = 'Assigned distinct items; inapplicable conditional follow-ups are skipped and recorded separately. The 240-item route is not the entire master bank.';
const sample = generatePhilosophyPacket({ bank, pilot, policy: full, seed: 'full-route-build-check', size: 240 });
assert.equal(sample.entries.length, 240);
assert.equal(new Set(sample.entries.map(e => e.itemId)).size, 240);
assert.ok(auditPhilosophyPacket(sample, full).allRequired);

await write(fullPath, full);
await write('data/experience/policy-v1.1.json', experience);
current.fullForm = { version: full.policyVersion, path: fullPath };
current.quizExperience = { version: experience.experienceVersion, path: 'data/experience/policy-v1.1.json', entrypoint: 'apps/quiz/index.html' };
// current.publicForm deliberately remains the original shorter-route policy.
await write('data/current.json', current);
await write('data/philosophy/full-route-release-v1.json', {
  version: 'full-route-release-1', bankVersion: bank.bankVersion, itemCount: bank.items.length,
  routeSizes: experience.routes.map(r => r.size), fullPolicyVersion: full.policyVersion,
  fullInstrumentVersion: full.instrumentVersion, modelVersion: full.modelVersion,
  facets: full.facets.length, existingPolicyUnchanged: true, frozenSourceHashes: frozen,
  rawAnswersRescoredByLength: false, empiricalValidityClaimed: false
});
await write('docs/FULL_ROUTE.md', `# 240-question full exploration

> Historical milestone for the initial full route. Version and coverage claims below describe that release, not the current PR #1 baseline. See [the content-efficiency audit](CONTENT_EFFICIENCY_AUDIT.md) for bank v0.9 and public policies v1.1.

The public quiz offers 80, 120, 160, and **240 assigned questions**. The full route
uses more of the existing ${bank.items.length}-item bank, not newly invented filler or
repeated questions. Every route retains the 31-facet academic content blueprint.

The full route includes every response scale and complete authored evidence
bundles across ontology, metaphysics, metaethics, ethics, epistemology, values,
mind, agency, religion, meaning, social philosophy, and political philosophy.
The longer form samples more distinctions; length is not a reliability estimate
and does not make a result a validated diagnosis.

## Compatibility

- 80/120/160: unchanged \`philosophy-blueprint-1.0.0\` / \`worldview-public-1.0.0\`.
- 240: \`philosophy-full-1.0.0\` / \`worldview-public-240-1.0.0\`.
- Shared interpretation: \`${full.modelVersion}\`. No scoring rule or question wording changes.

The browser resolves a saved packet's exact policy version from an explicit
allowlist. Historical pilot backups still use their original generator. Unknown
versions are rejected rather than silently reinterpreted. Research-pilot length
limits and collection contracts are unchanged; this is a local public quiz route.

## Taking a longer quiz

There is no timer. Pause/resume, Back, local backup, raw export, source-linked
results and opt-in sharing remain available. The quiz does not submit answers
automatically. A packet has exactly 240 distinct assigned items, but branch rules
may skip inapplicable follow-ups. Progress and results retain that distinction;
no-view is not silently treated as neutral.

## Tests

Run \`npm run test:full-route\` and \`npm test\`. The new suite checks 100 full-route
seeds, domain/facet/format coverage, duplicate exclusion, ordering, conditional
prerequisites, mixed/no-view/all-answer flows, old-backup restoration and frozen
question/model/policy hashes. The browser suite also takes the 240-item route,
pauses near the middle, reloads, resumes, goes Back, and checks results and export.
The optional post-quiz game layer remains isolated from measurement.
`);
let readme = await raw('README.md');
readme = readme.replace('80/120/160-question routes', '80/120/160/240-question routes');
const marker = '\n## 240-question full route\n';
readme = readme.split(marker)[0] + marker + '\nChoose **The full exploration** for 240 assigned questions from the existing academic bank. Shorter routes remain available and saved quizzes retain their original versions. No timer, new scoring assumptions, or automatic submission. Inapplicable branch follow-ups can be skipped. See [full-route behavior and compatibility](docs/FULL_ROUTE.md).\n';
await write('README.md', readme);
for (const [p, h] of Object.entries(frozen)) assert.equal(digest(await raw(p)), h, 'Frozen artifact changed: ' + p);
const build = await read('data/academic/build-output.json');
build.paths = [...new Set([...build.paths, ...output])].sort();
await write('data/academic/build-output.json', build);
console.log('Full route built: 240 distinct assigned items; shorter policies and academic content unchanged.');
