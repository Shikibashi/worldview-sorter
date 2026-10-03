// Test the successor-release mechanics: path versioning, companion discovery,
// lineage derivation, staged idempotent writes, plan validation, and idempotency.
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  bumpVersionedPath,
  discoverCompanions,
  lineageFromCurrent,
  successorPaths,
  StagedWrites,
  reviewedProposal,
  reviewedSourceClaim
} from '../packages/governance/successor.js';
import {readPlan} from './release-successor.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

// 1. Path versioning: bumps minor or only number, resets patch on 3-part semver
assert.equal(bumpVersionedPath('data/items/candidate-v0.19.json'), 'data/items/candidate-v0.20.json');
assert.equal(bumpVersionedPath('data/pilots/pilot-0.12.json'), 'data/pilots/pilot-0.13.json');
assert.equal(bumpVersionedPath('data/localization/catalog-v18.json'), 'data/localization/catalog-v19.json');
assert.equal(bumpVersionedPath('data/localization/en-US-v18.json'), 'data/localization/en-US-v19.json');
assert.equal(bumpVersionedPath('data/reference/reference-profiles-v1.1.0.json'), 'data/reference/reference-profiles-v1.2.0.json');
assert.equal(bumpVersionedPath('data/experience/progressive-depth-v2.7.manifest.json'), 'data/experience/progressive-depth-v2.8.manifest.json');
assert.equal(bumpVersionedPath('data/releases/channels-v20.json'), 'data/releases/channels-v21.json');
assert.equal(bumpVersionedPath('data/releases/model-release-v1.19.0.json'), 'data/releases/model-release-v1.20.0.json');

// 2. Companion discovery matches all historical bank versions (0.10.0 -> 0.19.0)
const historicalExpected = {
  '0.10.0': {instrument: 'data/instruments/research-pool-0.10.json', academic: 'data/academic/release-v0.10.json', pilot: 'data/pilots/pilot-0.3.json'},
  '0.11.0': {instrument: 'data/instruments/research-pool-0.11.json', academic: 'data/academic/release-v0.11.json', pilot: 'data/pilots/pilot-0.4.json'},
  '0.12.0': {instrument: 'data/instruments/research-pool-0.12.json', academic: 'data/academic/release-v0.12.json', pilot: 'data/pilots/pilot-0.5.json'},
  '0.13.0': {instrument: 'data/instruments/research-pool-0.13.json', academic: 'data/academic/release-v0.13.json', pilot: 'data/pilots/pilot-0.6.json'},
  '0.14.0': {instrument: 'data/instruments/research-pool-0.14.json', academic: 'data/academic/release-v0.14.json', pilot: 'data/pilots/pilot-0.7.json'},
  '0.15.0': {instrument: 'data/instruments/research-pool-0.15.json', academic: 'data/academic/release-v0.15.json', pilot: 'data/pilots/pilot-0.8.json'},
  '0.16.0': {instrument: 'data/instruments/research-pool-0.16.json', academic: 'data/academic/release-v0.16.json', pilot: 'data/pilots/pilot-0.9.json'},
  '0.17.0': {instrument: 'data/instruments/research-pool-0.17.json', academic: 'data/academic/release-v0.17.json', pilot: 'data/pilots/pilot-0.10.json'},
  '0.18.0': {instrument: 'data/instruments/research-pool-0.18.json', academic: 'data/academic/release-v0.18.json', pilot: 'data/pilots/pilot-0.11.json'},
  '0.19.0': {instrument: 'data/instruments/research-pool-0.19.json', academic: 'data/academic/release-v0.19.json', pilot: 'data/pilots/pilot-0.12.json'}
};
for (const [bankVersion, expected] of Object.entries(historicalExpected)) {
  const companions = await discoverCompanions(root, bankVersion);
  assert.equal(companions.instrument.path, expected.instrument, `instrument mismatch for ${bankVersion}`);
  assert.equal(companions.academicRelease.path, expected.academic, `academic mismatch for ${bankVersion}`);
  assert.equal(companions.pilot.path, expected.pilot, `pilot mismatch for ${bankVersion}`);
}
await assert.rejects(
  () => discoverCompanions(root, '99.99.99'),
  /Expected exactly one research pool for candidate bank 99.99.99/
);

