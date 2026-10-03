import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  compareReferenceProfile,
  ReferenceProfileError,
  validateReferenceCatalog,
  validateReferenceProfile
} from '../packages/worldview/reference-profiles.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readText = path => readFile(resolve(root, path), 'utf8');
const readJson = async path => JSON.parse(await readText(path));
const current = await readJson('data/current.json');
const referenceCurrent = await readJson('data/reference/current.json');
const catalogIndex = await readJson('data/reference/catalog-index.json');
const model = await readJson(current.worldviewModel.path);
const routes = await readJson(current.progressiveDepth.path);
const catalog = await readJson(referenceCurrent.catalogPath);
const historicalCatalog = await readJson('data/reference/reference-profiles-v1.0.0.json');
const historicalCatalog11 = await readJson('data/reference/reference-profiles-v1.1.0.json');

assert.equal(validateReferenceCatalog({ catalog, model, routes }), true);
assert.equal(catalog.profiles.length, 8);
assert.equal(catalog.publicationStatus, 'internal_only');
assert.equal(catalog.profileModelVersion, 'reference-profile-model-1.2.0');
assert.equal(catalog.sourceLedgerVersion, 'reference-profile-sources-1.2.0');
assert.equal(referenceCurrent.catalogVersion, catalog.catalogVersion);
assert.equal(catalogIndex.currentCatalogVersion, catalog.catalogVersion);
assert.equal(catalogIndex.catalogPath, referenceCurrent.catalogPath);
assert.equal(current.worldviewModel.version, catalog.modelVersion);
assert.equal(current.progressiveDepth.version, catalog.routePolicyVersion);
assert.equal(historicalCatalog.catalogVersion, 'reference-profile-catalog-1.0.0');
assert.equal(historicalCatalog.profiles.length, 5, 'The released 1.0.0 reference catalog must remain unchanged.');
assert.equal(historicalCatalog11.profiles.length, 7, 'The released 1.1.0 reference catalog must remain unchanged.');
assert.ok(!historicalCatalog11.profiles.some(profile=>/mill/i.test(profile.id)),
  'The 1.19-era reference catalog must retain its historical no-Mill boundary.');
assert.ok(!Object.hasOwn(current, 'referenceProfiles'), 'Reference profiles must not be added to the public production pointer.');

const profiles = new Map(catalog.profiles.map(profile => [profile.id, profile]));
const egoismProfile = profiles.get('ethical-egoism-exclusive-self-priority-scoped');
assert.ok(egoismProfile, 'The scoped ethical-egoism criterion must be present.');
assert.deepEqual(egoismProfile.claims.map(claim => claim.propositionId), ['construct-NE15']);
assert.deepEqual(egoismProfile.claims[0].routeAvailability, ['full']);
assert.equal(egoismProfile.claims[0].mappingStatus, 'ROUTE_LIMITED');
assert.ok(egoismProfile.unmeasuredAreas.some(value => /maximizing if-and-only-if/i.test(value)),
  'The standard maximizing ethical-egoism criterion must remain explicitly unmeasured.');

const randProfile = profiles.get('ayn-rand-life-grounded-ethics-scoped');
assert.ok(randProfile, 'The scoped Rand life-grounded ethics criterion must be present.');
assert.deepEqual(randProfile.claims.map(claim => claim.propositionId), ['construct-ME09']);
assert.deepEqual(randProfile.claims[0].routeAvailability, ['full']);
assert.equal(randProfile.claims[0].mappingStatus, 'ROUTE_LIMITED');
for (const unresolved of ['rational self-interest', 'epistemology', 'rights']) {
  assert.ok(randProfile.unmeasuredAreas.some(value => value.toLowerCase().includes(unresolved)),
    `Rand's unresolved ${unresolved} distinction must remain unmeasured.`);
}
const millProfile = profiles.get('john-stuart-mill-general-happiness-scoped');
assert.ok(millProfile, 'The successor reference catalog must contain the scoped Mill NE26 comparison.');
assert.deepEqual(millProfile.claims.map(claim=>claim.propositionId),
  ['reviewed-NE26-general-happiness-ultimate-standard']);
assert.deepEqual(millProfile.claims[0].routeAvailability,['full']);
assert.equal(millProfile.claims[0].mappingStatus,'ROUTE_LIMITED');
assert.equal(millProfile.identityOutputAllowed,false);
assert.equal(millProfile.percentageMatchAllowed,false);
assert.ok(millProfile.nonEntailments.some(value=>/act-utilitarian/i.test(value)));
assert.ok(millProfile.nonEntailments.some(value=>/rule-utilitarian/i.test(value)));

