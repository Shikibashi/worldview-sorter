import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const load = async (p) => JSON.parse(await readFile(new URL(p, root), "utf8"));

const current = await load("data/current.json");
// This engineering-only pilot predates the current public content release.
const bank = await load("data/items/candidate-v0.9.json");
const instrument = await load("data/instruments/research-pool-0.9.json");
const pilot = await load("data/pilots/pilot-0.2.json");
const scoring = await load(current.engineeringScoringModel.path);
const policy = await load(current.shortFormPolicy.path);
const template = await load(current.calibrationTemplate.path);
const scales = await load("data/response-scales.json");
const constructs = (await load("data/constructs.json")).constructs;
const example = await load("examples/pilot-session.example.json");

let failures = 0;
const fail = (m) => { failures += 1; console.error("FAIL:", m); };
const pass = (m) => console.log("PASS:", m);

if (pilot.bankVersion !== bank.bankVersion) fail("pilot bankVersion does not match its historical bank");
if (pilot.sourceInstrumentVersion !== instrument.instrumentVersion) fail("pilot source instrument mismatch");
if (pilot.administration.defaultPacketSize < pilot.administration.allowedPacketSize.min ||
    pilot.administration.defaultPacketSize > pilot.administration.allowedPacketSize.max) {
  fail("pilot default packet size is outside allowed range");
}
if (pilot.administration.allowedPacketSize.max > bank.items.length) {
  fail("pilot maximum packet size exceeds bank size");
}
if (pilot.privacy.directIdentifiersAllowed) fail("pilot must not allow direct identifiers");
if (pilot.privacy.rawIpStorageAllowed) fail("pilot must not allow raw IP storage");
if (pilot.privacy.rawUserAgentStorageAllowed) fail("pilot must not allow raw user-agent storage");
else pass("pilot privacy constraints");

if (scoring.status !== "engineering_only") fail("default scoring model must remain engineering_only");
if (scoring.interpretationAllowed) fail("engineering scoring model must not permit interpretation");
if (!scoring.compatibleBankVersions.includes(bank.bankVersion)) fail("engineering model bank incompatibility");
if (!scoring.compatibleInstrumentVersions.includes(instrument.instrumentVersion)) fail("engineering model instrument incompatibility");

const scaleIds = new Set(scales.scales.map((s) => s.id));
for (const scaleId of scoring.algorithm.eligibleResponseScaleIds) {
  if (!scaleIds.has(scaleId)) fail(`engineering model references unknown response scale ${scaleId}`);
}
pass("engineering scoring model explicitly non-interpretive and compatible");

if (policy.sourceBankVersion !== bank.bankVersion) fail("short-form policy bank mismatch");
if (policy.operationalItemRange.min > policy.operationalItemRange.max) fail("invalid short-form item range");
const headlineCount = constructs.filter((c) => policy.requiredCoverage.constructTiers.includes(c.tier)).length;
if (policy.operationalItemRange.min < headlineCount * policy.requiredCoverage.minimumPrimaryItemsPerRequiredConstruct) {
  fail("short-form minimum size cannot satisfy required construct coverage");
}
if (policy.status !== "awaiting_empirical_parameters") fail("short-form policy should still await empirical parameters");
pass("short-form policy cannot claim validation without parameters");

if (template.status !== "template") fail("calibration parameter template must have status=template");
if (template.bankVersion !== bank.bankVersion) fail("calibration template bank mismatch");
if (template.items.length !== bank.items.length) fail("calibration template must contain every bank item");

const bankMap = new Map(bank.items.map((i) => [i.id, i]));
const seen = new Set();
for (const p of template.items) {
  if (seen.has(p.itemId)) fail(`duplicate calibration template item ${p.itemId}`);
  seen.add(p.itemId);
  const item = bankMap.get(p.itemId);
  if (!item) fail(`calibration template references unknown item ${p.itemId}`);
  else if (item.revision !== p.itemRevision) fail(`calibration template revision mismatch for ${p.itemId}`);
  if (p.informationScore !== null) fail(`template item ${p.itemId} must not contain fabricated informationScore`);
  if (p.eligibleForShortForm) fail(`template item ${p.itemId} must not be short-form eligible before calibration`);
}
pass(`calibration template covers all ${template.items.length} exact item revisions without fake parameters`);

if (example.pilotId !== pilot.pilotId) fail("example pilot session pilotId mismatch");
if (example.bankVersion !== bank.bankVersion) fail("example pilot session bank mismatch");
if (example.instrumentVersion !== instrument.instrumentVersion) fail("example pilot session instrument mismatch");
for (const p of example.presentedItems) {
  const item = bankMap.get(p.itemId);
  if (!item) fail(`example references unknown item ${p.itemId}`);
  else if (item.revision !== p.itemRevision) fail(`example revision mismatch for ${p.itemId}`);
}
pass("example raw pilot session references historical immutable item revisions");

if (failures) {
  console.error(`\n${failures} pilot/scoring architecture validation failure(s)`);
  process.exit(1);
}
console.log("\nPilot/scoring architecture validation passed.");
