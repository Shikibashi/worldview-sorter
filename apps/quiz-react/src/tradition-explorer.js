// Presentation only: consume the public, interpreted summary. Never score answers,
// load internal reference profiles, or turn a missing observation into a position.
const OPEN_STATES = new Set(['not_measured', 'insufficient_evidence', 'mixed', 'mixed_context_dependent', 'leaned_toward']);
const FINDINGS = new Set(['overlap', 'divergence', 'unresolved', 'contradictory', 'partial', 'unmeasured']);
const fold = value => String(value ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

export function filterTraditions(summary, query = '') {
  const needle = fold(query);
  return (summary?.affinities?.traditions ?? []).filter(tradition => fold(tradition.name).includes(needle));
}

export function inspectTradition(summary, traditionId) {
  const tradition = summary?.affinities?.traditions?.find(candidate => candidate.id === traditionId);
  if (!tradition) return null;
  const rows = new Map((summary.rows ?? []).map(row => [row.id, row]));
  const sources = new Map((tradition.sources ?? []).map(source => [source.id, source]));
  const criteria = (tradition.criteria ?? []).map(criterion => {
    const proposition = rows.get(criterion.mapping?.propositionId) ?? null;
    let finding = FINDINGS.has(criterion.finding) ? criterion.finding : 'unavailable';
    // Keep presentation qualification separate from the historical engine finding.
    if (criterion.mapping?.propositionId) {
      if (!proposition) finding = 'unavailable';
      else if (proposition.presentationReview?.state !== 'eligible') finding = 'under_review';
    }
    return { criterion, proposition, finding,
      sources: (criterion.sourceIds ?? []).map(id => sources.get(id)).filter(Boolean) };
  });
  const gapIds = new Set(criteria.filter(({ criterion, proposition, finding }) =>
    criterion.mapping?.status === 'direct' && proposition?.inferenceStatus === 'direct' &&
    proposition.presentationReview?.state === 'eligible' && OPEN_STATES.has(proposition.status) &&
    ['unmeasured', 'unresolved', 'contradictory'].includes(finding)
  ).map(entry => entry.proposition.domainId));
  return {
    id: tradition.id, name: tradition.name, context: tradition.context,
    state: summary.affinityPresentation?.traditions?.find(row => row.traditionId === tradition.id)?.state ?? tradition.summaryState,
    criteria, nonEntailments: tradition.nonEntailments ?? [],
    gapDomains: (summary.domains ?? []).filter(domain => gapIds.has(domain.id)).map(({ id, title }) => ({ id, title }))
  };
}

// The existing reviewed planner owns eligibility, budget, and question selection.
// This function only gates an optional domain-level action already offered by App.
export function clarificationForTradition(view, depth, replayQualification) {
  if (replayQualification || depth?.available !== true ||
      !view?.gapDomains.some(domain => domain.id === depth.domainId) ||
      !Number.isInteger(depth.clarificationCount) || depth.clarificationCount <= 0) return null;
  return { domainId: depth.domainId, count: depth.clarificationCount, reason: depth.clarificationReason ?? '' };
}
