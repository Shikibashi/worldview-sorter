// Successor release builder for model-release-1.20.0: Mill general-happiness canary.
// Publishes exactly NEI134@1 and NEI135@1 and one interpretation-neutral direct proposition:
// reviewed-NE26-general-happiness-ultimate-standard.
// Single-sources proposition and claim text from approved proposal MCP-2026-094.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  lineageFromCurrent,
  successorPaths,
  StagedWrites,
  reviewedProposal
} from '../packages/governance/successor.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const hash = async file => createHash('sha256').update(await readFile(path.join(root, file))).digest('hex');
const insertAfter = (arr, anchorId, item) => {
  const index = arr.findIndex(r => r.itemId === anchorId);
  assert.ok(index >= 0, 'Anchor item not found in route: ' + anchorId);
  arr.splice(index + 1, 0, item);
};

const current = await read('data/current.json');
assert.equal(current.modelRelease.version, 'model-release-1.19.0', 'Canary release must build on model-release-1.19.0');

const oldPaths = await lineageFromCurrent(root, current);
const nextPaths = successorPaths(oldPaths);

const depthManifest = 'data/experience/progressive-depth-v2.8.manifest.json';
const affinityManifest = 'data/affinities/manifest-v2.8.json';
const localizationManifest = 'data/localization/manifest-v2.8.json';
const localizationBundle = 'data/localization/en-US-v19.json';

const proposal = await reviewedProposal(root, 'MCP-2026-094');
const millProposition = proposal.philosophicalBasis.proposition;
const millRuleId = 'reviewed-NE26-general-happiness-ultimate-standard';

const millSources = [
  {
    id: 'primary-mill-utilitarianism-ch2',
    kind: 'primary_source',
    title: 'John Stuart Mill, Utilitarianism, Chapter II',
    url: 'https://www.gutenberg.org/files/11224/11224-h/11224-h.htm',
    use: 'Chapter II: Greatest Happiness Principle, secondary principles, conflicts of obligation, and the ultimate standard.',
    evidenceType: 'primary_text',
    access: 'text_reviewed',
    reviewedOn: '2026-10-03',
    reuse: 'Doctrinal source only; no questionnaire wording copied and no item validity inferred.'
  },
  {
    id: 'sep-mill-moral-political',
    kind: 'academic',
    title: "Stanford Encyclopedia of Philosophy: Mill's Moral and Political Philosophy",
    url: 'https://plato.stanford.edu/entries/mill-moral-political/',
    use: 'Sections 2.6–2.10 on the utilitarian first principle, decision procedure, secondary principles, and competing reconstructions.',
    evidenceType: 'signed_scholarly_synthesis',
    access: 'text_reviewed',
    reviewedOn: '2026-10-03',
    reuse: 'Interpretive boundary only; no questionnaire wording copied and no item validity inferred.'
  },
  {
    id: 'sep-utilitarianism-history',
    kind: 'academic',
    title: 'Stanford Encyclopedia of Philosophy: The History of Utilitarianism',
    url: 'https://plato.stanford.edu/entries/utilitarianism-history/',
    use: 'Sections 2 and 4 on classical utilitarianism and the contested act-versus-rule status of Mill’s view.',
    evidenceType: 'signed_scholarly_synthesis',
    access: 'text_reviewed',
    reviewedOn: '2026-10-03',
    reuse: 'Scholarly context only; no questionnaire wording copied and no item validity inferred.'
  }
];

const nei134 = {
  id: 'NEI134',
  revision: 1,
  domainId: 'NE',
  text: 'When moral rules or duties conflict and no more specific principle settles the case, which standard should have final authority?',
  responseType: 'single_choice',
  responseScaleId: 'single_choice',
  status: 'candidate',
  contentKind: 'contrast',
  targets: [{constructId: 'NE26', relation: 'diagnostic', role: 'primary'}],
  options: [
    {id: 'general_happiness', label: 'The general happiness of everyone affected, whether applied directly or through rules justified by their effects on happiness.'},
    {id: 'independent_authority', label: 'A right or duty can have final authority independently of its effects on general happiness.'},
    {id: 'plural_ultimate', label: 'Several moral values can be ultimate, so no single standard always decides the conflict.'},
    {id: 'other', label: 'Another view or a view not listed.'}
  ],
  mirrorGroup: null,
  scenarioGroup: 'general-happiness-ultimate-standard',
  eligibility: {mode: 'always'},
  specialStates: ['no_view', 'not_understood'],
  contentTags: ['mill_general_happiness', 'ultimate_standard'],
  provenance: {
    origin: 'original_project_research_design',
    sourceRefs: millSources.map(x => x.id),
    license: {status: 'undecided', spdx: null},
    copiedText: false
  },
  notes: 'Tests whether general happiness serves as the ultimate moral standard when secondary rules conflict, without selecting an act-versus-rule implementation.'
};