// 3. Lineage from current
const current = JSON.parse(await readFile(path.join(root, 'data/current.json'), 'utf8'));
const lineage = await lineageFromCurrent(root, current);
const expectedKeys = [
  'bank', 'registry', 'sources', 'ledger', 'model', 'full', 'depth', 'pilot',
  'review', 'catalog', 'localization', 'experience', 'channels', 'research',
  'runtime', 'academic', 'instrument', 'reference', 'readiness'
];
assert.deepEqual(Object.keys(lineage).sort(), expectedKeys.sort());
const successors = successorPaths(lineage);
for (const key of expectedKeys) {
  assert.notEqual(lineage[key], successors[key], `Successor path for ${key} must differ from lineage`);
}

// 4. StagedWrites mechanics
const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'wvs-staged-test-'));
try {
  const stage = new StagedWrites(tmpDir);
  stage.create('data/test-immutable.json', {hello: 'world'});
  stage.replace('data/test-mutable.json', {count: 1});
  const firstReport = await stage.commit();
  assert.deepEqual(firstReport.created, ['data/test-immutable.json']);
  assert.deepEqual(firstReport.replaced, ['data/test-mutable.json']);
  assert.deepEqual(firstReport.unchanged, []);

  // Re-run with identical content is idempotent
  const secondStage = new StagedWrites(tmpDir);
  secondStage.create('data/test-immutable.json', {hello: 'world'});
  secondStage.replace('data/test-mutable.json', {count: 1});
  const secondReport = await secondStage.commit();
  assert.deepEqual(secondReport.created, []);
  assert.deepEqual(secondReport.replaced, []);
  assert.deepEqual(secondReport.unchanged.sort(), ['data/test-immutable.json', 'data/test-mutable.json'].sort());

  // Mutating an immutable artifact throws clear error
  const conflictStage = new StagedWrites(tmpDir);
  conflictStage.create('data/test-immutable.json', {hello: 'tampered'});
  await assert.rejects(
    () => conflictStage.commit(),
    /Successor artifact already exists with different content: data\/test-immutable\.json/
  );

  // Replace mutates without error
  const updateStage = new StagedWrites(tmpDir);
  updateStage.replace('data/test-mutable.json', {count: 2});
  const updateReport = await updateStage.commit();
  assert.deepEqual(updateReport.replaced, ['data/test-mutable.json']);
  assert.equal(JSON.parse(await readFile(path.join(tmpDir, 'data/test-mutable.json'), 'utf8')).count, 2);

  // Traversal rejected
  assert.throws(() => new StagedWrites(tmpDir).create('../outside.json', {}), /Unsafe path/);
} finally {
  await rm(tmpDir, {recursive: true, force: true});
}

// 5. Plan validation
const validPlanFixture = {
  schemaVersion: 'successor-release-plan-1',
  version: 'model-release-1.20.0',
  builder: 'scripts/build-sample-release.mjs',
  authoredInputs: ['scripts/build-sample-release.mjs', 'docs/sample.md']
};
const planDir = await mkdtemp(path.join(os.tmpdir(), 'wvs-plan-test-'));
try {
  const planFile = 'plan.json';
  await writeFile(path.join(planDir, planFile), JSON.stringify(validPlanFixture, null, 2));
  const plan = await readPlan(planDir, planFile);
  assert.equal(plan.version, 'model-release-1.20.0');
  assert.equal(plan.manifestPath, 'data/releases/model-release-v1.20.0.json');

  // Builder must be in authoredInputs
  await writeFile(path.join(planDir, planFile), JSON.stringify({
    ...validPlanFixture,
    authoredInputs: ['docs/sample.md']
  }, null, 2));
  await assert.rejects(() => readPlan(planDir, planFile), /plan\.builder must be listed in authoredInputs/);

  // Rejects path traversal
  await writeFile(path.join(planDir, planFile), JSON.stringify({
    ...validPlanFixture,
    authoredInputs: [validPlanFixture.builder, '../escape.md']
  }, null, 2));
  await assert.rejects(() => readPlan(planDir, planFile), /Unsafe input/);
} finally {
  await rm(planDir, {recursive: true, force: true});
}

// 6. Reviewed proposals and claim single-sourcing
const proposal = await reviewedProposal(root, 'MCP-2026-093');
assert.equal(proposal.proposalId, 'MCP-2026-093');
const claim = reviewedSourceClaim(proposal, 'sep-socialism-effective-control', 'supports');
assert.equal(claim.sourceId, 'sep-socialism-effective-control');
assert.equal(claim.relationship, 'supports');
assert.ok(claim.claim.length > 10);
assert.throws(() => reviewedSourceClaim(proposal, 'nonexistent-source', 'supports'), /must have exactly one supports claim/);

console.log('Successor release mechanics validated: version bumping, historical companion discovery, lineage, staged atomic writes, plan validation, proposal single-sourcing.');
