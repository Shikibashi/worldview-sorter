export class ReferenceProfileError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ReferenceProfileError';
  }
}

const need = (condition, message) => {
  if (!condition) throw new ReferenceProfileError(message);
};

const IMPORTANCE = new Set(['core', 'major', 'minor']);
const EVIDENCE_BASIS = new Set(['primary_text', 'scholarly_reconstruction', 'editorial_hypothesis']);
const PUBLIC_USE = new Set(['comparison', 'context_only']);
const EXPECTED_STATES = new Set(['supported', 'opposed']);
const MAPPING_STATUS = new Set(['DIRECT', 'PARTIAL', 'ROUTE_LIMITED', 'UNMEASURED', 'MISSING_PROPOSITION', 'UNSUITABLE', 'CONTEXT_ONLY']);
const FORBIDDEN_FIELDS = new Set([
  'vector', 'coordinates', 'axisValues', 'score', 'matchPercentage', 'nearestProfile',
  'winner', 'assignedIdentity', 'similarity', 'aggregateScore'
]);

function knownPropositions(model) {
  return new Map([
    ...(model.commitments ?? []).map(row => [row.id, row]),
    ...(model.derivedRules ?? []).map(row => [row.id, row])
  ]);
}

function sourceIndex(model, referenceSources) {
  return new Map([
    ...(model.sources ?? []).map(row => [row.id, row]),
    ...(referenceSources ?? []).map(row => [row.id, row])
  ]);
}