const nei135 = {
  id: 'NEI135',
  revision: 1,
  domainId: 'NE',
  text: 'A familiar moral rule is normally useful. Suppose careful evidence shows that revising it would better promote the general happiness, but people disagree on whether the old rule has moral authority independent of that happiness. Which view is closest to yours?',
  responseType: 'single_choice',
  responseScaleId: 'single_choice',
  status: 'candidate',
  contentKind: 'vignette',
  targets: [{constructId: 'NE26', relation: 'diagnostic', role: 'primary'}],
  options: [
    {id: 'happiness_controls', label: 'General happiness ultimately controls which rule is justified, even if stable rules usually guide conduct without fresh calculation.'},
    {id: 'independent_rule_authority', label: 'The old rule can remain morally authoritative for a reason that does not ultimately depend on general happiness.'},
    {id: 'plural_balance', label: 'General happiness and independent moral considerations are both fundamental; neither has final authority in every such conflict.'},
    {id: 'other', label: 'Another view or a view not listed.'}
  ],
  mirrorGroup: null,
  scenarioGroup: 'secondary-principle-ultimate-ground',
  eligibility: {mode: 'always'},
  specialStates: ['no_view', 'not_understood'],
  contentTags: ['mill_general_happiness', 'secondary_principles'],
  provenance: {
    origin: 'original_project_research_design',
    sourceRefs: millSources.map(x => x.id),
    license: {status: 'undecided', spdx: null},
    copiedText: false
  },
  notes: 'Tests whether secondary rules ultimately derive authority from general happiness while remaining neutral on the immediate act-versus-rule criterion.'
};

// 1. Candidate item bank (0.20.0)
const bank = await read(oldPaths.bank);
assert.equal(bank.bankVersion, '0.19.0');
assert.equal(bank.items.length, 575);
assert.ok(!bank.items.some(r => r.id === 'NEI134' || r.id === 'NEI135'));
bank.bankVersion = '0.20.0';
bank.items.push(nei134, nei135);

// 2. Construct registry (0.9.0)
const registry = await read(oldPaths.registry);
assert.equal(registry.registryVersion, '0.8.0');
assert.ok(!registry.constructs.some(r => r.id === 'NE26'));
registry.registryVersion = '0.9.0';
registry.constructs.push({
  id: 'NE26',
  domainId: 'NE',
  name: 'General happiness as ultimate moral standard',
  type: 'categorical',
  tier: 'diagnostic',
  description: 'Whether general happiness has final justificatory authority when moral rules, duties, or judgments conflict, without selecting an act-versus-rule implementation.',
  candidateItemTarget: 2,
  outputMode: 'branch_classification',
  evidenceBasis: millSources.map(x => x.id),
  prerequisites: [],
  measurementStatus: 'provisional',
  directlyScored: true
});

// 3. Source registry (1.13.0)
const sources = await read(oldPaths.sources);
sources.version = 'source-registry-1.13.0';
for (const source of millSources) {
  assert.ok(!sources.sources.some(r => r.id === source.id));
  sources.sources.push(source);
}

// 4. Source ledger (0.21.0)
const ledger = await read(oldPaths.ledger);
ledger.version = '0.21.0';
for (const source of millSources) {
  ledger.sources.push({
    ...source,
    useByRules: [millRuleId],
    useByConstructs: ['NE26'],
    useByItems: ['NEI134', 'NEI135'],
    permissionToCopyItems: false,
    validatesOurItems: false,
    sourceRole: source.evidenceType === 'primary_text' ? 'primary_text' : 'signed_scholarly_synthesis',
    detailedUseLimit: 'Supports the stated philosophical distinction only; it does not validate item wording, thresholds, route placement, comprehension, or psychometrics.'
  });
}