const scopedFullReport = {
  modelVersion: model.modelVersion,
  routePolicyVersion: routes.policyVersion,
  routeId: 'full',
  commitments: [
    { commitmentId: 'construct-NE15', state: 'supported' },
    { commitmentId: 'construct-ME09', state: 'supported' }
  ],
  derived: []
};
for (const candidate of [egoismProfile, randProfile]) {
  const fullScopedComparison = compareReferenceProfile({
    profile: candidate, model, routes, routeId: 'full', report: scopedFullReport, referenceSources: catalog.sources
  });
  assert.equal(fullScopedComparison.claims[0].relation, 'overlap');
  const standardScopedComparison = compareReferenceProfile({
    profile: candidate,
    model,
    routes,
    routeId: 'standard',
    report: { ...scopedFullReport, routeId: 'standard' },
    referenceSources: catalog.sources
  });
  assert.equal(standardScopedComparison.claims[0].relation, 'not_measured',
    `${candidate.id}: Standard-route omission must remain not measured.`);
}

const profile = profiles.get('charles-s-peirce-scoped-commitments');
const maximClaim = profile.claims.find(claim => claim.propositionId === 'construct-EP16');
const fallibilismClaim = profile.claims.find(claim => claim.propositionId === 'construct-EP15');
assert.deepEqual(maximClaim.routeAvailability, ['full']);
assert.deepEqual(fallibilismClaim.routeAvailability, ['standard', 'full']);
assert.equal(maximClaim.mappingStatus, 'ROUTE_LIMITED');
assert.equal(fallibilismClaim.mappingStatus, 'ROUTE_LIMITED');

const supportedReport = {
  modelVersion: model.modelVersion,
  routePolicyVersion: routes.policyVersion,
  routeId: 'quick',
  commitments: [
    { commitmentId: 'construct-EP16', state: 'supported' },
    { commitmentId: 'construct-EP15', state: 'supported' }
  ],
  derived: []
};
const quickComparison = compareReferenceProfile({ profile, model, routes, routeId: 'quick', report: supportedReport, referenceSources: catalog.sources });
assert.equal(quickComparison.claims.find(claim => claim.id === maximClaim.id).observedState, 'not_measured',
  'A proposition omitted from Quick must stay not measured even if an unrelated/full-route report contains a state.');
assert.equal(quickComparison.claims.find(claim => claim.id === maximClaim.id).relation, 'not_measured');
assert.equal(quickComparison.claims.find(claim => claim.id === fallibilismClaim.id).observedState, 'not_measured');
assert.equal('aggregateScore' in quickComparison, false);
assert.equal('publicIdentityLabel' in quickComparison, false);
assert.equal(quickComparison.percentageMatchAllowed, undefined);

const standardReport = { ...supportedReport, routeId: 'standard' };
const standardComparison = compareReferenceProfile({ profile, model, routes, routeId: 'standard', report: standardReport, referenceSources: catalog.sources });
assert.equal(standardComparison.claims.find(claim => claim.id === fallibilismClaim.id).relation, 'overlap');
assert.equal(standardComparison.claims.find(claim => claim.id === maximClaim.id).relation, 'not_measured');

const fullReport = { ...supportedReport, routeId: 'full' };
const fullComparison = compareReferenceProfile({ profile, model, routes, routeId: 'full', report: fullReport, referenceSources: catalog.sources });
assert.equal(fullComparison.claims.find(claim => claim.id === maximClaim.id).relation, 'overlap');

const notPresentedReport = { ...fullReport, commitments: [] };
const notPresented = compareReferenceProfile({ profile, model, routes, routeId: 'full', report: notPresentedReport, referenceSources: catalog.sources });
assert.equal(notPresented.claims.find(claim => claim.id === maximClaim.id).observedState, 'not_measured');
const insufficientReport = { ...fullReport, commitments: [{ commitmentId: 'construct-EP16', state: 'insufficient_evidence' }] };
const insufficient = compareReferenceProfile({ profile, model, routes, routeId: 'full', report: insufficientReport, referenceSources: catalog.sources });
assert.equal(insufficient.claims.find(claim => claim.id === maximClaim.id).observedState, 'insufficient_evidence');
assert.equal(insufficient.claims.find(claim => claim.id === maximClaim.id).relation, 'insufficient_evidence');

