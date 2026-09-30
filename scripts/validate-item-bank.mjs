import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const load = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

const current = await load("data/current.json");
const domains = (await load("data/domains.json")).domains;
const constructsDoc = await load(current.registry?.path ?? "data/constructs.json");
const constructs = constructsDoc.constructs.filter(c => c.measurementStatus !== "deprecated");
const sources = (await load(current.sourceRegistry?.path ?? "data/sources.json")).sources;
const scalesDoc = await load("data/response-scales.json");
const bankDoc = await load(current.candidateBank.path);
const instrument = await load(current.instrument.path);

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.error("FAIL:", message);
};
const pass = (message) => console.log("PASS:", message);

if (bankDoc.bankVersion !== current.candidateBank.version) {
  fail(`current candidate bank version mismatch: pointer=${current.candidateBank.version}, file=${bankDoc.bankVersion}`);
}
if (instrument.instrumentVersion !== current.instrument.version) {
  fail(`current instrument version mismatch: pointer=${current.instrument.version}, file=${instrument.instrumentVersion}`);
}
if (instrument.bankVersion !== bankDoc.bankVersion) {
  fail(`instrument bank version ${instrument.bankVersion} does not match bank ${bankDoc.bankVersion}`);
}

const domainIds = new Set(domains.map((domain) => domain.id));
const constructIds = new Set(constructsDoc.constructs.map(c => c.id));
const sourceIds = new Set(sources.map((source) => source.id));
const scales = new Map(scalesDoc.scales.map((scale) => [scale.id, scale]));
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

  const scale = scales.get(item.responseScaleId);
  if (!scale) {
    fail(`${item.id}: unknown response scale ${item.responseScaleId}`);
  } else if (scale.responseType !== item.responseType) {
    fail(`${item.id}: response type ${item.responseType} does not match scale ${item.responseScaleId} (${scale.responseType})`);
  }

  const optionIds = new Set();
  for (const option of item.options) {
    if (optionIds.has(option.id)) fail(`${item.id}: duplicate option ID ${option.id}`);
    optionIds.add(option.id);
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
      const sourceOptionIds = new Set(source.options.map((option) => option.id));
      for (const optionId of condition.optionIds) {
        if (!sourceOptionIds.has(optionId)) {
          fail(`${item.id}: branch references unknown option ${condition.itemId}:${optionId}`);
        }
      }
    }
  }
}
pass(`${itemIds.size} item IDs checked`);

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
  const firstPositive = new Set(pair[0].targets.filter((t) => t.relation === "positive").map((t) => t.constructId));
  const firstNegative = new Set(pair[0].targets.filter((t) => t.relation === "negative").map((t) => t.constructId));
  const secondPositive = new Set(pair[1].targets.filter((t) => t.relation === "positive").map((t) => t.constructId));
  const secondNegative = new Set(pair[1].targets.filter((t) => t.relation === "negative").map((t) => t.constructId));
  const opposed =
    [...firstPositive].some((id) => secondNegative.has(id)) ||
    [...secondPositive].some((id) => firstNegative.has(id));
  if (!opposed) fail(`${groupId}: mirror pair lacks an opposed shared construct target`);
}
pass(`${mirrorGroups.size} mirror groups checked`);

const perDomain = Object.fromEntries(domains.map((domain) => [domain.id, 0]));
for (const item of items) perDomain[item.domainId] += 1;
for (const [domainId, count] of Object.entries(perDomain)) {
  if (count < 1) fail(`${domainId}: no candidate items`);
}
console.log("candidate items by domain:", perDomain);

const primaryCounts = Object.fromEntries(constructs.map((construct) => [construct.id, 0]));
for (const item of items) {
  for (const target of item.targets) {
    if (target.role === "primary") {
      primaryCounts[target.constructId] = (primaryCounts[target.constructId] ?? 0) + 1;
    }
  }
}
const headlineConstructs = constructs.filter((construct) => construct.tier === "headline");
const primaryConstructs = constructs.filter((construct) => construct.tier === "primary");

const headlineUnderFloor = headlineConstructs.filter((construct) => (primaryCounts[construct.id] ?? 0) < 3);
if (headlineUnderFloor.length) {
  fail(
    "headline constructs below three primary indicators: " +
    headlineUnderFloor.map((construct) => `${construct.id}=${primaryCounts[construct.id] ?? 0}`).join(", ")
  );
} else {
  pass(`all ${headlineConstructs.length} headline constructs have at least three primary indicators`);
}

const primaryUnderFloor = primaryConstructs.filter((construct) => (primaryCounts[construct.id] ?? 0) < 3);
if (primaryUnderFloor.length) {
  fail(
    "primary constructs below three primary indicators: " +
    primaryUnderFloor.map((construct) => `${construct.id}=${primaryCounts[construct.id] ?? 0}`).join(", ")
  );
} else {
  pass(`all ${primaryConstructs.length} primary constructs have at least three primary indicators`);
}

if (instrument.entries.length !== instrument.nominalPoolSize) {
  fail("manifest entry count does not equal nominalPoolSize");
}
if (instrument.nominalPoolSize !== items.length) {
  fail(`manifest nominalPoolSize ${instrument.nominalPoolSize} does not equal bank size ${items.length}`);
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

const academicRelease = await load(current.academicRelease.path);
if (items.length !== academicRelease.itemCount) fail("Academic release item count mismatch");
else pass("Versioned academic release item count verified");

const specialtyConstructs = constructs.filter(
  (construct) =>
    (construct.tier === "diagnostic" || construct.tier === "research") &&
    construct.directlyScored
);
const specialtyUnderTarget = specialtyConstructs.filter(
  (construct) => (primaryCounts[construct.id] ?? 0) < construct.candidateItemTarget
);
if (specialtyUnderTarget.length) {
  fail(
    "diagnostic/research constructs below registry candidate target: " +
    specialtyUnderTarget
      .map((construct) => `${construct.id}=${primaryCounts[construct.id] ?? 0}/${construct.candidateItemTarget}`)
      .join(", ")
  );
} else {
  pass(`all ${specialtyConstructs.length} directly measured diagnostic/research constructs meet registry candidate targets`);
}

const derivedWithPrimaryItems = constructs.filter(
  (construct) => construct.type === "derived" && (primaryCounts[construct.id] ?? 0) > 0
);
if (derivedWithPrimaryItems.length) {
  fail(
    "derived constructs must not receive direct primary items: " +
    derivedWithPrimaryItems.map((construct) => construct.id).join(", ")
  );
} else {
  pass("derived constructs remain derived-only");
}

const conditionalItems = items.filter((item) => item.eligibility.mode === "conditional");
if (conditionalItems.length && !instrument.ordering.constraints.respectEligibilityDependencies) {
  fail("instrument has conditional items but does not require eligibility dependency ordering");
} else if (conditionalItems.length) {
  pass("conditional-item dependency ordering required by manifest");
}

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