// 5. Model commitments & coverage (generic-1.17.0-pilot)
const model = await read(oldPaths.model);
model.parentModelVersion = model.modelVersion;
model.modelVersion = 'generic-1.17.0-pilot';
model.bankVersion = bank.bankVersion;
model.registryVersion = registry.registryVersion;
model.pilotInstrumentVersion = 'worldview-pilot-1.11.0';
model.sources.push(...millSources);

const millRule = {
  id: millRuleId,
  constructId: 'NE26',
  label: 'General happiness as ultimate moral standard',
  facetId: 'ethics-foundations',
  domainId: 'NE',
  layer: 'normative',
  tier: 'diagnostic',
  sourceIds: millSources.map(x => x.id),
  sourceClaims: proposal.sourceClaims,
  neighbors: proposal.philosophicalBasis.neighboringViews,
  nonEntailments: proposal.philosophicalBasis.nonEntailments,
  falsePositives: [
    'Alternative non-utilitarian justifications for secondary rules',
    'Pluralist views that give general happiness substantial but non-ultimate weight'
  ],
  scope: millProposition,
  proposition: millProposition,
  minimumEvidenceUnits: 2,
  evidence: [
    {itemId: 'NEI134', itemRevision: 1, unitId: 'NEI134', support: ['general_happiness'], oppose: ['independent_authority', 'plural_ultimate']},
    {itemId: 'NEI135', itemRevision: 1, unitId: 'NEI135', support: ['happiness_controls'], oppose: ['independent_rule_authority', 'plural_balance']}
  ],
  resultsSemantics: {
    supported: 'supported',
    opposed: 'opposed',
    qualifiedSupport: 'leaned_toward',
    qualifiedOppose: 'leaned_toward',
    singleDirectionalUnit: 'leaned_toward',
    conflictingDirectionalUnits: 'mixed_context_dependent'
  }
};
model.commitments.push(millRule);
model.commitments.sort((a, b) => a.id.localeCompare(b.id));
model.publicRuleIds = [...new Set([...model.publicRuleIds, millRuleId])].sort();
model.coverage.version = '0.20.0';
model.coverage.constructs.push({
  id: 'NE26',
  name: 'General happiness as ultimate moral standard',
  domainId: 'NE',
  type: 'categorical',
  tier: 'diagnostic',
  declaredSources: millSources.map(x => x.id),
  ruleIds: [millRuleId],
  candidateItemIds: ['NEI134', 'NEI135'],
  status: 'scoped_direct_rule_only',
  disposition: 'directly_interpretable',
  coverageGap: 'Mill’s ultimate-standard thesis is tested independently of the act-versus-rule decision procedure.'
});
model.coverage.constructs.sort((a, b) => a.id.localeCompare(b.id));

// 6. Full route form policy (philosophy-pilot-1.17.0, size 251)
const full = await read(oldPaths.full);
full.parentPolicyVersion = full.policyVersion;
full.policyVersion = 'philosophy-pilot-1.17.0';
full.bankVersion = bank.bankVersion;
full.registryVersion = registry.registryVersion;
full.instrumentVersion = model.pilotInstrumentVersion;
full.modelVersion = model.modelVersion;

insertAfter(full.frozenItems, 'VAI020', {itemId: 'NEI134', itemRevision: 1});
insertAfter(full.frozenItems, 'VAI036', {itemId: 'NEI135', itemRevision: 1});
assert.equal(full.frozenItems.length, 251);
full.sizes = [251];
model.pilotRouteItemRefs = structuredClone(full.frozenItems);

const ruleByItem = new Map();
for (const rule of model.commitments) {
  for (const evidence of rule.evidence ?? []) {
    const list = ruleByItem.get(evidence.itemId) ?? [];
    list.push(rule.id);
    ruleByItem.set(evidence.itemId, list);
  }
}
model.coverage.items = bank.items.map(item => ({
  itemId: item.id,
  itemRevision: item.revision,
  sourceIds: item.provenance?.sourceRefs ?? [],
  ruleIds: (ruleByItem.get(item.id) ?? []).sort(),
  status: (ruleByItem.get(item.id) ?? []).length ? 'explicit_mapping_only' : 'not_used_for_profile_inference',
  sourceValidationTransferred: false,
  publicFormExcluded: !full.frozenItems.some(ref => ref.itemId === item.id && ref.itemRevision === item.revision)
}));

