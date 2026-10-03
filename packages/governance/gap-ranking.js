// Gap ranking generator: classifies Full-route gaps into actionable research tiers
// by consuming content-review dispositions, local-dependence exclusions, and bank evidence contracts.

export const EXCLUSION_ISSUES = Object.freeze([
  'near_duplicate_local_dependence',
  'semantic_redundancy',
  'local_dependence_risk',
  'rewrite_candidate'
]);

export function evaluateItemContentReview(itemRef, contentReview) {
  const itemId = typeof itemRef === 'string' ? itemRef : itemRef.itemId;
  const decision = (contentReview?.decisions ?? []).find(d => d.itemId === itemId);
  if (!decision) return {itemId, excluded: false, decision: null, issue: null, rationale: null, hasRecordedReview: false};

  const isRemoved = decision.decision === 'remove_from_pilot' || decision.resultUse === 'none_in_frozen_route';
  const hasExclusionIssue = EXCLUSION_ISSUES.includes(decision.issue);
  const excluded = isRemoved || hasExclusionIssue;

  return {
    itemId,
    excluded,
    decision: decision.decision ?? null,
    issue: decision.issue ?? null,
    resultUse: decision.resultUse ?? null,
    rationale: decision.rationale ?? null,
    pairedWith: decision.pairedWith ?? null,
    hasRecordedReview: true
  };
}

export function rankFullRouteGaps({ gaps, contentReview, bank }) {
  const ranked = [];

  for (const gap of gaps) {
    const outsideItems = gap.outsideRouteEvidenceItemRefs ?? [];
    const itemReviews = outsideItems.map(ref => evaluateItemContentReview(ref, contentReview));
    const excludedReviews = itemReviews.filter(r => r.excluded);
    const hasExcludedItem = excludedReviews.length > 0;

    let tier;
    let tierLabel;
    let actionRecommendation;

    if (gap.gapClass === 'bank_directional_contract_gap') {
      tier = 'tier_4_bank_directional_contract_gap';
      tierLabel = 'Tier 4: Bank directional contract gap';
      actionRecommendation = 'Candidate bank lacks opposing units (<2 oppose). Requires authoring new contrasting item revisions or revising directional rule semantics.';
    } else if (gap.gapClass === 'all_evidence_omitted_by_frozen_route') {
      tier = 'tier_3_bank_ready_route_admission';
      tierLabel = 'Tier 3: Bank-ready route admission';
      actionRecommendation = 'Complete 2-support / 2-oppose authored evidence paths exist in bank with clean content review; omitted solely by route length.';
    } else if (hasExcludedItem) {
      tier = 'tier_2_content_blocked_route_gap';
      tierLabel = 'Tier 2: Content-blocked / rewrite-required route gap';
      const issues = excludedReviews.map(r => `${r.itemId} (${r.issue || r.decision})`).join(', ');
      actionRecommendation = `Mathematically route-near, but blocked by content-review exclusion: ${issues}. Prohibited from route admission without a replacement non-duplicate item revision.`;
    } else {
      tier = 'tier_1_route_near_completion_candidate';
      tierLabel = 'Tier 1: Route-near completion candidate';
      if (gap.ruleId === 'moral-limits-validity') {
        actionRecommendation = 'Assigned item is PLI073@1. Missing bank item PLI072@1 has no recorded pilot review decision. Substantive conceptual blockers (inclusive positivism overlap, conflation of defective law with invalidity in PLI073, and Radbruch threshold coherence against source-based-validity) require narrowing target proposition and co-reviewing both PL21 rules before route admission.';
      } else {
        actionRecommendation = 'Single missing bank item has no content-review exclusion. Requires substantive semantic review of proposition and item balance before route admission.';
      }
    }

    ranked.push({
      ...gap,
      tier,
      tierLabel,
      actionRecommendation,
      outsideItemReviews: itemReviews,
      hasContentReviewExclusion: hasExcludedItem,
      excludedItems: excludedReviews
    });
  }

  // Stable sort: tier order, then domainId, then ruleId
  const tierOrder = {
    tier_1_route_near_completion_candidate: 1,
    tier_2_content_blocked_route_gap: 2,
    tier_3_bank_ready_route_admission: 3,
    tier_4_bank_directional_contract_gap: 4
  };

  ranked.sort((a, b) => (tierOrder[a.tier] - tierOrder[b.tier]) ||
    a.domainId.localeCompare(b.domainId) ||
    a.ruleId.localeCompare(b.ruleId)
  );

  const tierCounts = Object.fromEntries(
    Object.keys(tierOrder).map(t => [t, ranked.filter(g => g.tier === t).length])
  );

  return {
    gaps: ranked,
    tierCounts,
    tierOrder
  };
}
