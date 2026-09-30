import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const loadRepo = async (p) => JSON.parse(await readFile(new URL(p, root), "utf8"));
const loadPath = async (p) => JSON.parse(await readFile(p, "utf8"));

const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
};

const parametersPath = getArg("--parameters");
if (!parametersPath) {
  throw new Error("usage: node scripts/select-short-form.mjs --parameters <empirical-parameters.json> --size <n>");
}

const current = await loadRepo("data/current.json");
const bank = await loadRepo(current.candidateBank.path);
const constructs = (await loadRepo("data/constructs.json")).constructs;
const policy = await loadRepo(current.shortFormPolicy.path);
const params = await loadPath(parametersPath);

if (params.status !== "empirical") {
  throw new Error(`short-form selection requires status=empirical parameters; received ${params.status}`);
}
if (params.bankVersion !== bank.bankVersion || policy.sourceBankVersion !== bank.bankVersion) {
  throw new Error("parameter/policy bank version does not match active bank");
}

const size = Number(getArg("--size", Math.round((policy.operationalItemRange.min + policy.operationalItemRange.max) / 2)));
if (!Number.isInteger(size) || size < policy.operationalItemRange.min || size > policy.operationalItemRange.max) {
  throw new Error(`--size must be an integer in ${policy.operationalItemRange.min}..${policy.operationalItemRange.max}`);
}

const itemMap = new Map(bank.items.map((i) => [i.id, i]));
const paramMap = new Map(params.items.map((p) => [p.itemId, p]));
const excludedFlags = new Set(policy.constraints.excludeIfFlagged);

const flagsFor = (p) => [
  ...(p.difFlags.length ? ["dif"] : []),
  ...(p.localDependenceFlags.length ? ["severe_local_dependence"] : []),
  ...p.qualityFlags
];

const eligible = bank.items.filter((item) => {
  const p = paramMap.get(item.id);
  if (!p || p.itemRevision !== item.revision) return false;
  if (!p.eligibleForShortForm || typeof p.informationScore !== "number") return false;
  return !flagsFor(p).some((flag) => excludedFlags.has(flag));
});

const eligibleIds = new Set(eligible.map((i) => i.id));
const selected = new Map();
const mirrorCounts = new Map();

const canAdd = (item) => {
  if (selected.has(item.id)) return true;
  if (item.mirrorGroup) {
    const n = mirrorCounts.get(item.mirrorGroup) ?? 0;
    if (n >= policy.constraints.maxItemsPerMirrorGroup) return false;
  }
  return true;
};

const addItem = (item) => {
  if (selected.has(item.id)) return;
  if (!canAdd(item)) throw new Error(`mirror constraint blocks required item ${item.id}`);
  selected.set(item.id, item);
  if (item.mirrorGroup) mirrorCounts.set(item.mirrorGroup, (mirrorCounts.get(item.mirrorGroup) ?? 0) + 1);
};

const prerequisiteIds = (item) =>
  item.eligibility?.mode === "conditional"
    ? item.eligibility.all.map((cond) => cond.itemId)
    : [];

const addWithDependencies = (item) => {
  if (policy.constraints.requireBranchPrerequisites) {
    for (const depId of prerequisiteIds(item)) {
      const dep = itemMap.get(depId);
      if (!dep) throw new Error(`missing prerequisite ${depId}`);
      addItem(dep);
    }
  }
  addItem(item);
};

const requiredTiers = new Set(policy.requiredCoverage.constructTiers);
const requiredConstructs = constructs.filter((c) => requiredTiers.has(c.tier));
const minPer = policy.requiredCoverage.minimumPrimaryItemsPerRequiredConstruct;

for (const construct of requiredConstructs) {
  const candidates = eligible
    .filter((item) => item.targets.some((t) =>
      t.role === "primary" && t.constructId === construct.id
    ))
    .sort((a, b) =>
      (paramMap.get(b.id).informationScore - paramMap.get(a.id).informationScore) ||
      a.id.localeCompare(b.id)
    );
  let have = [...selected.values()].filter((item) =>
    item.targets.some((t) => t.role === "primary" && t.constructId === construct.id)
  ).length;
  for (const item of candidates) {
    if (have >= minPer) break;
    if (!canAdd(item)) continue;
    const before = selected.size;
    addWithDependencies(item);
    if (selected.size > size) throw new Error("required coverage cannot fit within requested short-form size");
    if (selected.size > before) have += 1;
  }
  if (have < minPer) {
    throw new Error(`insufficient eligible empirical items for required construct ${construct.id}`);
  }
}

const remaining = eligible
  .filter((item) => !selected.has(item.id))
  .sort((a, b) =>
    (paramMap.get(b.id).informationScore - paramMap.get(a.id).informationScore) ||
    a.id.localeCompare(b.id)
  );

for (const item of remaining) {
  if (selected.size >= size) break;
  if (!canAdd(item)) continue;
  const deps = prerequisiteIds(item).filter((id) => !selected.has(id));
  const needed = 1 + deps.length;
  if (selected.size + needed > size) continue;
  addWithDependencies(item);
}

if (selected.size !== size) {
  throw new Error(`could only select ${selected.size} items for requested size ${size}`);
}

const entries = [...selected.values()]
  .sort((a,b) => a.domainId.localeCompare(b.domainId) || a.id.localeCompare(b.id))
  .map((item,index) => ({
    index,
    itemId:item.id,
    itemRevision:item.revision,
    informationScore:paramMap.get(item.id)?.informationScore ?? null
  }));

process.stdout.write(JSON.stringify({
  schemaVersion:"1.0.0",
  status:"empirical_candidate_not_validated",
  policyVersion:policy.policyVersion,
  calibrationVersion:params.calibrationVersion,
  sourceBankVersion:bank.bankVersion,
  requestedSize:size,
  entries
}, null, 2) + "\n");