full.bundles.push({
  id: millRule.id + ':full-route',
  commitmentId: millRule.id,
  domainId: millRule.domainId,
  itemIds: millRule.evidence.map(x => x.itemId),
  itemRevisions: millRule.evidence.map(x => x.itemRevision),
  evidenceUnits: millRule.evidence.map(x => x.unitId)
});
const facet = full.facets.find(row => row.id === millRule.facetId);
assert.ok(facet, 'Missing facet ' + millRule.facetId);
facet.ruleIds = [...new Set([...facet.ruleIds, millRule.id])].sort();
facet.bundleIds = [...new Set([...(facet.bundleIds ?? []), millRule.id + ':full-route'])].sort();

// 7. Progressive depth policy (progressive-depth-2.8.0)
const depth = await read(oldPaths.depth);
depth.policyVersion = 'progressive-depth-2.8.0';
depth.bankVersion = bank.bankVersion;
depth.modelVersion = model.modelVersion;
depth.instrumentVersion = model.pilotInstrumentVersion;
depth.pilotFormPolicyVersion = full.policyVersion;
depth.affinityCatalogVersion = 'philosophical-affinity-2.8.0';
depth.selectionBasis = 'Quick and Standard retain their exact 64/120 item references. Full adds two widely separated references for the general-happiness ultimate standard proposition.';
for (const route of depth.routes) {
  route.routeVersion = route.id + '-2.8.0';
  if (route.id === 'full') {
    route.itemRefs = structuredClone(full.frozenItems);
    route.size = 251;
    route.description = '251 questions; the broadest authored coverage, adding the source-reviewed general happiness ultimate moral standard criterion.';
    route.assessableDirectRuleIds = [...new Set([...route.assessableDirectRuleIds, millRuleId])].sort();
    route.burden.items = 251;
  }
}

// 8. Research pool (0.20.0-research, 577 entries)
const research = await read(oldPaths.research);
research.instrumentVersion = '0.20.0-research';
research.bankVersion = bank.bankVersion;
research.registryVersion = registry.registryVersion;
research.nominalPoolSize = bank.items.length;
research.entries = bank.items.map((row, index) => ({index, itemId: row.id, itemRevision: row.revision}));

// 9. Runtime pilot (pilot-0.13)
const runtime = await read(oldPaths.runtime);
runtime.pilotId = 'pilot-0.13';
runtime.bankVersion = bank.bankVersion;
runtime.sourceInstrumentVersion = research.instrumentVersion;
runtime.administration.note += ' The 0.20 research pool adds NEI134@1 and NEI135@1; the direct evidence path is Full-only.';

// 10. Worldview pilot instrument (worldview-pilot-1.11.0, 251 entries)
const instrument = await read(oldPaths.instrument);
instrument.instrumentVersion = model.pilotInstrumentVersion;
instrument.bankVersion = bank.bankVersion;
instrument.registryVersion = registry.registryVersion;
instrument.nominalPoolSize = 251;
instrument.entries = full.frozenItems.map((ref, index) => ({index, ...ref}));

// 11. Content review (pilot-content-review-1.11.0)
const review = await read(oldPaths.review);
review.reviewVersion = 'pilot-content-review-1.11.0';
review.sourceFormPolicyVersion = full.policyVersion;
review.frozenAssignedItems = 251;
review.repeatedWordingAndDependenceGroups.push({
  id: 'ne26-general-happiness-standard',
  itemIds: ['NEI134', 'NEI135'],
  note: 'Distinct first-principle conflict and secondary-rule revision tasks; no psychometric independence claimed.'
});
for (const [id, rev, domainId, targetConstructIds, mappedRuleIds, contribution] of [
  ['NEI134', 1, 'NE', ['NE26'], [millRuleId], 'ultimate_standard_conflict'],
  ['NEI135', 1, 'NE', ['NE26'], [millRuleId], 'secondary_principle_revision']
]) {
  const position = full.frozenItems.findIndex(r => r.itemId === id) + 1;
  review.decisions.push({
    sourcePosition: position,
    itemId: id,
    itemRevision: rev,
    domainId,
    targetConstructIds,
    mappedRuleIds,
    nearbyRouteItemIds: [],
    responseMethod: bank.items.find(r => r.id === id).responseType,
    contribution,
    decision: 'retain_for_pilot',
    issue: null,
    rationale: 'Adds one governed unit for the source-reviewed general happiness ultimate standard proposition.',
    resultUse: 'only_through_explicit_interpretation_rules'
  });
}