const unrelatedMutation = structuredClone(fullReport);
unrelatedMutation.commitments.push({ commitmentId: 'unrelated-test-proposition', state: 'opposed' });
const afterUnrelatedMutation = compareReferenceProfile({ profile, model, routes, routeId: 'full', report: unrelatedMutation, referenceSources: catalog.sources });
assert.deepEqual(afterUnrelatedMutation.claims, fullComparison.claims,
  'An unrelated proposition must not change this reference profile comparison.');

const unknownProposition = structuredClone(profile);
unknownProposition.claims[0].propositionId = 'construct-does-not-exist';
assert.throws(() => validateReferenceProfile({ profile: unknownProposition, model, routes, referenceSources: catalog.sources }), ReferenceProfileError);

const duplicateClaim = structuredClone(profile);
duplicateClaim.claims[1].id = duplicateClaim.claims[0].id;
assert.throws(() => validateReferenceProfile({ profile: duplicateClaim, model, routes, referenceSources: catalog.sources }), /unique/);

const hypothesisAsCore = structuredClone(profile);
hypothesisAsCore.claims[0].evidenceBasis = 'editorial_hypothesis';
assert.throws(() => validateReferenceProfile({ profile: hypothesisAsCore, model, routes, referenceSources: catalog.sources }), /hypotheses cannot participate/);

const partialPromotedToDirect = structuredClone(profile);
partialPromotedToDirect.claims[0].mappingStatus = 'DIRECT';
assert.throws(() => validateReferenceProfile({ profile: partialPromotedToDirect, model, routes, referenceSources: catalog.sources }), /mapping status does not match route availability/);

const noLocator = structuredClone(profile);
delete noLocator.claims[0].sourceClaims[0].locator;
assert.throws(() => validateReferenceProfile({ profile: noLocator, model, routes, referenceSources: catalog.sources }), /exact locator/);

for (const candidate of catalog.profiles) {
  assert.ok(candidate.limitations.length > 0, `${candidate.id} must state profile limitations.`);
  assert.ok(candidate.unmeasuredAreas.length > 0, `${candidate.id} must state unmeasured areas.`);
  for (const claim of candidate.claims) {
    assert.ok(claim.limitations.length > 0, `${candidate.id}/${claim.id} must state claim limitations.`);
    assert.ok(claim.sourceClaims.every(sourceClaim => sourceClaim.locator), `${candidate.id}/${claim.id} must have source locators.`);
  }
}

const forbiddenOutputKeys = new Set(['matchPercentage', 'aggregateScore', 'score', 'similarity', 'nearestProfile', 'winner', 'assignedIdentity']);
const inspectOutput = value => {
  if (Array.isArray(value)) return value.forEach(inspectOutput);
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assert.ok(!forbiddenOutputKeys.has(key), `Comparison output contains forbidden key ${key}.`);
    inspectOutput(child);
  }
};
inspectOutput(fullComparison);

const generatedPaths = [
  referenceCurrent.manifestPath,
  'data/reference/current.json',
  referenceCurrent.reportPath
];
const buildInIsolatedWorkspace = async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'worldview-reference-profile-'));
  try {
    for (const directory of ['data', 'docs', 'packages', 'scripts']) {
      await cp(resolve(root, directory), resolve(workspace, directory), { recursive: true });
    }
    execFileSync(process.execPath, ['scripts/build-reference-profile-release.mjs'], { cwd: workspace, stdio: 'inherit' });
    return await Promise.all(generatedPaths.map(path => readFile(resolve(workspace, path), 'utf8')));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
};
const firstBuild = await buildInIsolatedWorkspace();
const secondBuild = await buildInIsolatedWorkspace();
assert.deepEqual(secondBuild, firstBuild, 'Reference-profile release generation must be deterministic.');

const manifest = await readJson(referenceCurrent.manifestPath);
assert.equal(manifest.components.worldviewModel.version, model.modelVersion);
assert.equal(manifest.components.progressiveRoutes.version, routes.policyVersion);
assert.deepEqual(manifest.profileIds, catalog.profiles.map(candidate => candidate.id));

console.log('Reference-profile catalog: source, exact proposition, route, limitation, privacy boundary, and deterministic release checks passed.');
