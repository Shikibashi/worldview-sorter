import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  generatePilotPacket,
  createPilotSession,
  isItemEligible,
  markPresented,
  markBranchSkipped,
  recordResponse,
  clearAfterIndex,
  validateResponseValue,
  shuffleWithSeed
} from "../packages/runtime/index.js";

const root = new URL("../", import.meta.url);
const load = async (p) => JSON.parse(await readFile(new URL(p, root), "utf8"));

const current = await load("data/current.json");
const pilot = await load(current.pilot.path);
const bank = await load(current.candidateBank.path);
const scales = await load("data/response-scales.json");

const packetA = generatePilotPacket({ bank, pilot, seed:"runtime-test", size:120, packetId:"runtime-test" });
const packetB = generatePilotPacket({ bank, pilot, seed:"runtime-test", size:120, packetId:"runtime-test" });
assert.deepEqual(packetA, packetB, "same seed must generate identical packet");
assert.equal(packetA.entries.length, 120);

const indexById = new Map(packetA.entries.map((entry) => [entry.itemId, entry.index]));
const bankMap = new Map(bank.items.map((item) => [item.id, item]));
for (const entry of packetA.entries) {
  const item = bankMap.get(entry.itemId);
  if (item.eligibility?.mode !== "conditional") continue;
  for (const condition of item.eligibility.all) {
    assert.ok(indexById.has(condition.itemId), `packet must include prerequisite ${condition.itemId}`);
    assert.ok(indexById.get(condition.itemId) < entry.index, "prerequisite must precede dependent item");
  }
}

const session = createPilotSession({
  pilot,
  packet:packetA,
  locale:"en-US",
  clientVersion:"test",
  sessionId:"test-session"
});
assert.equal(session.responses.length, 0);
assert.equal(session.presentedItems.length, 120);

const conditional = bank.items.find((item) => item.id === "RCI002");
assert.ok(conditional);
assert.equal(isItemEligible(conditional, new Map()), false);
assert.equal(
  isItemEligible(conditional, new Map([[
    "RCI001",
    { itemId:"RCI001", itemRevision:1, state:"answered", value:"personal_divine" }
  ]])),
  true
);

const first = packetA.entries[0];
markPresented(session, 0, "2026-09-28T00:00:00Z");
assert.equal(session.presentedItems[0].presented, true);

const firstItem = bankMap.get(first.itemId);
const firstScale = scales.scales.find((scale) => scale.id === firstItem.responseScaleId);
if (firstItem.responseType === "likert") {
  const value = firstScale.options.find((option) => option.value === 1)?.value ?? firstScale.options[0].value;
  assert.equal(validateResponseValue(firstItem, firstScale, "answered", value), true);
}

recordResponse(session, {
  itemId:first.itemId,
  itemRevision:first.itemRevision,
  state:"no_view",
  value:null,
  responseTimeMs:1000,
  answeredAt:"2026-09-28T00:00:01Z"
});
assert.equal(session.responses.length, 1);

if (session.presentedItems.length > 2) {
  markPresented(session, 1);
  markPresented(session, 2);
  recordResponse(session, {
    itemId:packetA.entries[2].itemId,
    itemRevision:packetA.entries[2].itemRevision,
    state:"no_view",
    value:null
  });
  clearAfterIndex(session, 0);
  assert.equal(session.responses.some((response) => response.itemId === packetA.entries[2].itemId), false);
  assert.equal(session.presentedItems[2].presented, false);
}

const ranked = shuffleWithSeed(["a","b","c","d"], "same-seed");
assert.deepEqual(ranked, shuffleWithSeed(["a","b","c","d"], "same-seed"));

markBranchSkipped(session, Math.min(1, session.presentedItems.length - 1));
assert.equal(session.presentedItems[Math.min(1, session.presentedItems.length - 1)].skippedByBranch, true);

console.log("Runtime tests passed.");
