import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const load = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

const current = await load("data/current.json");
const protocol = await load(current.cognitiveProtocol.path);
const bank = await load(current.candidateBank.path);
const constructs = (await load("data/constructs.json")).constructs;

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.error("FAIL:", message);
};
const pass = (message) => console.log("PASS:", message);

if (protocol.protocolVersion !== current.cognitiveProtocol.version) {
  fail("cognitive protocol pointer/version mismatch");
}
if (protocol.targetBankVersion !== bank.bankVersion) {
  fail(`cognitive protocol targets bank ${protocol.targetBankVersion}, current bank is ${bank.bankVersion}`);
}

if (!protocol.dataPolicy.directIdentifiersProhibited) {
  fail("cognitive-review protocol must prohibit direct identifiers");
} else {
  pass("direct identifiers prohibited");
}

const prompts = new Set(protocol.interviewSequence.map((step) => step.id));
for (const required of ["natural_answer","paraphrase","reasoning","answerability","social_pressure","midpoint_probe"]) {
  if (!prompts.has(required)) fail(`cognitive protocol missing required step ${required}`);
}
pass("required cognitive probes present");

const knownItems = new Set(bank.items.map((item) => item.id));
const publicConstructs = constructs.filter((construct) =>
  construct.tier === "headline" || construct.tier === "primary"
);
const covered = new Set(bank.items.flatMap((item) => item.targets.map((target) => target.constructId)));
const missingPublic = publicConstructs.filter((construct) => !covered.has(construct.id));

if (missingPublic.length) {
  fail(`public construct coverage missing: ${missingPublic.map((construct) => construct.id).join(", ")}`);
} else {
  pass(`all ${publicConstructs.length} headline/primary constructs have candidate-item coverage`);
}

if (protocol.operationalTargets.minimumIndependentReviewsPerItem < 1) {
  fail("minimumIndependentReviewsPerItem must be at least 1");
}
if (protocol.operationalTargets.preferredIndependentReviewsPerItem <
    protocol.operationalTargets.minimumIndependentReviewsPerItem) {
  fail("preferred review target must be >= minimum review target");
}
pass("cognitive-review operational targets coherent");

if (!knownItems.size) fail("current bank has no items");

if (failures) {
  console.error(`\n${failures} cognitive-review validation failure(s)`);
  process.exit(1);
}
console.log("\nCognitive-review infrastructure validation passed.");
