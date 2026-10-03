// Shared mechanics for building a successor model release from the current one.
// Authored content decisions stay in each release's own builder; everything
// mechanical (lineage, successor paths, companion pointers, idempotent writes)
// lives here so a release is a pure function of the committed tree.
import assert from 'node:assert/strict';
import {mkdir, readFile, readdir, rename, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';

const readJson = async (root, relative) => JSON.parse(await readFile(path.join(root, relative), 'utf8'));
const exists = async (root, relative) => readFile(path.join(root, relative)).then(() => true, error => {
  if (error.code === 'ENOENT') return false;
  throw error;
});
const serialize = value => typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n';

// `v0.19` -> `v0.20`, `pilot-0.12` -> `pilot-0.13`, `catalog-v18` -> `catalog-v19`,
// `reference-profiles-v1.1.0` -> `reference-profiles-v1.2.0`. Every component in
// this repository advances its minor (or only) version number per release.
export function bumpVersionedPath(file) {
  const dir = path.posix.dirname(file), base = path.posix.basename(file);
  const match = /(?<=[v-])(\d+(?:\.\d+)*)(?=[.-]|$)/.exec(base);
  assert.ok(match, 'No version token in ' + file);
  const parts = match[1].split('.').map(Number);
  if (parts.length === 1) parts[0] += 1;
  else { parts[1] += 1; for (let i = 2; i < parts.length; i += 1) parts[i] = 0; }
  return path.posix.join(dir, base.slice(0, match.index) + parts.join('.') + base.slice(match.index + match[1].length));
}

// Resolve the operational companions of a candidate bank by content, not by
// bank-version naming tables. Exactly one artifact must claim each role.
export async function discoverCompanions(root, bankVersion) {
  const only = (label, matches) => {
    assert.equal(matches.length, 1, `Expected exactly one ${label} for candidate bank ${bankVersion}; found ${matches.length}${
      matches.length ? ': ' + matches.map(match => match.path).join(', ') : ''}. Build and commit it before syncing the release.`);
    return matches[0];
  };
  const list = async (dir, pattern) => (await readdir(path.join(root, dir))).filter(name => pattern.test(name)).sort();
  const instruments = [];
  for (const name of await list('data/instruments', /^research-pool-[0-9.]+\.json$/)) {
    const file = 'data/instruments/' + name, body = await readJson(root, file);
    if (body.bankVersion === bankVersion) instruments.push({version: body.instrumentVersion, path: file});
  }
  const instrument = only('research pool', instruments);
  const academics = [];
  for (const name of await list('data/academic', /^release-v[0-9.]+\.json$/)) {
    const file = 'data/academic/' + name, body = await readJson(root, file);
    if (body.version === bankVersion) academics.push({version: body.version, path: file});
  }
  const academicRelease = only('academic release record', academics);
  const pilots = [];
  for (const name of await list('data/pilots', /^pilot-[0-9]+\.[0-9]+\.json$/)) {
    const file = 'data/pilots/' + name, body = await readJson(root, file);
    if (body.bankVersion === bankVersion && body.sourceInstrumentVersion === instrument.version)
      pilots.push({version: body.pilotId, path: file});
  }
  const pilot = only('pilot runtime configuration', pilots);
  return {instrument, academicRelease, pilot};
}

// The artifact paths a successor release is derived from, read from the live
// pointers instead of hardcoded per release.
export async function lineageFromCurrent(root, current) {
  const direct = {
    bank: 'candidateBank', registry: 'registry', sources: 'sourceRegistry', ledger: 'worldviewSourceLedger',
    model: 'worldviewModel', full: 'fullForm', depth: 'progressiveDepth', pilot: 'pilotCandidate',
    review: 'contentReview', catalog: 'affinityCatalog', localization: 'localizationCatalog',
    experience: 'quizExperience', channels: 'releaseChannels', research: 'instrument', runtime: 'pilot',
    academic: 'academicRelease'
  };
  const lineage = {};
  for (const [key, field] of Object.entries(direct)) {
    assert.ok(current[field]?.path, `data/current.json lacks ${field}.path`);
    lineage[key] = current[field].path;
  }
  const pilot = await readJson(root, lineage.pilot);
  assert.ok(pilot.route?.instrumentManifestPath, `${lineage.pilot} lacks route.instrumentManifestPath`);
  lineage.instrument = pilot.route.instrumentManifestPath;
  lineage.reference = (await readJson(root, 'data/reference/catalog-index.json')).catalogPath;
  if (await exists(root, 'data/reference/readiness-current.json')) {
    lineage.readiness = (await readJson(root, 'data/reference/readiness-current.json')).specPath;
  } else {
    const audits = (await readdir(path.join(root, 'data/reference')))
      .filter(name => /^readiness-audit-v\d+\.json$/.test(name))
      .sort((a, b) => Number(b.match(/\d+/)[0]) - Number(a.match(/\d+/)[0]));
    assert.ok(audits.length, 'No readiness audit spec found in data/reference');
    lineage.readiness = 'data/reference/' + audits[0];
  }
  for (const [key, file] of Object.entries(lineage)) assert.ok(await exists(root, file), `Lineage ${key} is missing: ${file}`);
  return lineage;
}

export const successorPaths = lineage => Object.fromEntries(
  Object.entries(lineage).map(([key, file]) => [key, bumpVersionedPath(file)]));

// Collect writes, reject conflicts before touching disk, then commit atomically
// per file. `create` is for immutable successor artifacts: re-running a builder
// is a no-op when bytes are identical and an error naming the file when they are not.
// `replace` is for mutable pointers and generated documents.
export class StagedWrites {
  constructor(root) { this.root = root; this.staged = new Map(); }
  create(relative, value) { return this.#stage(relative, value, 'create'); }
  replace(relative, value) { return this.#stage(relative, value, 'replace'); }
  #stage(relative, value, mode) {
    assert.ok(!path.isAbsolute(relative) && !relative.split('/').includes('..'), 'Unsafe path ' + relative);
    const prior = this.staged.get(relative);
    assert.ok(!prior || (prior.mode === mode && prior.text === serialize(value)), 'Conflicting staged write for ' + relative);
    this.staged.set(relative, {mode, text: serialize(value)});
    return value;
  }
  async commit() {
    const report = {created: [], unchanged: [], replaced: []};
    const plan = [];
    for (const [relative, {mode, text}] of this.staged) {
      let existing = null;
      try { existing = await readFile(path.join(this.root, relative), 'utf8'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (existing === text) { report.unchanged.push(relative); continue; }
      if (mode === 'create' && existing !== null)
        throw new Error('Successor artifact already exists with different content: ' + relative +
          '. Immutable artifacts are never overwritten; delete the uncommitted partial output or choose a new version.');
      plan.push({relative, text, mode});
    }
    for (const {relative, text, mode} of plan) {
      const target = path.join(this.root, relative), temp = target + '.tmp-' + process.pid;
      await mkdir(path.dirname(target), {recursive: true});
      try { await writeFile(temp, text); await rename(temp, target); }
      catch (error) { await rm(temp, {force: true}); throw error; }
      report[mode === 'create' ? 'created' : 'replaced'].push(relative);
    }
    this.staged.clear();
    return report;
  }
}

// Authored claim text lives in the approved proposal. A release builder reads it
// from there instead of retyping it, so the release gate (which requires the
// released claim to equal the reviewed claim byte for byte) cannot drift.
export async function reviewedProposal(root, proposalId) {
  const proposal = await readJson(root, `data/governance/proposals/${proposalId}.json`);
  assert.ok(['approved', 'released'].includes(proposal.status), `${proposalId} is ${proposal.status}, not approved`);
  return proposal;
}

export const reviewedSourceClaim = (proposal, sourceId, relationship = 'supports') => {
  const matches = proposal.sourceClaims.filter(claim => claim.sourceId === sourceId && claim.relationship === relationship);
  assert.equal(matches.length, 1, `${proposal.proposalId} must have exactly one ${relationship} claim for ${sourceId}`);
  return {sourceId, relationship, claim: matches[0].claim};
};
