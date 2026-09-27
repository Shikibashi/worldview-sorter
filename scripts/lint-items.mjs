import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const bank = JSON.parse(await readFile(new URL("data/items/candidate-v0.2.json", root), "utf8"));
const items = bank.items;

let hardFailures = 0;
let warnings = 0;
const fail = (m) => { hardFailures += 1; console.error("FAIL:", m); };
const warn = (m) => { warnings += 1; console.warn("WARN:", m); };

const ideologicalLabels = [
  "capitalism","socialism","communism","fascism","liberalism","conservatism",
  "libertarianism","anarchism","marxism","democrat","republican","maga",
  "trump","biden","marx","hayek","rawls","stirner"
];

const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length;

for (const item of items) {
  const words = wordCount(item.text);
  if (words > 45) fail(`${item.id}: ${words}-word stem exceeds hard 45-word limit`);
  else if (words > 32) warn(`${item.id}: ${words}-word stem should be reviewed for readability`);

  const lower = item.text.toLowerCase();
  for (const label of ideologicalLabels) {
    const re = new RegExp(`\\b${label}\\b`, "i");
    if (re.test(lower)) fail(`${item.id}: contains ideology/party/person cue "${label}"`);
  }

  if ((item.specialStates.includes("no_view") || item.specialStates.includes("not_understood")) &&
      item.options.some((o) => /\b(unsure|don't know|do not know)\b/i.test(o.label))) {
    fail(`${item.id}: inline option duplicates a dedicated missing-position state`);
  }

  const conjunctions = (item.text.match(/\b(and|or)\b/gi) ?? []).length;
  if (conjunctions >= 3 && words > 20) {
    warn(`${item.id}: multiple conjunctions may indicate double-barreled wording`);
  }
}

const agreementItems = items.filter((item) => item.responseScaleId === "agreement5");
const keying = { positive: 0, negative: 0, diagnostic: 0, tradeoff: 0 };
for (const item of agreementItems) {
  const primary = item.targets.find((t) => t.role === "primary");
  if (primary && primary.relation in keying) keying[primary.relation] += 1;
}
const signed = keying.positive + keying.negative;
if (signed) {
  const positiveShare = keying.positive / signed;
  if (positiveShare > 0.65 || positiveShare < 0.35) {
    warn(`agreement-item primary keying is ${(positiveShare * 100).toFixed(1)}% positive; expansion should add counter-keyed items`);
  }
}

const crossDomain = items.filter((item) =>
  item.targets.some((target) => !target.constructId.startsWith(item.domainId))
);
if (crossDomain.length) {
  warn(`${crossDomain.length} item(s) intentionally cross-load outside their UI domain: ${crossDomain.map((x) => x.id).join(", ")}`);
}

console.log("keying summary:", keying);
console.log(`lint complete: ${hardFailures} failure(s), ${warnings} warning(s)`);
if (hardFailures) process.exit(1);
