// Successor release builder for model-release-1.21.0: Legal validity limits & PL21 co-review.
// Publishes PLI072@2, PLI073@2 and PLI128@1 on Full (253 items).
// Co-reviews source-based-validity to accommodate the Radbruch threshold formula without spurious conflict.
// Propositions and source claims come from reviewed MCP-2026-096/097.

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
const artifactHash = value => createHash('sha256').update(JSON.stringify(value, null, 2) + '\n').digest('hex');
const insertAfter = (arr, anchorId, item) => {
  const index = arr.findIndex(r => r.itemId === anchorId);
  assert.ok(index >= 0, 'Anchor item not found in route: ' + anchorId);
  arr.splice(index + 1, 0, item);
};

const current = await read('data/current.json');
assert.equal(current.modelRelease.version, 'model-release-1.20.0', 'Release 1.21.0 must build on model-release-1.20.0');

const oldPaths = await lineageFromCurrent(root, current);
const nextPaths = successorPaths(oldPaths);

const depthManifest = 'data/experience/progressive-depth-v2.9.manifest.json';
const affinityManifest = 'data/affinities/manifest-v2.9.json';
const localizationManifest = 'data/localization/manifest-v2.9.json';
const localizationBundle = 'data/localization/en-US-v20.json';

const proposal = await reviewedProposal(root, 'MCP-2026-096');
const proposal97 = await reviewedProposal(root, 'MCP-2026-097');
const legalValidityProposition = proposal.philosophicalBasis.proposition;
const moralLimitsRuleId = 'moral-limits-validity';
const sourceBasedRuleId = 'source-based-validity';

const legalSources = [
  {
    id: 'primary-radbruch-statutory-lawlessness',
    kind: 'primary_source',
    title: 'Gustav Radbruch, Statutory Lawlessness and Supra-Statutory Law (1946)',
    url: 'https://academic.oup.com/ojls/article/26/1/1/1484501',
    use: 'Radbruch formula: where positive enactment reaches an intolerable threshold of injustice, it yields to justice and loses legal validity.',
    evidenceType: 'primary_text',
    access: 'bibliographic_reference_not_text_reviewed',
    reuse: 'Doctrinal source only; no questionnaire wording copied and no item validity inferred.'
  },
  {
    id: 'acad-alexy-argument-from-injustice',
    kind: 'academic',
    title: 'Robert Alexy, The Argument from Injustice: A Reply to Legal Positivism (2002)',
    url: 'https://global.oup.com/academic/product/the-argument-from-injustice-9780199244010',
    use: 'Chapters 2 and 3 on the threshold connection between extreme injustice and legal invalidity.',
    evidenceType: 'signed_scholarly_synthesis',
    access: 'bibliographic_reference_not_text_reviewed',
    reuse: 'Interpretive boundary only; no questionnaire wording copied and no item validity inferred.'
  },
  {
    id: 'primary-finnis-natural-law-and-natural-rights',
    kind: 'primary_source',
    title: 'John Finnis, Natural Law and Natural Rights (1980)',
    url: 'https://global.oup.com/academic/product/natural-law-and-natural-rights-9780199599141',
    use: 'Chapters I and XII: focal sense of law and central-case analysis; defective law in moral-rational sense vs technical legal validity.',
    evidenceType: 'primary_text',
    access: 'bibliographic_reference_not_text_reviewed',
    reuse: 'Doctrinal boundary only; no questionnaire wording copied and no item validity inferred.'
  },
  {
    id: 'acad-hart-positivism-separation-law-morals',
    kind: 'academic',
    title: 'H.L.A. Hart, Positivism and the Separation of Law and Morals (1958)',
    url: 'https://www.jstor.org/stable/1338225',
    use: 'Sections III and IV: separation thesis and critique of Radbruch; legal validity distinct from moral duty to obey.',
    evidenceType: 'signed_scholarly_synthesis',
    access: 'bibliographic_reference_not_text_reviewed',
    reuse: 'Interpretive boundary only; no questionnaire wording copied and no item validity inferred.'
  },
  {
    id: 'sep-natural-law-theories-legal-validity',
    kind: 'academic',
    title: 'John Finnis, Natural Law Theories, Stanford Encyclopedia of Philosophy',
    url: 'https://plato.stanford.edu/entries/natural-law-theories/',
    locator: 'Sections 3.1.1 and 4',
    use: 'Institutionally incorporated moral criteria and higher-law reasoning; technical validity versus defective law.',
    evidenceType: 'signed_scholarly_synthesis',
    access: 'selected_sections_reviewed',
    reviewedOn: '2026-10-04',
    reuse: 'Conceptual source only; original questionnaire wording, no psychometric validation transferred.'
  }
];

