import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const loadRepo = async (p) => JSON.parse(await readFile(new URL(p, root), "utf8"));
const loadPath = async (p) => JSON.parse(await readFile(p, "utf8"));

const sessionPath = process.argv[2];
if (!sessionPath) throw new Error("usage: node scripts/score-session.mjs <session.json> [scoring-model.json]");

const current = await loadRepo("data/current.json");
const bank = await loadRepo(current.candidateBank.path);
const scalesDoc = await loadRepo("data/response-scales.json");
const model = process.argv[3]
  ? await loadPath(process.argv[3])
  : await loadRepo(current.engineeringScoringModel.path);
const session = await loadPath(sessionPath);

if (!model.compatibleBankVersions.includes(session.bankVersion)) {
  throw new Error(`scoring model ${model.modelVersion} is incompatible with bank ${session.bankVersion}`);
}
if (!model.compatibleInstrumentVersions.includes(session.instrumentVersion)) {
  throw new Error(`scoring model ${model.modelVersion} is incompatible with instrument ${session.instrumentVersion}`);
}
if (session.bankVersion !== bank.bankVersion) {
  throw new Error(`session bank ${session.bankVersion} does not match active bank ${bank.bankVersion}`);
}

const scaleMap = new Map(scalesDoc.scales.map((s) => [s.id, s]));
const itemMap = new Map(bank.items.map((i) => [i.id, i]));
const responseMap = new Map(session.responses.map((r) => [r.itemId, r]));

const eligibleByConstruct = new Map();
for (const item of bank.items) {
  if (!model.algorithm.eligibleResponseScaleIds.includes(item.responseScaleId)) continue;
  for (const target of item.targets) {
    if (target.role !== model.algorithm.eligibleTargetRole) continue;
    if (!model.algorithm.eligibleRelations.includes(target.relation)) continue;
    if (!eligibleByConstruct.has(target.constructId)) eligibleByConstruct.set(target.constructId, []);
    eligibleByConstruct.get(target.constructId).push({ item, target });
  }
}

const constructResults = [];
for (const [constructId, eligible] of [...eligibleByConstruct.entries()].sort()) {
  const values = [];
  for (const { item, target } of eligible) {
    const response = responseMap.get(item.id);
    if (!response || response.state !== "answered" || typeof response.value !== "number") continue;
    if (response.itemRevision !== item.revision) continue;
    const scale = scaleMap.get(item.responseScaleId);
    const nums = scale.options.map((o) => o.value).filter((v) => typeof v === "number");
    const maxAbs = Math.max(...nums.map(Math.abs));
    if (!Number.isFinite(maxAbs) || maxAbs <= 0) continue;
    const multiplier = model.algorithm.relationMultipliers[target.relation];
    values.push((response.value / maxAbs) * multiplier);
  }
  const estimate = values.length >= model.algorithm.minimumAnsweredItems
    ? values.reduce((a, b) => a + b, 0) / values.length
    : null;
  constructResults.push({
    constructId,
    estimate,
    answeredEligibleItems: values.length,
    eligibleItems: eligible.length,
    coverage: eligible.length ? values.length / eligible.length : 0,
    method: model.algorithm.family,
    uncertainty: null
  });
}

const snapshot = {
  schemaVersion: "1.0.0",
  sessionId: session.sessionId,
  pilotId: session.pilotId,
  instrumentVersion: session.instrumentVersion,
  bankVersion: session.bankVersion,
  scoringModelVersion: model.modelVersion,
  generatedAt: new Date().toISOString(),
  status: model.status,
  interpretationAllowed: model.interpretationAllowed,
  constructResults,
  notes: model.limitations
};

process.stdout.write(JSON.stringify(snapshot, null, 2) + "\n");
