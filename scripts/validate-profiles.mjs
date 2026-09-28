import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const load = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

const current = await load("data/current.json");
const [catalog, probes, policy, constructsDoc, sourcesDoc, scalesDoc] = await Promise.all([
  load(current.profileCatalog.path),
  load(current.profileProbeSet.path),
  load(current.profileMatchingPolicy.path),
  load("data/constructs.json"),
  load("data/sources.json"),
  load("data/response-scales.json")
]);

let failures = 0;
const fail = (message) => { failures += 1; console.error("FAIL:", message); };
const pass = (message) => console.log("PASS:", message);

const constructIds = new Set(constructsDoc.constructs.map((construct) => construct.id));
const sourceIds = new Set(sourcesDoc.sources.map((source) => source.id));
const scaleIds = new Set(scalesDoc.scales.map((scale) => scale.id));
const probeIds = new Set();
const profileIds = new Set();

if (!scaleIds.has(probes.responseScaleId)) fail("profile probe set references unknown response scale");
for (const probe of probes.probes) {
  if (probeIds.has(probe.id)) fail("duplicate profile probe ID " + probe.id);
  probeIds.add(probe.id);
  for (const source of probe.sourceRefs) {
    if (!sourceIds.has(source)) fail(probe.id + ": unknown source " + source);
  }
}
pass(probeIds.size + " profile probes checked");

for (const profile of catalog.profiles) {
  if (profileIds.has(profile.id)) fail("duplicate profile ID " + profile.id);
  profileIds.add(profile.id);

  for (const source of profile.sourceRefs) {
    if (!sourceIds.has(source)) fail(profile.id + ": unknown source " + source);
  }

  if (!profile.identityConfirmation.required) {
    fail(profile.id + ": profile identity must require explicit confirmation");
  }

  const hardProbeGates = profile.hardGates.filter((gate) => gate.kind === "probe");
  if (profile.kind === "philosophical_system" && hardProbeGates.length === 0) {
    fail(profile.id + ": philosophical system needs at least one direct doctrinal probe gate");
  }

  for (const gate of profile.hardGates) {
    if (gate.kind === "probe" && !probeIds.has(gate.probeId)) {
      fail(profile.id + ": unknown probe gate " + gate.probeId);
    }
    if (gate.kind === "construct" && !constructIds.has(gate.constructId)) {
      fail(profile.id + ": unknown construct gate " + gate.constructId);
    }
  }

  for (const target of profile.softTargets) {
    if (!constructIds.has(target.constructId)) {
      fail(profile.id + ": unknown soft target " + target.constructId);
    }
  }
}
pass(profileIds.size + " profiles checked");

for (const probe of probes.probes) {
  if (!profileIds.has(probe.profileId)) {
    fail(probe.id + ": references unknown profile " + probe.profileId);
  }
}

if (policy.forceBestMatch !== false) fail("profile policy must not force a best match");
if (policy.allowAbstention !== true) fail("profile policy must allow abstention");
if (policy.percentageMatchAllowed !== false) fail("profile policy must prohibit percentage-match presentation");
if (policy.identityMode !== "explicit_confirmation_required") {
  fail("profile identity must require explicit confirmation");
}
pass("profile policy forbids forced/percentage identity matching");

if (catalog.status !== "calibrated" && catalog.identityOutputAllowed) {
  fail("non-calibrated catalog cannot allow identity output");
} else {
  pass("prototype profile catalog cannot emit public identity labels");
}

if (failures) {
  console.error("\n" + failures + " profile validation failure(s)");
  process.exit(1);
}

console.log("\nProfile-matching validation passed.");