const pli072 = {
  id: 'PLI072',
  revision: 2,
  domainId: 'PL',
  text: "Extreme injustice can deprive an enactment of genuine legal status even when the legal system's own rules contain no moral limits.",
  responseType: 'likert',
  responseScaleId: 'agreement5',
  options: [],
  status: 'candidate',
  contentKind: 'principle',
  targets: [{constructId: 'PL21', relation: 'diagnostic', role: 'primary'}],
  mirrorGroup: null,
  scenarioGroup: null,
  eligibility: {mode: 'always'},
  specialStates: ['no_view', 'not_understood'],
  contentTags: ['jurisprudence', 'legal_validity', 'extreme_injustice'],
  provenance: {
    origin: 'original_project_research_design',
    sourceRefs: ['gen-law', ...legalSources.map(x => x.id)],
    license: {status: 'undecided', spdx: null},
    copiedText: false
  },
  notes: "Replaced broad wording with explicit invalidity independent of system institutional criteria, preventing inclusive legal positivist false positives."
};

const pli073 = {
  id: 'PLI073',
  revision: 2,
  domainId: 'PL',
  text: "A regime enacts a rule that meets all of its accepted institutional criteria for legal validity. Those criteria contain no moral limits. The rule reaches an intolerable extreme of injustice, not merely ordinary unfairness. Can that extreme injustice itself make the rule legally invalid?",
  responseType: 'vignette_choice',
  responseScaleId: 'vignette_choice',
  status: 'candidate',
  contentKind: 'vignette',
  targets: [{constructId: 'PL21', relation: 'diagnostic', role: 'primary'}],
  options: [
    {id: 'not_law', label: 'Yes. Extreme injustice itself can make it legally invalid despite meeting those criteria.'},
    {id: 'valid_but_unjust', label: 'No. It remains legally valid despite that extreme injustice; whether to obey it is a separate question.'},
    {id: 'defective_law', label: 'I would call it defective law without settling whether it is legally valid.'},
    {id: 'depends', label: 'I cannot settle its legal validity from these facts.'}
  ],
  mirrorGroup: null,
  scenarioGroup: 'PL-S18',
  eligibility: {mode: 'always'},
  specialStates: ['no_view', 'not_understood'],
  contentTags: ['jurisprudence', 'legal_validity', 'extreme_injustice'],
  provenance: {
    origin: 'original_project_research_design',
    sourceRefs: ['gen-law', ...legalSources.map(x => x.id)],
    license: {status: 'undecided', spdx: null},
    copiedText: false
  },
  notes: 'All institutional criteria are satisfied and contain no moral limits. Extreme injustice is distinguished from ordinary injustice. defective_law and depends are nondirectional, not evidence of a positivist identity.'
};

const pli128 = {
  ...structuredClone(pli073),
  id: 'PLI128',
  revision: 1,
  text: 'A city enacts a seriously unfair fee favoring well-connected businesses. It satisfies all institutional validity criteria, including any incorporated moral conditions. Its injustice falls below an intolerable extreme-injustice threshold. Can this immoral rule remain legally valid?',
  options: [
    {id: 'valid_but_unjust', label: 'Yes. It can remain legally valid despite being immoral; whether to obey it is a separate question.'},
    {id: 'not_law', label: 'No. Being immoral itself rules out legal validity, even below that extreme threshold.'},
    {id: 'defective_law', label: 'I would call it defective law without settling whether it is legally valid.'},
    {id: 'depends', label: 'I cannot settle its legal validity from these facts.'}
  ],
  scenarioGroup: 'PL-S-ordinary-immoral-validity',
  contentTags: ['jurisprudence', 'legal_validity', 'ordinary_injustice'],
  notes: 'Separately authored ordinary-injustice evidence for MCP-2026-097. Does not measure social-sources primacy. defective_law and depends are nondirectional; distinct authored units are not empirical independence.',
  provenance: {
    ...structuredClone(pli073.provenance),
    sourceRefs: ['gen-law', 'sep-natural-law-theories-legal-validity']
  }
};

