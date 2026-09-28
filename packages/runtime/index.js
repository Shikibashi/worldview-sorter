const hashString = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const seededRandom = (seed) => {
  let a = hashString(String(seed));
  return () => {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

export const shuffleWithSeed = (values, seed) => {
  const random = seededRandom(seed);
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const prerequisiteIds = (item) =>
  item.eligibility?.mode === "conditional"
    ? item.eligibility.all.map((condition) => condition.itemId)
    : [];

export function generatePilotPacket({ bank, pilot, seed, size, packetId }) {
  if (!Number.isInteger(size)) throw new Error("packet size must be an integer");
  if (size < pilot.administration.allowedPacketSize.min || size > pilot.administration.allowedPacketSize.max) {
    throw new Error(
      `packet size must be between ${pilot.administration.allowedPacketSize.min} and ${pilot.administration.allowedPacketSize.max}`
    );
  }
  if (size > bank.items.length) throw new Error("packet size exceeds bank size");

  const byDomain = new Map();
  for (const item of bank.items) {
    if (!byDomain.has(item.domainId)) byDomain.set(item.domainId, []);
    byDomain.get(item.domainId).push(item);
  }

  const domainRows = [...byDomain.entries()].map(([domainId, items]) => {
    const exact = size * items.length / bank.items.length;
    return {
      domainId,
      items,
      exact,
      quota: Math.floor(exact),
      remainder: exact - Math.floor(exact)
    };
  });

  let assigned = domainRows.reduce((sum, row) => sum + row.quota, 0);
  for (const row of [...domainRows].sort((a, b) =>
    b.remainder - a.remainder || a.domainId.localeCompare(b.domainId)
  )) {
    if (assigned >= size) break;
    row.quota += 1;
    assigned += 1;
  }

  const selected = new Map();
  for (const row of domainRows) {
    for (const item of shuffleWithSeed(row.items, `${seed}:domain:${row.domainId}`).slice(0, row.quota)) {
      selected.set(item.id, item);
    }
  }

  const itemMap = new Map(bank.items.map((item) => [item.id, item]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of [...selected.values()]) {
      for (const prereqId of prerequisiteIds(item)) {
        if (selected.has(prereqId)) continue;
        const prereq = itemMap.get(prereqId);
        if (!prereq) throw new Error(`missing prerequisite ${prereqId}`);

        const dependentIds = new Set(
          [...selected.values()].flatMap((candidate) => prerequisiteIds(candidate))
        );
        const removable = [...selected.values()]
          .filter((candidate) =>
            candidate.domainId === prereq.domainId &&
            candidate.id !== item.id &&
            prerequisiteIds(candidate).length === 0 &&
            !dependentIds.has(candidate.id)
          )
          .sort((a, b) => a.id.localeCompare(b.id))[0];

        if (!removable) throw new Error(`cannot make room for prerequisite ${prereqId}`);
        selected.delete(removable.id);
        selected.set(prereq.id, prereq);
        changed = true;
      }
    }
  }

  if (selected.size !== size) throw new Error(`packet size drifted to ${selected.size}`);

  const dependencies = new Map([...selected.keys()].map((id) => [id, new Set()]));
  for (const item of selected.values()) {
    for (const prereqId of prerequisiteIds(item)) {
      if (selected.has(prereqId)) dependencies.get(item.id).add(prereqId);
    }
  }

  const ordered = [];
  const remaining = new Set(selected.keys());
  let previousDomain = null;
  let sameDomainRun = 0;
  const maxSameDomainConsecutive =
    pilot.administration?.maxSameDomainConsecutive ?? 2;

  while (remaining.size) {
    const available = [...remaining].filter((id) =>
      [...dependencies.get(id)].every((dependency) => !remaining.has(dependency))
    );
    if (!available.length) throw new Error("dependency cycle in selected packet");

    const ranked = shuffleWithSeed(
      available,
      `${seed}:order:${ordered.length}:${available.join(",")}`
    );

    let chosen = ranked.find((id) => {
      const domainId = selected.get(id).domainId;
      return !(domainId === previousDomain && sameDomainRun >= maxSameDomainConsecutive);
    });

    chosen ??= ranked[0];

    const domainId = selected.get(chosen).domainId;
    if (domainId === previousDomain) sameDomainRun += 1;
    else {
      previousDomain = domainId;
      sameDomainRun = 1;
    }

    ordered.push(chosen);
    remaining.delete(chosen);
  }

  return {
    schemaVersion: "1.0.0",
    pilotId: pilot.pilotId,
    packetId: packetId ?? `${pilot.pilotId}-${seed}`,
    seed: String(seed),
    bankVersion: bank.bankVersion,
    sourceInstrumentVersion: pilot.sourceInstrumentVersion,
    size: ordered.length,
    selectionMethod: pilot.administration.packetSelection,
    entries: ordered.map((id, index) => {
      const item = selected.get(id);
      return {
        index,
        itemId: item.id,
        itemRevision: item.revision,
        domainId: item.domainId,
        responseScaleId: item.responseScaleId
      };
    })
  };
}

export function isItemEligible(item, responseMap) {
  if (!item.eligibility || item.eligibility.mode === "always") return true;
  if (item.eligibility.mode !== "conditional") {
    throw new Error(`unsupported eligibility mode ${item.eligibility.mode}`);
  }

  return item.eligibility.all.every((condition) => {
    if (condition.kind !== "response_option_in") {
      throw new Error(`unsupported eligibility condition ${condition.kind}`);
    }
    const response = responseMap.get(condition.itemId);
    return response?.state === "answered" &&
      typeof response.value === "string" &&
      condition.optionIds.includes(response.value);
  });
}

export function createPilotSession({
  pilot,
  packet,
  locale = "en-US",
  clientVersion = "web-dev",
  sessionId,
  respondentKey = null,
  startedAt = new Date().toISOString()
}) {
  if (!sessionId) throw new Error("sessionId is required");
  return {
    schemaVersion: "1.0.0",
    pilotId: pilot.pilotId,
    instrumentVersion: packet.sourceInstrumentVersion,
    bankVersion: packet.bankVersion,
    packetId: packet.packetId,
    sessionId,
    respondentKey,
    locale,
    clientVersion,
    randomizationSeed: packet.seed,
    startedAt,
    completedAt: null,
    completionStatus: "in_progress",
    presentedItems: packet.entries.map((entry) => ({
      index: entry.index,
      itemId: entry.itemId,
      itemRevision: entry.itemRevision,
      domainId: entry.domainId,
      responseScaleId: entry.responseScaleId,
      presented: false,
      skippedByBranch: false,
      presentedAt: null
    })),
    responses: [],
    resultSnapshotRefs: []
  };
}

export function responseMapFor(session) {
  return new Map(session.responses.map((response) => [response.itemId, response]));
}

export function markPresented(session, index, at = new Date().toISOString()) {
  const entry = session.presentedItems[index];
  if (!entry) throw new Error(`unknown presentation index ${index}`);
  entry.presented = true;
  entry.skippedByBranch = false;
  entry.presentedAt ??= at;
  return session;
}

export function markBranchSkipped(session, index) {
  const entry = session.presentedItems[index];
  if (!entry) throw new Error(`unknown presentation index ${index}`);
  entry.presented = false;
  entry.skippedByBranch = true;
  entry.presentedAt = null;
  session.responses = session.responses.filter((response) => response.itemId !== entry.itemId);
  return session;
}

export function clearAfterIndex(session, index) {
  const laterIds = new Set(
    session.presentedItems.filter((entry) => entry.index > index).map((entry) => entry.itemId)
  );
  session.responses = session.responses.filter((response) => !laterIds.has(response.itemId));
  for (const entry of session.presentedItems) {
    if (entry.index <= index) continue;
    entry.presented = false;
    entry.skippedByBranch = false;
    entry.presentedAt = null;
  }
  session.completedAt = null;
  session.completionStatus = "in_progress";
  return session;
}

export function recordResponse(session, {
  itemId,
  itemRevision,
  state,
  value,
  responseTimeMs = null,
  answeredAt = new Date().toISOString()
}) {
  const existing = session.responses.find((response) => response.itemId === itemId);
  const changed =
    existing &&
    (existing.state !== state || JSON.stringify(existing.value) !== JSON.stringify(value));

  const next = {
    itemId,
    itemRevision,
    state,
    value,
    responseTimeMs,
    changedAnswerCount: (existing?.changedAnswerCount ?? 0) + (changed ? 1 : 0),
    answeredAt
  };

  session.responses = session.responses.filter((response) => response.itemId !== itemId);
  session.responses.push(next);
  return next;
}

export function finishSession(session, at = new Date().toISOString()) {
  session.completedAt = at;
  session.completionStatus = "completed";
  return session;
}

export function nextEligibleIndex({ session, packet, itemMap, startIndex }) {
  const responses = responseMapFor(session);
  for (let index = startIndex; index < packet.entries.length; index++) {
    const item = itemMap.get(packet.entries[index].itemId);
    if (!item) throw new Error(`packet references missing item ${packet.entries[index].itemId}`);
    if (isItemEligible(item, responses)) return index;
    markBranchSkipped(session, index);
  }
  return null;
}

export function validateResponseValue(item, scale, state, value) {
  if (!item.specialStates.includes(state) && state !== "answered") {
    throw new Error(`${state} is not allowed for ${item.id}`);
  }
  if (state !== "answered") {
    if (value !== null) throw new Error("special response states must use null value");
    return true;
  }

  if (item.responseType === "likert" || item.responseType === "paired_choice") {
    const numeric = new Set(scale.options.map((option) => option.value));
    if (typeof value !== "number" || !numeric.has(value)) throw new Error("invalid numeric response");
    return true;
  }

  if (item.responseType === "single_choice" || item.responseType === "vignette_choice") {
    const ids = new Set(item.options.map((option) => option.id));
    if (typeof value !== "string" || !ids.has(value)) throw new Error("invalid categorical response");
    return true;
  }

  if (item.responseType === "ranking") {
    const ids = item.options.map((option) => option.id);
    if (!Array.isArray(value) || value.length !== ids.length) throw new Error("invalid ranking length");
    const seen = new Set(value);
    if (seen.size !== ids.length || ids.some((id) => !seen.has(id))) throw new Error("invalid ranking values");
    return true;
  }

  throw new Error(`unsupported response type ${item.responseType}`);
}
