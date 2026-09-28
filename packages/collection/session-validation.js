import {
  generatePilotPacket,
  isItemEligible,
  responseMapFor,
  validateResponseValue
} from "../runtime/index.js";

export class SessionValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "SessionValidationError";
    this.statusCode = 400;
    this.details = details;
  }
}

const fail = (details, message) => details.push(message);

const assertAllowedKeys = (details, value, allowed, label) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(details, label + " contains unknown field: " + key);
  }
};

const TOP_LEVEL_KEYS = new Set([
  "schemaVersion","pilotId","instrumentVersion","bankVersion","packetId","sessionId",
  "respondentKey","locale","clientVersion","randomizationSeed","startedAt","completedAt",
  "completionStatus","presentedItems","responses","resultSnapshotRefs"
]);
const PRESENTED_KEYS = new Set([
  "index","itemId","itemRevision","domainId","responseScaleId",
  "presented","skippedByBranch","presentedAt"
]);
const RESPONSE_KEYS = new Set([
  "itemId","itemRevision","state","value","responseTimeMs","changedAnswerCount","answeredAt"
]);

export function validateSubmittedSession({ session, bank, pilot, instrument, scalesDoc }) {
  const details = [];

  if (!session || typeof session !== "object" || Array.isArray(session)) {
    throw new SessionValidationError("Session body must be a JSON object.");
  }

  assertAllowedKeys(details, session, TOP_LEVEL_KEYS, "session");

  if (session.pilotId !== pilot.pilotId) fail(details, "pilotId mismatch");
  if (session.bankVersion !== bank.bankVersion) fail(details, "bankVersion mismatch");
  if (session.instrumentVersion !== instrument.instrumentVersion) fail(details, "instrumentVersion mismatch");
  if (typeof session.sessionId !== "string" || !/^[A-Za-z0-9._-]{8,128}$/.test(session.sessionId)) {
    fail(details, "sessionId must be 8-128 characters using A-Z, a-z, 0-9, dot, underscore, or hyphen");
  }
  if (session.respondentKey !== null && session.respondentKey !== undefined) {
    if (typeof session.respondentKey !== "string" || !/^[A-Za-z0-9._-]{8,128}$/.test(session.respondentKey)) {
      fail(details, "respondentKey must be null or an opaque 8-128 character identifier");
    }
  }
  if (!Array.isArray(session.presentedItems)) fail(details, "presentedItems must be an array");
  if (!Array.isArray(session.responses)) fail(details, "responses must be an array");

  if (details.length) throw new SessionValidationError("Session metadata is invalid.", details);

  const packetSize = session.presentedItems.length;
  if (
    packetSize < pilot.administration.allowedPacketSize.min ||
    packetSize > pilot.administration.allowedPacketSize.max
  ) {
    fail(details, "presentedItems length is outside the allowed pilot packet range");
  }

  let expectedPacket = null;
  try {
    expectedPacket = generatePilotPacket({
      bank,
      pilot,
      seed: session.randomizationSeed,
      size: packetSize,
      packetId: session.packetId
    });
  } catch (error) {
    fail(details, "unable to regenerate submitted packet: " + error.message);
  }

  const itemMap = new Map(bank.items.map((item) => [item.id, item]));
  const scaleMap = new Map(scalesDoc.scales.map((scale) => [scale.id, scale]));

  if (expectedPacket) {
    if (session.packetId !== expectedPacket.packetId) fail(details, "packetId mismatch");
    if (expectedPacket.entries.length !== session.presentedItems.length) {
      fail(details, "packet length mismatch");
    } else {
      for (let index = 0; index < expectedPacket.entries.length; index++) {
        const expected = expectedPacket.entries[index];
        const actual = session.presentedItems[index];
        if (!actual || actual.index !== index) fail(details, "presentation index mismatch at " + index);
        if (actual?.itemId !== expected.itemId) fail(details, "itemId mismatch at presentation index " + index);
        if (actual?.itemRevision !== expected.itemRevision) fail(details, "itemRevision mismatch for " + expected.itemId);
        if (actual?.domainId !== expected.domainId) fail(details, "domainId mismatch for " + expected.itemId);
        if (actual?.responseScaleId !== expected.responseScaleId) fail(details, "responseScaleId mismatch for " + expected.itemId);
      }
    }
  }

  for (const entry of session.presentedItems) {
    assertAllowedKeys(details, entry, PRESENTED_KEYS, "presented item");
  }

  const responseIds = new Set();
  for (const response of session.responses) {
    assertAllowedKeys(details, response, RESPONSE_KEYS, "response");
    if (responseIds.has(response.itemId)) {
      fail(details, "duplicate response for " + response.itemId);
      continue;
    }
    responseIds.add(response.itemId);

    const entry = session.presentedItems.find((presented) => presented.itemId === response.itemId);
    if (!entry) {
      fail(details, "response references item not assigned to packet: " + response.itemId);
      continue;
    }
    const item = itemMap.get(response.itemId);
    if (!item) {
      fail(details, "response references unknown item: " + response.itemId);
      continue;
    }
    if (response.itemRevision !== item.revision || response.itemRevision !== entry.itemRevision) {
      fail(details, "response revision mismatch for " + response.itemId);
      continue;
    }
    const scale = scaleMap.get(item.responseScaleId);
    if (!scale) {
      fail(details, "unknown response scale for " + response.itemId);
      continue;
    }
    try {
      validateResponseValue(item, scale, response.state, response.value);
    } catch (error) {
      fail(details, "invalid response for " + response.itemId + ": " + error.message);
    }
    if (
      response.responseTimeMs !== null &&
      (!Number.isInteger(response.responseTimeMs) || response.responseTimeMs < 0 || response.responseTimeMs > 86400000)
    ) {
      fail(details, "invalid responseTimeMs for " + response.itemId);
    }
    if (!Number.isInteger(response.changedAnswerCount) || response.changedAnswerCount < 0) {
      fail(details, "invalid changedAnswerCount for " + response.itemId);
    }
  }

  const responses = responseMapFor(session);
  for (const entry of session.presentedItems) {
    const item = itemMap.get(entry.itemId);
    if (!item) continue;
    let eligible = false;
    try {
      eligible = isItemEligible(item, responses);
    } catch (error) {
      fail(details, "eligibility error for " + entry.itemId + ": " + error.message);
      continue;
    }

    const response = responses.get(entry.itemId);
    if (entry.skippedByBranch && eligible) {
      fail(details, entry.itemId + " is marked branch-skipped but is eligible under final prerequisite responses");
    }
    if (entry.presented && !eligible) {
      fail(details, entry.itemId + " is marked presented but is ineligible under final prerequisite responses");
    }
    if (response && !entry.presented) {
      fail(details, entry.itemId + " has a response but is not marked presented");
    }
    if (entry.presented && entry.skippedByBranch) {
      fail(details, entry.itemId + " cannot be both presented and branch-skipped");
    }
  }

  if (session.completionStatus === "completed") {
    for (const entry of session.presentedItems) {
      const item = itemMap.get(entry.itemId);
      if (!item) continue;
      const eligible = isItemEligible(item, responses);
      if (eligible) {
        if (!entry.presented) fail(details, entry.itemId + " is eligible but was never presented in completed session");
        if (!responses.has(entry.itemId)) fail(details, entry.itemId + " is eligible but missing response in completed session");
      } else if (!entry.skippedByBranch) {
        fail(details, entry.itemId + " is ineligible but not marked branch-skipped in completed session");
      }
    }
    if (typeof session.completedAt !== "string" || !session.completedAt) {
      fail(details, "completed session must include completedAt");
    }
  }

  if (details.length) {
    throw new SessionValidationError("Submitted pilot session failed validation.", details);
  }

  return {
    sessionId: session.sessionId,
    packetSize,
    responseCount: session.responses.length,
    completionStatus: session.completionStatus
  };
}