// 1. Candidate item bank (0.21.0)
const bank = await read(oldPaths.bank);
assert.equal(bank.bankVersion, '0.20.0');
bank.bankVersion = '0.21.0';
const idx72 = bank.items.findIndex(i => i.id === 'PLI072');
assert.ok(idx72 >= 0, 'PLI072 must exist in bank');
bank.items[idx72] = pli072;
const idx73 = bank.items.findIndex(i => i.id === 'PLI073');
assert.ok(idx73 >= 0, 'PLI073 must exist in bank');
bank.items[idx73] = pli073;
assert.ok(!bank.items.some(item => item.id === pli128.id), 'New item ID already exists');
bank.items.push(pli128);

// 2. Construct registry (0.10.0)
const registry = await read(oldPaths.registry);
assert.equal(registry.registryVersion, '0.9.0');
registry.registryVersion = '0.10.0';
const pl21Construct = registry.constructs.find(c => c.id === 'PL21');
assert.ok(pl21Construct, 'PL21 construct must exist');
pl21Construct.description = 'Legal validity and moral merits: whether immoral laws can remain valid, and whether extreme injustice can independently invalidate enactments. These are distinct propositions, not a positivist or natural-law identity scale.';
pl21Construct.evidenceBasis = [...new Set([...pl21Construct.evidenceBasis, ...legalSources.map(x => x.id)])];

// 3. Source registry (1.14.0)
const sources = await read(oldPaths.sources);
sources.version = 'source-registry-1.14.0';
for (const source of legalSources) {
  assert.ok(!sources.sources.some(r => r.id === source.id), 'Source already exists: ' + source.id);
  sources.sources.push(source);
}

// 4. Source ledger (0.22.0)
const ledger = await read(oldPaths.ledger);
ledger.version = '0.22.0';
for (const source of legalSources) {
  ledger.sources.push({
    ...source,
    useByRules: [[moralLimitsRuleId, proposal], [sourceBasedRuleId, proposal97]]
      .filter(([, reviewed]) => reviewed.sourceClaims.some(claim => claim.sourceId === source.id))
      .map(([ruleId]) => ruleId),
    useByConstructs: ['PL21'],
    useByItems: source.id === 'sep-natural-law-theories-legal-validity' ? ['PLI072', 'PLI073', 'PLI128'] : ['PLI072', 'PLI073'],
    permissionToCopyItems: false,
    validatesOurItems: false,
    sourceRole: source.evidenceType === 'primary_text' ? 'primary_text' : 'signed_scholarly_synthesis',
    detailedUseLimit: source.access === 'selected_sections_reviewed'
      ? 'Selected scholarly sections support conceptual distinctions only; no item wording, thresholds, route placement, comprehension, or psychometrics are validated.'
      : 'Bibliographic context only. The primary text or monograph has not been read in this review; attributed claims require the separately reviewed scholarly synthesis and confer no item validation.'
  });
}
const lawSource = ledger.sources.find(source => source.id === 'gen-law');
assert.ok(lawSource, 'Existing legal positivism source must exist');
lawSource.useByRules = [...new Set([...(lawSource.useByRules ?? []), moralLimitsRuleId, sourceBasedRuleId])];
lawSource.useByItems = [...new Set([...(lawSource.useByItems ?? []), 'PLI071', 'PLI072', 'PLI073', 'PLI128'])];

// 5. Model commitments & coverage (generic-1.18.0-pilot)
const model = await read(oldPaths.model);
model.parentModelVersion = model.modelVersion;
model.modelVersion = 'generic-1.18.0-pilot';
model.bankVersion = bank.bankVersion;
model.registryVersion = registry.registryVersion;
model.pilotInstrumentVersion = 'worldview-pilot-1.12.0';
model.sources.push(...legalSources);

