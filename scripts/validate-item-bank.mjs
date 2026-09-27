import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const load = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

const domains = (await load("data/domains.json")).domains;
const constructs = (await load("data/constructs.json")).constructs;
const sources = (await load("data/sources.json")).sources;
const scalesDoc = await load("data/response-scales.json");
const bankDoc = await load("data/items/candidate-v0.1.json");
const instrument = await load("data/instruments/prototype-0.1.json");

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.error("FAIL:", message);
};
const pass = (message) => console.log("PASS:", message);

const domainIds = new Set(domains.map((domain) => domain.id));
const constructIds = new Set(constructs.map((construct) => construct.id));
const sourceIds = new Set(sources.map((source) => source.id));
const scaleIds = new Set(scalesDoc.scales.map((scale) => scale.id));
const stateIds = new Set(scalesDoc.responseStates.map((state) => state.id));

const items = bankDoc.items;
const itemIds = new Set();

for (const item of items) {
  if (itemIds.has(item.id)) fail(`duplicate item ID ${item.id}`);
  itemIds.add(item.id);

  if (!domainIds.has(item.domainId)) fail(`${item.id}: unknown domain ${item.domainId}`);
  if (!item.id.startsWith(item.domainId + "I")) {
    fail(`${item.id}: item prefix does not match domain ${item.domainId}`);
  }
  if (!scaleIds.has(item.responseScaleId)) {
    fail(`${item.id}: unknown response scale ${item.responseScaleId}`);
  }

  for (const target of item.targets) {
    if (!constructIds.has(target.constructId)) {
      fail(`${item.id}: unknown target ${target.constructId}`);
    }
  }

  for (const state of item.specialStates) {
    if (!stateIds.has(state)) fail(`${item.id}: unknown special state ${state}`);
  }

  for (const source of item.provenance.sourceRefs) {
    if (!sourceIds.has(source)) fail(`${item.id}: unknown source ${source}`);
  }

  if (
    ["single_choice", "vignette_choice", "ranking", "paired_choice"].includes(item.responseType) &&
    item.options.length < 2
  ) {
    fail(`${item.id}: ${item.responseType} requires inline options`);
  }

  if (item.eligibility.mode === "conditional") {
    for (const condition of item.eligibility.all) {
      const source = items.find((candidate) => candidate.id === condition.itemId);
      if (!source) {
        fail(`${item.id}: branch references unknown item ${condition.itemId}`);
        continue;
      }
      const optionIds = new Set(source.options.map((option) => option.id));
      for (const optionId of condition.optionIds) {
        if (!optionIds.has(optionId)) {
          fail(`${item.id}: branch references unknown option ${condition.itemId}:${optionId}`);
        }
      }
    }
  }
}

if (itemIds.size === items.length) pass(`${items.length} item IDs unique`);

const mirrorGroups = new Map();
for (const item of items) {
  if (!item.mirrorGroup) continue;
  if (!mirrorGroups.has(item.mirrorGroup)) mirrorGroups.set(item.mirrorGroup, []);
  mirrorGroups.get(item.mirrorGroup).push(item);
}

for (const [groupId, pair] of mirrorGroups) {
  if (pair.length !== 2) {
    fail(`${groupId}: mirror group must contain exactly 2 items`);
    continue;
  }

  const firstPositive = new Set(
    pair[0].targets.filter((target) => target.relation === "positive").map((target) => target.constructId)
  );
  const firstNegative = new Set(
    pair[0].targets.filter((target) => target.relation === "negative").map((target) => target.constructId)
  );
  const secondPositive = new Set(
    pair[1].targets.filter((target) => target.relation === "positive").map((target) => target.constructId)
  );
  const secondNegative = new Set(
    pair[1].targets.filter((target) => target.relation === "negative").map((target) => target.constructId)
  );

  const opposed =
    [...firstPositive].some((id) => secondNegative.has(id)) ||
    [...secondPositive].some((id) => firstNegative.has(id));

  if (!opposed) fail(`${groupId}: mirror pair lacks an opposed shared construct target`);
}

pass(`${mirrorGroups.size} mirror groups checked`);

if (items.length !== 60) fail(`prototype must contain 60 items, found ${items.length}`);
else pass("60-item architecture pool");

const perDomain = Object.fromEntries(domains.map((domain) => [domain.id, 0]));
for (const item of items) perDomain[item.domainId] += 1;

for (const [domainId, count] of Object.entries(perDomain)) {
  if (count < 4) fail(`${domainId}: prototype has only ${count} items`);
}
console.log("prototype items by domain:", perDomain);

if (instrument.entries.length !== instrument.nominalPoolSize) {
  fail("manifest entry count does not equal nominalPoolSize");
}

const indexes = instrument.entries.map((entry) => entry.index).sort((a, b) => a - b);
if (indexes.some((value, index) => value !== index)) {
  fail("manifest indexes must be contiguous from zero");
}

for (const entry of instrument.entries) {
  const item = items.find((candidate) => candidate.id === entry.itemId);
  if (!item) fail(`manifest references unknown item ${entry.itemId}`);
  else if (item.revision !== entry.itemRevision) {
    fail(`manifest revision mismatch for ${entry.itemId}`);
  }
}
pass("instrument manifest references checked");

for (const item of items) {
  for (const forbidden of ["weight", "loading", "score"]) {
    if (Object.hasOwn(item, forbidden)) {
      fail(`${item.id}: item bank must not contain scoring field "${forbidden}"`);
    }
  }
}
pass("no scoring weights embedded in item records");

const copiedOriginals = items.filter(
  (item) => item.provenance.origin === "original_project_draft" && item.provenance.copiedText
);
if (copiedOriginals.length) fail("original items cannot be marked copiedText=true");
else pass("provenance flags coherent");

if (failures) {
  console.error(`\n${failures} item-bank validation failure(s)`);
  process.exit(1);
}

console.log("\nItem-bank validation passed.");
