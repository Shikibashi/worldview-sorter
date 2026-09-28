import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  generatePilotPacket,
  createPilotSession,
  isItemEligible,
  responseMapFor,
  markPresented,
  markBranchSkipped,
  recordResponse,
  finishSession
} from "../packages/runtime/index.js";

const root = new URL("../", import.meta.url);
const load = async (relative) => JSON.parse(await readFile(new URL(relative, root), "utf8"));

const current = await load("data/current.json");
const [bank, pilot, behavior, scalesDoc] = await Promise.all([
  load(current.candidateBank.path),
  load(current.pilot.path),
  load(current.uiBehavior.path),
  load("data/response-scales.json")
]);

assert.equal(behavior.interactionModel, "single_question");
assert.equal(behavior.autoAdvance.supported, true);
assert.equal(behavior.autoAdvance.defaultEnabled, true);
assert.equal(behavior.autoAdvance.delayMs, 200);
assert.equal(behavior.navigation.back, true);
assert.equal(behavior.navigation.manualNext, true);
assert.equal(behavior.progress.showCurrentAndTotal, true);
assert.equal(behavior.progress.showPercent, true);
assert.equal(behavior.answerFeedback.showSelectedState, true);
assert.equal(behavior.completion.submitRemoteWhenAvailable, true);

const presetSizes = Object.fromEntries(behavior.presets.map((preset) => [preset.id, preset.size]));
assert.deepEqual(presetSizes, { short:80, standard:120, long:160 });

const bankDomainCounts = {};
for (const item of bank.items) bankDomainCounts[item.domainId] = (bankDomainCounts[item.domainId] ?? 0) + 1;

const checkPacket = (packet) => {
  assert.equal(packet.entries.length, packet.size);
  const ids = packet.entries.map((entry) => entry.itemId);
  assert.equal(new Set(ids).size, ids.length, "packet must not contain duplicate items");

  const indexById = new Map(packet.entries.map((entry) => [entry.itemId, entry.index]));
  let previousDomain = null;
  let run = 0;

  for (const entry of packet.entries) {
    const item = bank.items.find((candidate) => candidate.id === entry.itemId);
    assert.ok(item, "packet item must exist");

    if (entry.domainId === previousDomain) run += 1;
    else {
      previousDomain = entry.domainId;
      run = 1;
    }
    assert.ok(run <= 2, "must not show more than two same-domain questions consecutively");

    if (item.eligibility?.mode === "conditional") {
      for (const condition of item.eligibility.all) {
        assert.ok(indexById.has(condition.itemId), "conditional item must include prerequisite");
        assert.ok(indexById.get(condition.itemId) < entry.index, "prerequisite must appear before dependent item");
      }
    }
  }

  const actualByDomain = {};
  for (const entry of packet.entries) actualByDomain[entry.domainId] = (actualByDomain[entry.domainId] ?? 0) + 1;
  for (const [domainId, poolCount] of Object.entries(bankDomainCounts)) {
    const expected = packet.size * poolCount / bank.items.length;
    const actual = actualByDomain[domainId] ?? 0;
    assert.ok(Math.abs(actual - expected) <= 1.1, "domain-proportional packet drift for " + domainId);
  }
};

for (const preset of behavior.presets) {
  for (let i = 0; i < 40; i++) {
    const seed = "parity-" + preset.id + "-" + i;
    const packet = generatePilotPacket({
      bank,
      pilot,
      seed,
      size:preset.size,
      packetId:"packet-" + seed
    });
    checkPacket(packet);
    const duplicate = generatePilotPacket({
      bank,
      pilot,
      seed,
      size:preset.size,
      packetId:"packet-" + seed
    });
    assert.deepEqual(packet, duplicate, "same seed must be deterministic");
  }
}

const itemMap = new Map(bank.items.map((item) => [item.id, item]));
const scaleMap = new Map(scalesDoc.scales.map((scale) => [scale.id, scale]));

const answerValue = (item) => {
  const scale = scaleMap.get(item.responseScaleId);
  if (item.responseType === "likert" || item.responseType === "paired_choice") {
    return scale.options[Math.floor(scale.options.length / 2)].value;
  }
  if (item.responseType === "single_choice" || item.responseType === "vignette_choice") {
    return item.options[0].id;
  }
  if (item.responseType === "ranking") return item.options.map((option) => option.id);
  throw new Error("unsupported response type");
};

for (const preset of behavior.presets) {
  const packet = generatePilotPacket({
    bank,
    pilot,
    seed:"flow-" + preset.id,
    size:preset.size,
    packetId:"flow-" + preset.id
  });
  const session = createPilotSession({
    pilot,
    packet,
    locale:"en-US",
    clientVersion:"parity-test",
    sessionId:"parity-session-" + preset.id
  });

  for (const entry of packet.entries) {
    const item = itemMap.get(entry.itemId);
    if (!isItemEligible(item, responseMapFor(session))) {
      markBranchSkipped(session, entry.index);
      continue;
    }
    markPresented(session, entry.index);
    recordResponse(session, {
      itemId:item.id,
      itemRevision:item.revision,
      state:"answered",
      value:answerValue(item),
      responseTimeMs:behavior.autoAdvance.delayMs + 500
    });
  }
  finishSession(session);
  const accounted = session.responses.length +
    session.presentedItems.filter((entry) => entry.skippedByBranch).length;
  assert.equal(accounted, packet.size, "every packet position should be answered or branch-skipped");
  assert.equal(session.completionStatus, "completed");
}

console.log("12Axes-style interaction parity tests passed across 120 generated packets and all presets.");
