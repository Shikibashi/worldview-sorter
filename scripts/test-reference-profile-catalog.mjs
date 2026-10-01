import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
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
const model = await readJson(current.worldviewModel.path);
const routes = await readJson(current.progressiveDepth.path);
const catalog = await readJson('data/reference/reference-profiles-v1.0.0.json');

assert.equal(validateReferenceCatalog({ catalog, model, routes }), true);
assert.equal(catalog.profiles.length, 5);
assert.equal(catalog.publicationStatus, 'internal_only');
assert.equal(catalog.profileModelVersion, 'reference-profile-model-1.0.0');
assert.equal(catalog.sourceLedgerVersion, 'reference-profile-sources-1.0.0');
assert.equal(current.worldviewModel.version, catalog.modelVersion);
assert.equal(current.progressiveDepth.version, catalog.routePolicyVersion);
assert.ok(!Object.hasOwn(current, 'referenceProfiles'), 'Reference profiles must not be added to the public production pointer.');

const profiles = new Map(catalog.profiles.map(profile => [profile.id, profile]));
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
  'data/reference/manifest-v1.0.0.json',
  'data/reference/current.json',
  'docs/reference-profiles-v1.0.0.md'
];
execFileSync(process.execPath, ['scripts/build-reference-profile-release.mjs'], { cwd: root, stdio: 'ignore' });
const firstBuild = await Promise.all(generatedPaths.map(readText));
execFileSync(process.execPath, ['scripts/build-reference-profile-release.mjs'], { cwd: root, stdio: 'ignore' });
const secondBuild = await Promise.all(generatedPaths.map(readText));
assert.deepEqual(secondBuild, firstBuild, 'Reference-profile release generation must be deterministic.');

const manifest = await readJson('data/reference/manifest-v1.0.0.json');
assert.equal(manifest.components.worldviewModel.version, model.modelVersion);
assert.equal(manifest.components.progressiveRoutes.version, routes.policyVersion);
assert.deepEqual(manifest.profileIds, catalog.profiles.map(candidate => candidate.id));

console.log('Reference-profile catalog: source, exact proposition, route, limitation, privacy boundary, and deterministic release checks passed.');