// 12. Affinity catalog (philosophical-affinity-2.8.0)
const catalog = await read(oldPaths.catalog);
catalog.catalogVersion = 'philosophical-affinity-2.8.0';
catalog.modelVersion = model.modelVersion;
catalog.instrumentVersion = model.pilotInstrumentVersion;
// 13. Localization (catalog-v19, en-US-v19)
const localization = await read(oldPaths.localization);
localization.catalogVersion = 'localization-catalog-2.8.0';
localization.canonicalBankVersion = bank.bankVersion;
localization.modelVersion = model.modelVersion;
localization.affinityCatalogVersion = catalog.catalogVersion;
const enBundle = await read('data/localization/en-US-v18.json');
enBundle.bundleVersion = 'localization-en-US-2.8.0';
enBundle.bankVersion = bank.bankVersion;
enBundle.modelVersion = model.modelVersion;
enBundle.affinityCatalogVersion = catalog.catalogVersion;
localization.locales[0] = {...localization.locales[0], bundleVersion: enBundle.bundleVersion, path: localizationBundle};

// 14. Pilot candidate (pilot-candidate-1.17.0)
const pilot = await read(oldPaths.pilot);
pilot.pilotCandidateVersion = 'pilot-candidate-1.17.0';
pilot.itemBank = {version: bank.bankVersion, path: nextPaths.bank};
pilot.constructRegistry = {version: registry.registryVersion, path: nextPaths.registry};
pilot.route.version = full.policyVersion;
pilot.route.path = nextPaths.full;
pilot.route.instrumentVersion = model.pilotInstrumentVersion;
pilot.route.instrumentManifestPath = nextPaths.instrument;
pilot.route.assignedItems = 251;
pilot.route.exactItemRevisions = structuredClone(full.frozenItems);
pilot.route.domainCounts.NE += 2;
pilot.interpretationRules.version = model.modelVersion;
pilot.interpretationRules.path = nextPaths.model;
pilot.interpretationRules.directRuleIds = [...new Set([...pilot.interpretationRules.directRuleIds, millRuleId])].sort();
pilot.interpretationRules.routeMeasuredDirectRuleIds = [...new Set([...pilot.interpretationRules.routeMeasuredDirectRuleIds, millRuleId])].sort();
pilot.contentReview = {version: review.reviewVersion, path: nextPaths.review};
pilot.limitations.push('The general happiness ultimate moral standard is a scoped two-item authored proposition; it is not a complete utilitarian identity.');

// 15. Academic release (0.20.0)
const academic = await read(oldPaths.academic);
academic.version = '0.20.0';
academic.registryVersion = registry.registryVersion;
academic.baseBankVersion = bank.bankVersion;
academic.reviewedOn = '2026-10-03';
academic.itemCount = bank.items.length;
academic.newItemCount = 2;
academic.registryEntries = registry.constructs.length;
academic.activeConstructCount = registry.constructs.filter(row => row.measurementStatus !== 'deprecated').length;
academic.newConstructCount = 1;
academic.note = 'Adds two original candidate items and one scoped direct proposition for general happiness as ultimate moral standard. No whole utilitarian identity or affinity mapping is inferred.';