function inspectForbiddenFields(value, path = 'reference profile') {
  if (Array.isArray(value)) {
    value.forEach((row, index) => inspectForbiddenFields(row, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    need(!FORBIDDEN_FIELDS.has(key), `${path} cannot contain ${key}.`);
    inspectForbiddenFields(child, `${path}.${key}`);
  }
}

function expectedRouteAvailability(propositionId, routes) {
  return routes.routes
    .filter(route => (route.assessableDirectRuleIds ?? []).includes(propositionId))
    .map(route => route.id);
}

function expectedMappingStatus(availability, routes) {
  if (availability.length === routes.routes.length) return 'DIRECT';
  if (availability.length > 0) return 'ROUTE_LIMITED';
  return 'UNMEASURED';
}

function sourceType(source) {
  return source.sourceType ?? source.evidenceType ?? '';
}

function validateSourceBasis(claim, sources) {
  const types = claim.sourceClaims.map(row => sourceType(sources.get(row.sourceId)));
  if (claim.evidenceBasis === 'primary_text') {
    need(types.some(type => type === 'primary_text'), `${claim.id}: primary_text claims require a cited primary text.`);
  }
  if (claim.evidenceBasis === 'scholarly_reconstruction') {
    need(types.some(type => /signed_scholarly|peer_reviewed|scholarly_reference|academic_monograph|scholarly_synthesis/i.test(type)),
      `${claim.id}: scholarly_reconstruction claims require a scholarly source.`);
  }
}

export function validateReferenceProfile({ profile, model, routes, referenceSources = [] }) {
  need(profile && typeof profile === 'object', 'Reference profile is required.');
  need(['1.0.0', '1.1.0'].includes(profile.schemaVersion), 'Unsupported reference profile schema.');
  need(profile.modelVersion === model?.modelVersion, 'Reference profile/model mismatch.');
  need(profile.origin === 'independent_authoring', 'Reference profiles must declare independent authoring.');
  need(profile.identityOutputAllowed === false && profile.percentageMatchAllowed === false,
    'Reference profiles cannot enable identity or percentage output.');
  need(['philosopher', 'tradition'].includes(profile.entityType), 'Reference profile entity type is invalid.');
  need(['stub', 'partial', 'reviewed'].includes(profile.coverageStatus), 'Reference profile coverage status is invalid.');
  need(typeof profile.id === 'string' && profile.id.length > 0 && typeof profile.label === 'string' && profile.label.length > 0,
    'Reference profile requires id and label.');
  need(Array.isArray(profile.claims), 'Reference profile requires claims.');

  inspectForbiddenFields(profile);

  const isRouteAware = profile.schemaVersion === '1.1.0';
  if (isRouteAware) {
    need(profile.publicationStatus === 'internal_only', `${profile.id}: profile must remain internal until separately released.`);
    need(typeof profile.scope === 'string' && profile.scope.trim().length > 0, `${profile.id}: profile scope is required.`);
    need(profile.routePolicyVersion === routes?.policyVersion, `${profile.id}: route policy mismatch.`);
    for (const field of ['neighbors', 'nonEntailments', 'unmeasuredAreas', 'limitations']) {
      need(Array.isArray(profile[field]) && profile[field].length > 0, `${profile.id}: explicit ${field} are required.`);
    }
  }

  const propositions = knownPropositions(model);
  const sources = sourceIndex(model, referenceSources);
  const claimIds = new Set();
  for (const claim of profile.claims) {
    need(claim && typeof claim === 'object', 'Profile claim must be an object.');
    need(typeof claim.id === 'string' && claim.id.length > 0 && !claimIds.has(claim.id), 'Profile claim ids must be unique.');
    claimIds.add(claim.id);
    const proposition = propositions.get(claim.propositionId);
    need(proposition, `Profile claim references unknown proposition ${claim.propositionId}.`);
    need(EXPECTED_STATES.has(claim.expectedState), 'Profile claim expected state is invalid.');
    need(IMPORTANCE.has(claim.importance), 'Profile claim importance is invalid.');
    need(EVIDENCE_BASIS.has(claim.evidenceBasis), 'Profile claim evidence basis is invalid.');
    need(PUBLIC_USE.has(claim.publicUse), 'Profile claim public use is invalid.');
    if (claim.evidenceBasis === 'editorial_hypothesis') {
      need(claim.publicUse === 'context_only', 'Editorial hypotheses cannot participate in comparison.');
    }
    need(Array.isArray(claim.sourceClaims) && claim.sourceClaims.length > 0, 'Profile claim requires source claims.');
    for (const sourceClaim of claim.sourceClaims) {
      need(sourceClaim && sources.has(sourceClaim.sourceId), `Profile claim references unknown source ${sourceClaim?.sourceId}.`);
      need(sourceClaim.relationship === 'supports_profile_claim', 'Profile source claims require supports_profile_claim.');
      need(typeof sourceClaim.claim === 'string' && sourceClaim.claim.trim().length > 0, 'Profile source claim must be explicit.');
      if (isRouteAware) {
        need(typeof sourceClaim.locator === 'string' && sourceClaim.locator.trim().length > 0,
          `${claim.id}: each source claim requires an exact locator.`);
      }
    }

    if (isRouteAware) {
      need(['proposition', 'scope'].includes(claim.targetKind), `${claim.id}: active target kind is required.`);
      need(typeof claim.targetText === 'string' && claim.targetText.trim().length > 0,
        `${claim.id}: exact model target text is required.`);
      const activeKind = typeof proposition.proposition === 'string' ? 'proposition' : 'scope';
      const activeText = proposition.proposition ?? proposition.scope;
      need(claim.targetKind === activeKind && claim.targetText === activeText,
        `${claim.id}: target kind and text must match the active model target.`);
      need(MAPPING_STATUS.has(claim.mappingStatus), `${claim.id}: mapping status is invalid.`);
      need(Array.isArray(claim.routeAvailability), `${claim.id}: route availability is required.`);
      for (const field of ['neighbors', 'nonEntailments', 'limitations']) {
        need(Array.isArray(claim[field]) && claim[field].length > 0, `${claim.id}: explicit ${field} are required.`);
      }
      const actualAvailability = expectedRouteAvailability(claim.propositionId, routes);
      need(JSON.stringify(claim.routeAvailability) === JSON.stringify(actualAvailability),
        `${claim.id}: route availability does not match the active route manifest.`);
      need(claim.mappingStatus === expectedMappingStatus(actualAvailability, routes),
        `${claim.id}: mapping status does not match route availability.`);
      if (claim.publicUse === 'comparison') {
        need(['DIRECT', 'ROUTE_LIMITED'].includes(claim.mappingStatus),
          `${claim.id}: only direct, route-available evidence may enter comparison.`);
      }
      if (claim.importance === 'core') {
        need(claim.evidenceBasis !== 'editorial_hypothesis' && ['DIRECT', 'ROUTE_LIMITED'].includes(claim.mappingStatus),
          `${claim.id}: core comparison claims require non-hypothetical direct evidence.`);
      }
      validateSourceBasis(claim, sources);
    }
  }

  need(Array.isArray(profile.limitations) && profile.limitations.length > 0, 'Reference profile requires explicit limitations.');
  return true;
}

export function validateReferenceCatalog({ catalog, model, routes }) {
  need(catalog && typeof catalog === 'object', 'Reference profile catalog is required.');
  need(catalog.schemaVersion === '1.0.0', 'Unsupported reference profile catalog schema.');
  need(catalog.origin === 'independent_authoring', 'Reference profile catalog must declare independent authoring.');
  need(typeof catalog.catalogVersion === 'string' && typeof catalog.profileModelVersion === 'string',
    'Reference profile catalog requires independent versions.');
  need(typeof catalog.sourceLedgerVersion === 'string' && catalog.sourceLedgerVersion.length > 0,
    'Reference profile catalog requires a versioned source ledger.');
  need(catalog.modelVersion === model?.modelVersion, 'Reference profile catalog/model mismatch.');
  need(catalog.routePolicyVersion === routes?.policyVersion, 'Reference profile catalog/route mismatch.');
  need(Array.isArray(catalog.sources), 'Reference profile catalog requires its source registry.');
  need(Array.isArray(catalog.profiles) && catalog.profiles.length > 0, 'Reference profile catalog requires profiles.');

  const sourceIds = new Set();
  const activeSourceIds = new Set((model.sources ?? []).map(source => source.id));
  for (const source of catalog.sources) {
    need(source && typeof source.id === 'string' && source.id.length > 0 && !sourceIds.has(source.id),
      'Reference source IDs must be unique.');
    need(!activeSourceIds.has(source.id), `Reference source ${source.id} duplicates an active model source ID.`);
    sourceIds.add(source.id);
    need(['primary_text', 'signed_scholarly_reference', 'peer_reviewed_scholarship', 'bibliographic_metadata'].includes(source.sourceType),
      `${source.id}: source type is invalid.`);
    need(typeof source.title === 'string' && source.title.trim().length > 0 && typeof source.url === 'string' && source.url.startsWith('https://'),
      `${source.id}: source title and HTTPS URL are required.`);
    if (source.sourceType !== 'bibliographic_metadata') {
      need(Array.isArray(source.authors) && source.authors.length > 0, `${source.id}: author list is required.`);
    }
  }

  const profileIds = new Set();
  for (const profile of catalog.profiles) {
    need(!profileIds.has(profile.id), `Duplicate reference profile id ${profile.id}.`);
    profileIds.add(profile.id);
    validateReferenceProfile({ profile, model, routes, referenceSources: catalog.sources });
  }
  return true;
}

function reportStates(report) {
  const map = new Map();
  for (const row of report.commitments ?? []) map.set(row.commitmentId, row.state);
  for (const row of report.derived ?? []) map.set(row.id, row.state);
  return map;
}

function relationFor(observedState, expectedState) {
  if (observedState === expectedState) return 'overlap';
  if (['supported', 'opposed'].includes(observedState)) return 'divergence';
  if (['mixed', 'mixed_context_dependent'].includes(observedState)) return 'mixed';
  if (observedState === 'not_measured') return 'not_measured';
  return 'insufficient_evidence';
}

export function compareReferenceProfile({ profile, model, report, routes, routeId, referenceSources = [] }) {
  validateReferenceProfile({ profile, model, routes, referenceSources });
  need(report?.modelVersion === model.modelVersion, 'Reference comparison requires the same model version.');
  const routeAware = profile.schemaVersion === '1.1.0';
  if (routeAware) {
    need(routeId && routes?.routes.some(route => route.id === routeId), 'Route-aware comparison requires a known route id.');
    need(!report.routeId || report.routeId === routeId, 'Comparison report route does not match the requested route.');
    need(!report.routePolicyVersion || report.routePolicyVersion === routes.policyVersion, 'Comparison report route policy mismatch.');
  }

  const states = reportStates(report);
  const claims = profile.claims.map(claim => {
    const routeAllowsClaim = !routeAware || claim.routeAvailability.includes(routeId);
    const observedState = routeAllowsClaim ? states.get(claim.propositionId) ?? 'not_measured' : 'not_measured';
    return { ...claim, observedState, relation: relationFor(observedState, claim.expectedState) };
  });
  const comparable = claims.filter(claim => claim.publicUse === 'comparison');
  const coverage = {
    comparisonClaims: comparable.length,
    overlap: comparable.filter(claim => claim.relation === 'overlap').length,
    divergence: comparable.filter(claim => claim.relation === 'divergence').length,
    mixed: comparable.filter(claim => claim.relation === 'mixed').length,
    notMeasured: comparable.filter(claim => claim.relation === 'not_measured').length,
    insufficient: comparable.filter(claim => claim.relation === 'insufficient_evidence').length
  };

  if (routeAware) {
    return {
      schemaVersion: '1.1.0',
      profileId: profile.id,
      label: profile.label,
      modelVersion: model.modelVersion,
      routePolicyVersion: routes.policyVersion,
      routeId,
      claims,
      coverage,
      limitations: [...profile.limitations]
    };
  }

  return {
    schemaVersion: '1.0.0',
    profileId: profile.id,
    label: profile.label,
    modelVersion: model.modelVersion,
    publicIdentityLabel: null,
    percentageMatchAllowed: false,
    aggregateScore: null,
    claims,
    coverage,
    limitations: [...profile.limitations]
  };
}