// Update moral-limits-validity rule
const moralRule = model.commitments.find(r => r.id === moralLimitsRuleId);
assert.ok(moralRule, 'moral-limits-validity rule must exist in model');
moralRule.label = 'Extreme injustice can invalidate law independently of system criteria';
moralRule.scope = legalValidityProposition;
moralRule.proposition = legalValidityProposition;
moralRule.sourceIds = [...new Set(proposal.sourceClaims.map(x => x.sourceId))];
moralRule.sourceClaims = proposal.sourceClaims;
moralRule.neighbors = proposal.philosophicalBasis.neighboringViews;
moralRule.nonEntailments = proposal.philosophicalBasis.nonEntailments;
moralRule.falsePositives = [
  'Inclusive positivists agreeing that unjust laws are invalid when the constitution includes moral rights',
  'Confusing a moral judgment that a law ought not to be obeyed with the claim that it is legally void'
];
moralRule.evidence = [
  {itemId: 'PLI072', itemRevision: 2, unitId: 'PLI072', support: [1, 2], oppose: [-2, -1]},
  {itemId: 'PLI073', itemRevision: 2, unitId: 'PLI073', support: ['not_law'], oppose: ['valid_but_unjust']}
];

// Ordinary immoral-law evidence must not turn extreme-threshold answers into opposition.
const sourceRule = model.commitments.find(r => r.id === sourceBasedRuleId);
assert.ok(sourceRule, 'source-based-validity rule must exist in model');
sourceRule.scope = proposal97.philosophicalBasis.proposition;
sourceRule.proposition = proposal97.philosophicalBasis.proposition;
sourceRule.label = 'Immoral laws can remain legally valid';
sourceRule.neighbors = proposal97.philosophicalBasis.neighboringViews;
sourceRule.nonEntailments = proposal97.philosophicalBasis.nonEntailments;
sourceRule.falsePositives = ['Treating moral defectiveness as legal invalidity', 'Treating institutional moral invalidity as rejection of all immoral laws', 'Inferring social-sources primacy or a positivist identity from moral fallibility alone'];
sourceRule.sourceIds = proposal97.sourceClaims.map(x => x.sourceId);
sourceRule.sourceClaims = proposal97.sourceClaims;
sourceRule.evidence = [
  {itemId: 'PLI071', itemRevision: 1, unitId: 'PLI071', support: [1, 2], oppose: [-2, -1]},
  {itemId: 'PLI128', itemRevision: 1, unitId: 'PLI128', support: ['valid_but_unjust'], oppose: ['not_law']}
];

// 6. Full route form policy (philosophy-pilot-1.18.0, size 253)
const full = await read(oldPaths.full);
full.parentPolicyVersion = full.policyVersion;
full.policyVersion = 'philosophy-pilot-1.18.0';
full.bankVersion = bank.bankVersion;
full.registryVersion = registry.registryVersion;
full.instrumentVersion = model.pilotInstrumentVersion;
full.modelVersion = model.modelVersion;

// Update PLI073 to revision 2
const fIdx73 = full.frozenItems.findIndex(r => r.itemId === 'PLI073');
assert.ok(fIdx73 >= 0, 'PLI073 must be in full.frozenItems');
full.frozenItems[fIdx73].itemRevision = 2;

// Insert PLI072@2 after VAI033
insertAfter(full.frozenItems, 'VAI033', {itemId: 'PLI072', itemRevision: 2});
insertAfter(full.frozenItems, 'PLI071', {itemId: 'PLI128', itemRevision: 1});
assert.equal(full.frozenItems.length, 253, 'Full route items count must be 253');
full.sizes = [253];
model.pilotRouteItemRefs = structuredClone(full.frozenItems);

