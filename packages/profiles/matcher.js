const clamp01 = (value) => Math.max(0, Math.min(1, value));

const normalizeEstimate = (value) => {
  if (typeof value === "number") {
    return { estimate:value, coverage:1 };
  }
  if (!value || typeof value !== "object") return null;
  if (typeof value.estimate !== "number") return null;
  return {
    estimate:value.estimate,
    coverage:typeof value.coverage === "number" ? clamp01(value.coverage) : 1
  };
};

const evaluateGate = (gate, input) => {
  if (gate.kind === "probe") {
    const value = input.probeResponses?.[gate.probeId];
    if (value === undefined || value === null) {
      return { state:"missing", gate, observed:null };
    }
    return {
      state:gate.acceptedValues.includes(value) ? "passed" : "failed",
      gate,
      observed:value
    };
  }

  if (gate.kind === "construct") {
    const observed = normalizeEstimate(input.constructEstimates?.[gate.constructId]);
    if (!observed) return { state:"missing", gate, observed:null };
    if (typeof gate.min === "number" && observed.estimate < gate.min) {
      return { state:"failed", gate, observed };
    }
    if (typeof gate.max === "number" && observed.estimate > gate.max) {
      return { state:"failed", gate, observed };
    }
    return { state:"passed", gate, observed };
  }

  throw new Error("Unsupported profile gate kind: " + gate.kind);
};

const softAffinity = (profile, input) => {
  const totalWeight = profile.softTargets.reduce((sum, target) => sum + target.weight, 0);
  let observedWeight = 0;
  let weightedSimilarity = 0;
  const details = [];

  for (const target of profile.softTargets) {
    const observed = normalizeEstimate(input.constructEstimates?.[target.constructId]);
    if (!observed) {
      details.push({
        constructId:target.constructId,
        state:"missing",
        target:target.target,
        weight:target.weight
      });
      continue;
    }

    const coverageWeight = target.weight * observed.coverage;
    const distance = Math.abs(observed.estimate - target.target);
    const similarity = clamp01(1 - distance / 2);

    observedWeight += coverageWeight;
    weightedSimilarity += similarity * coverageWeight;

    details.push({
      constructId:target.constructId,
      state:"observed",
      target:target.target,
      observed:observed.estimate,
      coverage:observed.coverage,
      weight:target.weight,
      similarity
    });
  }

  return {
    affinity:observedWeight > 0 ? weightedSimilarity / observedWeight : null,
    evidenceCoverage:totalWeight > 0 ? observedWeight / totalWeight : 0,
    details
  };
};

const identityConfirmed = (profile, input) => {
  if (!profile.identityConfirmation?.required) return true;
  const value = input.identityConfirmations?.[profile.id];
  return profile.identityConfirmation.acceptedValues.includes(value);
};

export function evaluateProfile({ profile, catalog, policy, input }) {
  const gateResults = profile.hardGates.map((gate) => evaluateGate(gate, input));
  const failedGates = gateResults.filter((result) => result.state === "failed");
  const missingGates = gateResults.filter((result) => result.state === "missing");
  const affinity = softAffinity(profile, input);

  let state;
  if (failedGates.length) {
    state = policy.hardGateRules.failed;
  } else if (missingGates.length) {
    state = policy.hardGateRules.missing;
  } else if (affinity.evidenceCoverage < policy.minimumSoftEvidenceCoverage) {
    state = "underdetermined";
  } else if (affinity.affinity === null || affinity.affinity < policy.minimumAffinityForEligible) {
    state = "low_affinity";
  } else {
    state = "eligible_unconfirmed";
  }

  const confirmed = state === "eligible_unconfirmed" && identityConfirmed(profile, input);
  const identityAllowed =
    catalog.identityOutputAllowed === true &&
    policy.identityMode === "explicit_confirmation_required";

  if (confirmed && identityAllowed) state = "confirmed_identity";

  const divergences = affinity.details
    .filter((detail) =>
      detail.state === "observed" &&
      detail.similarity < policy.minimumAffinityForEligible
    )
    .sort((a, b) => a.similarity - b.similarity);

  return {
    profileId:profile.id,
    label:profile.label,
    state,
    affinity:affinity.affinity,
    evidenceCoverage:affinity.evidenceCoverage,
    hardGates:{
      passed:gateResults.filter((result) => result.state === "passed"),
      failed:failedGates,
      missing:missingGates
    },
    divergences,
    identityConfirmed:confirmed,
    publicIdentityLabel:state === "confirmed_identity" ? profile.identityLabel : null
  };
}

export function matchProfiles({ catalog, policy, input }) {
  const candidates = catalog.profiles.map((profile) =>
    evaluateProfile({ profile, catalog, policy, input })
  );

  const eligible = candidates
    .filter((candidate) =>
      candidate.state === "eligible_unconfirmed" ||
      candidate.state === "confirmed_identity"
    )
    .sort((a, b) => (b.affinity ?? -1) - (a.affinity ?? -1));

  let state = "no_match";
  let selectedProfileId = null;
  let publicIdentityLabel = null;

  if (eligible.length) {
    const first = eligible[0];
    const second = eligible[1];
    if (
      second &&
      first.affinity !== null &&
      second.affinity !== null &&
      Math.abs(first.affinity - second.affinity) < policy.ambiguityMargin
    ) {
      state = "ambiguous";
    } else if (first.state === "confirmed_identity") {
      state = "confirmed_identity";
      selectedProfileId = first.profileId;
      publicIdentityLabel = first.publicIdentityLabel;
    } else {
      state = "affinity_only";
      selectedProfileId = first.profileId;
    }
  } else if (candidates.some((candidate) => candidate.state === "underdetermined")) {
    state = "underdetermined";
  }

  return {
    schemaVersion:"1.0.0",
    policyVersion:policy.policyVersion,
    catalogVersion:catalog.catalogVersion,
    state,
    selectedProfileId,
    publicIdentityLabel,
    percentageMatchAllowed:policy.percentageMatchAllowed,
    publicScoreLabel:policy.publicScoreLabel,
    candidates
  };
}