// 16. Quiz experience policy (quiz-1.24.0)
const experience = await read(oldPaths.experience);
experience.experienceVersion = 'quiz-1.24.0';
const fullRoute = experience.routes.find(r => r.id === 'full');
fullRoute.size = 251;
fullRoute.description = '251 questions; broadest coverage, adding the scoped general happiness ultimate moral standard criterion.';
for (const route of experience.routes) route.formPolicyVersion = route.id === 'full' ? full.policyVersion : depth.policyVersion;
experience.formPolicies.push({version: full.policyVersion, path: nextPaths.full}, {version: depth.policyVersion, path: nextPaths.depth});
experience.modelPolicies.push({version: model.modelVersion, path: nextPaths.model});
experience.pilotCandidate = {version: pilot.pilotCandidateVersion, path: nextPaths.pilot};
experience.progressivePolicy = {version: depth.policyVersion, path: nextPaths.depth, manifestPath: depthManifest};
experience.localizationCatalogVersion = localization.catalogVersion;
experience.localizationCatalogPath = nextPaths.localization;
experience.routeLengthMeaning = 'Quick and Standard retain their exact 64/120 item references. Full adds two complementary authored items for the general-happiness ultimate standard criterion, reaching 251 questions. This is authored coverage policy, not calibrated information.';

// 17. Release channels (worldview-release-channels-21.0.0)
const channels = await read(oldPaths.channels);
channels.configVersion = 'worldview-release-channels-21.0.0';
for (const ch of Object.values(channels.channels)) ch.modelReleaseVersion = 'model-release-1.20.0';

// 18. Reference profiles (reference-profile-catalog-1.2.0)
const ref = await read(oldPaths.reference);
ref.catalogVersion = 'reference-profile-catalog-1.2.0';
ref.profileModelVersion = 'reference-profile-model-1.2.0';
ref.sourceLedgerVersion = 'reference-profile-sources-1.2.0';
ref.modelVersion = model.modelVersion;
ref.routePolicyVersion = depth.policyVersion;
for (const profile of ref.profiles) {
  profile.modelVersion = model.modelVersion;
  if (profile.schemaVersion === '1.1.0') profile.routePolicyVersion = depth.policyVersion;
}

// Stage all immutable writes first
const staged = new StagedWrites(root);
staged.create(nextPaths.bank, bank);
staged.create(nextPaths.registry, registry);
staged.create(nextPaths.sources, sources);
staged.create(nextPaths.ledger, ledger);
staged.create(nextPaths.model, model);
staged.create(nextPaths.full, full);
staged.create(nextPaths.depth, depth);
staged.create(nextPaths.research, research);
staged.create(nextPaths.runtime, runtime);
staged.create(nextPaths.instrument, instrument);
staged.create(nextPaths.review, review);
staged.create(nextPaths.catalog, catalog);
staged.create(localizationBundle, enBundle);
staged.create(nextPaths.localization, localization);
staged.create(nextPaths.pilot, pilot);
staged.create(nextPaths.academic, academic);
staged.create(nextPaths.experience, experience);
staged.create(nextPaths.channels, channels);
staged.create(nextPaths.reference, ref);

// Stage manifests
await staged.commit();

// Compute hashes for manifests
const localizationHashes = {
  [nextPaths.localization]: await hash(nextPaths.localization),
  [localizationBundle]: await hash(localizationBundle)
};
// 19. Readiness audit (reference-readiness-audit-2.0.0)
const readiness = await read(oldPaths.readiness);
readiness.auditVersion = 'reference-readiness-audit-2.0.0';
readiness.baseline.candidateBank = {version: bank.bankVersion, path: nextPaths.bank, sha256: await hash(nextPaths.bank)};
readiness.baseline.worldviewModel = {version: model.modelVersion, path: nextPaths.model, sha256: await hash(nextPaths.model)};
readiness.baseline.sourceLedger = {version: ledger.version, path: nextPaths.ledger, sha256: await hash(nextPaths.ledger)};
readiness.baseline.affinityCatalog = {version: catalog.catalogVersion, path: nextPaths.catalog, sha256: await hash(nextPaths.catalog)};
readiness.baseline.progressiveRoutes = {version: depth.policyVersion, path: nextPaths.depth, sha256: await hash(nextPaths.depth)};

const stagedManifests = new StagedWrites(root);
stagedManifests.create(nextPaths.readiness, readiness);
stagedManifests.create(depthManifest, {schemaVersion: 'immutable-content-manifest-1', policyVersion: depth.policyVersion, path: nextPaths.depth, sha256: await hash(nextPaths.depth)});
stagedManifests.create(affinityManifest, {schemaVersion: 'immutable-content-manifest-1', catalogVersion: catalog.catalogVersion, path: nextPaths.catalog, sha256: await hash(nextPaths.catalog)});
stagedManifests.create(localizationManifest, {schemaVersion: 'worldview-localization-manifest-1', catalogVersion: localization.catalogVersion, hashes: localizationHashes});