const ruleByItem = new Map();
for (const r of model.commitments) {
  for (const evidence of r.evidence ?? []) {
    const list = ruleByItem.get(evidence.itemId) ?? [];
    list.push(r.id);
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

// Update bundle for moral-limits-validity
const moralBundle = full.bundles.find(b => b.commitmentId === moralLimitsRuleId);
if (moralBundle) {
  moralBundle.itemIds = ['PLI072', 'PLI073'];
  moralBundle.itemRevisions = [2, 2];
  moralBundle.evidenceUnits = ['PLI072', 'PLI073'];
} else {
  full.bundles.push({
    id: moralLimitsRuleId + ':full-route',
    commitmentId: moralLimitsRuleId,
    domainId: 'PL',
    itemIds: ['PLI072', 'PLI073'],
    itemRevisions: [2, 2],
    evidenceUnits: ['PLI072', 'PLI073']
  });
}

// 7. Progressive depth policy (progressive-depth-2.9.0)
const sourceBundle = full.bundles.find(b => b.commitmentId === sourceBasedRuleId);
assert.ok(sourceBundle, 'Source-validity route bundle must exist');
sourceBundle.itemIds = ['PLI071', 'PLI128'];
sourceBundle.itemRevisions = [1, 1];
sourceBundle.evidenceUnits = ['PLI071', 'PLI128'];

const depth = await read(oldPaths.depth);
depth.policyVersion = 'progressive-depth-2.9.0';
depth.bankVersion = bank.bankVersion;
depth.modelVersion = model.modelVersion;
depth.instrumentVersion = model.pilotInstrumentVersion;
depth.pilotFormPolicyVersion = full.policyVersion;
depth.affinityCatalogVersion = 'philosophical-affinity-2.9.0';
depth.selectionBasis = 'Quick and Standard retain their exact 64/120 item references. Full adds PLI072@2 and PLI128@1 for separate extreme-injustice and ordinary immoral-law evidence.';
for (const route of depth.routes) {
  route.routeVersion = route.id + '-2.9.0';
  if (route.id === 'full') {
    route.itemRefs = structuredClone(full.frozenItems);
    route.size = 253;
    route.description = '253 questions; the broadest authored coverage, including separate extreme-injustice and ordinary immoral-law evidence.';
    route.assessableDirectRuleIds = [...new Set([...route.assessableDirectRuleIds, moralLimitsRuleId])].sort();
    assert.equal(route.assessableDirectRuleIds.length, 99, 'Full route assessable direct rules must be exactly 99');
    route.burden.items = 253;
  }
}

// 8. Research pool (0.21.0-research, 578 entries)
const research = await read(oldPaths.research);
research.instrumentVersion = '0.21.0-research';
research.bankVersion = bank.bankVersion;
research.registryVersion = registry.registryVersion;
research.nominalPoolSize = bank.items.length;
research.entries = bank.items.map((row, index) => ({index, itemId: row.id, itemRevision: row.revision}));

// 9. Runtime pilot (pilot-0.14)
const runtime = await read(oldPaths.runtime);
runtime.pilotId = 'pilot-0.14';
runtime.bankVersion = bank.bankVersion;
runtime.sourceInstrumentVersion = research.instrumentVersion;
runtime.administration.note += ' The 0.21 research pool updates PLI072@2 and PLI073@2 for extreme-injustice limits and adds PLI128@1 for ordinary immoral-law validity.';

// 10. Worldview pilot instrument (worldview-pilot-1.12.0, 253 entries)
const instrument = await read(oldPaths.instrument);
instrument.instrumentVersion = model.pilotInstrumentVersion;
instrument.bankVersion = bank.bankVersion;
instrument.registryVersion = registry.registryVersion;
instrument.nominalPoolSize = full.frozenItems.length;
instrument.entries = full.frozenItems.map((ref, index) => ({index, ...ref}));

// 11. Content review (pilot-content-review-1.12.0)
const review = await read(oldPaths.review);
review.reviewVersion = 'pilot-content-review-1.12.0';
review.sourceFormPolicyVersion = full.policyVersion;
review.frozenAssignedItems = full.frozenItems.length;

// Update PLI073 decision to revision 2
const rIdx73 = review.decisions.findIndex(d => d.itemId === 'PLI073');
assert.ok(rIdx73 >= 0, 'PLI073 review decision must exist');
review.decisions[rIdx73].itemRevision = 2;
review.decisions[rIdx73].rationale = pli073.notes;
review.decisions[rIdx73].mappedRuleIds = [moralLimitsRuleId];
review.decisions[rIdx73].nearbyRouteItemIds = ['PLI072'];
review.decisions[rIdx73].contribution = 'extreme_injustice_independent_invalidity';
const review71 = review.decisions.find(decision => decision.itemId === 'PLI071');
assert.ok(review71, 'PLI071 review decision must exist');
review71.mappedRuleIds = [sourceBasedRuleId];
review71.nearbyRouteItemIds = ['PLI128'];
review71.rationale = 'Ordinary immoral-law validity principle paired with PLI128, not the extreme-injustice PLI073 vignette. Does not entail social-sources primacy.';

// Add PLI072 decision at revision 2
const pos72 = full.frozenItems.findIndex(r => r.itemId === 'PLI072') + 1;
review.decisions.push({
  sourcePosition: pos72,
  itemId: 'PLI072',
  itemRevision: 2,
  domainId: 'PL',
  targetConstructIds: ['PL21'],
  mappedRuleIds: [moralLimitsRuleId],
  nearbyRouteItemIds: ['PLI073'],
  responseMethod: 'likert',
  contribution: 'extreme_injustice_independent_invalidity',
  decision: 'retain_for_pilot',
  issue: null,
  rationale: 'Tests whether extreme injustice invalidates law independently of institutional criteria, eliminating inclusive positivism false positive.',
  resultUse: 'only_through_explicit_interpretation_rules'
});
review.decisions.push({
  ...structuredClone(review.decisions.at(-1)),
  itemId: 'PLI128',
  itemRevision: 1,
  mappedRuleIds: [sourceBasedRuleId],
  nearbyRouteItemIds: ['PLI071'],
  responseMethod: 'vignette_choice',
  contribution: 'ordinary_immoral_law_can_remain_valid',
  rationale: pli128.notes
});
for (const decision of review.decisions) {
  decision.sourcePosition = full.frozenItems.findIndex(ref => ref.itemId === decision.itemId) + 1;
}
review.decisions.sort((a, b) => a.sourcePosition - b.sourcePosition);

// 12. Affinity catalog (philosophical-affinity-2.9.0)
const catalog = await read(oldPaths.catalog);
catalog.catalogVersion = 'philosophical-affinity-2.9.0';
catalog.modelVersion = model.modelVersion;
catalog.instrumentVersion = model.pilotInstrumentVersion;

// 13. Localization (catalog-v20, en-US-v20)
const localization = await read(oldPaths.localization);
localization.catalogVersion = 'localization-catalog-2.9.0';
localization.canonicalBankVersion = bank.bankVersion;
localization.modelVersion = model.modelVersion;
localization.affinityCatalogVersion = catalog.catalogVersion;
const enBundle = await read('data/localization/en-US-v19.json');
enBundle.bundleVersion = 'localization-en-US-2.9.0';
enBundle.bankVersion = bank.bankVersion;
enBundle.modelVersion = model.modelVersion;
enBundle.affinityCatalogVersion = catalog.catalogVersion;
localization.locales[0] = {...localization.locales[0], bundleVersion: enBundle.bundleVersion, path: localizationBundle};

// 14. Pilot candidate (pilot-candidate-1.18.0)
const pilot = await read(oldPaths.pilot);
pilot.pilotCandidateVersion = 'pilot-candidate-1.18.0';
pilot.itemBank = {version: bank.bankVersion, path: nextPaths.bank};
pilot.constructRegistry = {version: registry.registryVersion, path: nextPaths.registry};
pilot.route.version = full.policyVersion;
pilot.route.path = nextPaths.full;
pilot.route.instrumentVersion = model.pilotInstrumentVersion;
pilot.route.instrumentManifestPath = nextPaths.instrument;
pilot.route.assignedItems = full.frozenItems.length;
pilot.route.exactItemRevisions = structuredClone(full.frozenItems);
pilot.route.domainCounts.PL += 2;
pilot.interpretationRules.version = model.modelVersion;
pilot.interpretationRules.path = nextPaths.model;
pilot.interpretationRules.routeMeasuredDirectRuleIds = [...new Set([...pilot.interpretationRules.routeMeasuredDirectRuleIds, moralLimitsRuleId])].sort();
pilot.interpretationRules.routeNotMeasuredDirectRuleIds = pilot.interpretationRules.routeNotMeasuredDirectRuleIds.filter(id => id !== moralLimitsRuleId);
assert.ok(pilot.interpretationRules.routeMeasuredDirectRuleIds.every(id => !pilot.interpretationRules.routeNotMeasuredDirectRuleIds.includes(id)), 'Measured and unmeasured pilot rules must be disjoint');
pilot.contentReview = {version: review.reviewVersion, path: nextPaths.review};
pilot.limitations.push('Extreme injustice legal validity limits is measured as an independent diagnostic proposition; it does not assign whole natural-law doctrine.');

// 15. Academic release (0.21.0)
const academic = await read(oldPaths.academic);
academic.version = '0.21.0';
academic.registryVersion = registry.registryVersion;
academic.baseBankVersion = bank.bankVersion;
academic.reviewedOn = '2026-10-04';
academic.itemCount = bank.items.length;
academic.newItemCount = 1;
academic.registryEntries = registry.constructs.length;
academic.activeConstructCount = registry.constructs.filter(row => row.measurementStatus !== 'deprecated').length;
academic.newConstructCount = 0;
academic.note = 'Revises PLI072@2 and PLI073@2 and adds PLI128@1 on Full (253 items). Bibliographic references are not full-text reviewed; selected SEP sections provide reviewed scholarly context.';

// 16. Quiz experience policy (quiz-1.25.0)
const experience = await read(oldPaths.experience);
experience.experienceVersion = 'quiz-1.25.0';
const fullExpRoute = experience.routes.find(r => r.id === 'full');
fullExpRoute.size = full.frozenItems.length;
fullExpRoute.description = '253 questions; broadest coverage, including separate extreme-injustice and ordinary immoral-law evidence.';
for (const r of experience.routes) r.formPolicyVersion = r.id === 'full' ? full.policyVersion : depth.policyVersion;
experience.formPolicies.push({version: full.policyVersion, path: nextPaths.full}, {version: depth.policyVersion, path: nextPaths.depth});
experience.modelPolicies.push({version: model.modelVersion, path: nextPaths.model});
experience.pilotCandidate = {version: pilot.pilotCandidateVersion, path: nextPaths.pilot};
experience.progressivePolicy = {version: depth.policyVersion, path: nextPaths.depth, manifestPath: depthManifest};
experience.localizationCatalogVersion = localization.catalogVersion;
experience.localizationCatalogPath = nextPaths.localization;
experience.routeLengthMeaning = 'Quick and Standard retain their exact 64/120 item references. Full adds PLI072@2 and PLI128@1, reaching 253 questions with separate extreme-injustice and ordinary immoral-law evidence.';

// 17. Release channels (worldview-release-channels-22.0.0)
const channels = await read(oldPaths.channels);
channels.configVersion = 'worldview-release-channels-22.0.0';
for (const ch of Object.values(channels.channels)) ch.modelReleaseVersion = 'model-release-1.21.0';

// 18. Reference profiles (reference-profile-catalog-1.4.0)
const ref = await read(oldPaths.reference);
ref.catalogVersion = 'reference-profile-catalog-1.4.0';
ref.profileModelVersion = 'reference-profile-model-1.4.0';
ref.sourceLedgerVersion = 'reference-profile-sources-1.4.0';
ref.modelVersion = model.modelVersion;
ref.routePolicyVersion = depth.policyVersion;
for (const p of ref.profiles) {
  p.modelVersion = model.modelVersion;
  if (p.schemaVersion === '1.1.0') p.routePolicyVersion = depth.policyVersion;
}

// Finalize all dependency hashes before the pilot's only immutable write.
pilot.frozenArtifactHashes = {
  [nextPaths.review]: artifactHash(review),
  [nextPaths.instrument]: artifactHash(instrument),
  [nextPaths.model]: artifactHash(model),
  [nextPaths.full]: artifactHash(full)
};
pilot.sourceHashes = {
  [nextPaths.bank]: artifactHash(bank),
  [nextPaths.registry]: artifactHash(registry),
  [nextPaths.sources]: artifactHash(sources)
};

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

await staged.commit();

// Compute hashes for manifests
const localizationHashes = {
  [nextPaths.localization]: await hash(nextPaths.localization),
  [localizationBundle]: await hash(localizationBundle)
};

// 19. Readiness audit (reference-readiness-audit-3.0.0)
const readiness = await read(oldPaths.readiness);
readiness.auditVersion = 'reference-readiness-audit-3.0.0';
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
updated.quizExperience.entrypoint = 'apps/quiz/index.html';
updated.pilotEvidenceAudit = {
  version: 'pilot-evidence-dispositions-1.18.0',
  path: 'data/reviews/pilot-evidence-dispositions-v19.json'
};

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
  manifestPath: 'data/reference/manifest-v1.4.0.json',
  reportPath: 'docs/reference-profiles-v1.4.0.md'
});
stagedManifests.replace('data/reference/readiness-current.json', {
  schemaVersion: 'reference-readiness-index-1',
  auditVersion: readiness.auditVersion,
  specPath: nextPaths.readiness,
  reportPath: 'data/reference/readiness-report-v3.json',
  markdownPath: 'docs/REFERENCE_READINESS_REPORT.md'
});

const report = await stagedManifests.commit();
console.log(`Legal validity limits release builder completed: bank ${bank.bankVersion} (${bank.items.length} items), model ${model.modelVersion}, Full ${full.frozenItems.length} items (${report.created.length} manifests created).`);