// Update pilot frozen hashes
pilot.frozenArtifactHashes = {
  [nextPaths.review]: await hash(nextPaths.review),
  [nextPaths.instrument]: await hash(nextPaths.instrument),
  [nextPaths.model]: await hash(nextPaths.model),
  [nextPaths.full]: await hash(nextPaths.full)
};
pilot.sourceHashes = {
  [nextPaths.bank]: await hash(nextPaths.bank),
  [nextPaths.registry]: await hash(nextPaths.registry),
  [nextPaths.sources]: await hash(nextPaths.sources)
};
stagedManifests.replace(nextPaths.pilot, pilot);

// Update mutable pointers in data/current.json
const updated = await read('data/current.json');
const refs = {
  candidateBank: [bank.bankVersion, nextPaths.bank],
  registry: [registry.registryVersion, nextPaths.registry],
  sourceRegistry: [sources.version, nextPaths.sources],
  worldviewSourceLedger: [ledger.version, nextPaths.ledger],
  worldviewModel: [model.modelVersion, nextPaths.model],
  fullForm: [full.policyVersion, nextPaths.full],
  progressiveDepth: [depth.policyVersion, nextPaths.depth],
  pilotCandidate: [pilot.pilotCandidateVersion, nextPaths.pilot],
  contentReview: [review.reviewVersion, nextPaths.review],
  affinityCatalog: [catalog.catalogVersion, nextPaths.catalog],
  localizationCatalog: [localization.catalogVersion, nextPaths.localization],
  quizExperience: [experience.experienceVersion, nextPaths.experience],
  releaseChannels: [channels.configVersion, nextPaths.channels],
  instrument: [research.instrumentVersion, nextPaths.research],
  pilot: [runtime.pilotId, nextPaths.runtime],
  academicRelease: [academic.version, nextPaths.academic]
};
for (const [key, [version, file]] of Object.entries(refs)) {
  updated[key] = {...updated[key], version, path: file, sha256: await hash(file)};
}
updated.registryVersion = registry.registryVersion;
updated.progressiveDepth.manifestPath = depthManifest;
updated.affinityCatalog.manifestPath = affinityManifest;
updated.localizationCatalog.manifestPath = localizationManifest;
updated.localizationBundles = [{locale: 'en-US', version: enBundle.bundleVersion, path: localizationBundle}];
updated.pilotEvidenceAudit = {version: 'pilot-evidence-dispositions-1.17.0', path: 'data/reviews/pilot-evidence-dispositions-v18.json'};
updated.quizExperience.entrypoint = 'apps/quiz/index.html';

stagedManifests.replace('data/current.json', updated);
stagedManifests.replace('data/experience/current.json', {
  schemaVersion: 'worldview-experience-index-1',
  current: {version: experience.experienceVersion, path: nextPaths.experience, entrypoint: 'apps/quiz/index.html'}
});
stagedManifests.replace('data/releases/channels-current.json', {
  schemaVersion: 'worldview-release-channel-index-1',
  current: {version: channels.configVersion, path: nextPaths.channels}
});
stagedManifests.replace('data/reference/catalog-index.json', {
  schemaVersion: '1.0.0',
  currentCatalogVersion: ref.catalogVersion,
  catalogPath: nextPaths.reference,
  manifestPath: 'data/reference/manifest-v1.2.0.json',
  reportPath: 'docs/reference-profiles-v1.2.0.md'
});
stagedManifests.replace('data/reference/readiness-current.json', {
  schemaVersion: 'reference-readiness-index-1',
  auditVersion: readiness.auditVersion,
  specPath: nextPaths.readiness,
  reportPath: 'data/reference/readiness-report-v2.json',
  markdownPath: 'docs/REFERENCE_READINESS_REPORT.md'
});
const report = await stagedManifests.commit();
console.log(`Mill canary release builder completed: bank 0.20.0, model 1.17.0-pilot, Full 251 items (${report.created.length} manifests created).`);
