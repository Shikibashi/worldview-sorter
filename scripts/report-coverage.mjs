import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const load = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

const current = await load("data/current.json");
const constructs = (await load("data/constructs.json")).constructs;
const bank = await load(current.candidateBank.path);

const counts = Object.fromEntries(constructs.map((construct) => [construct.id, 0]));
for (const item of bank.items) {
  for (const target of item.targets) {
    if (target.role === "primary") counts[target.constructId] = (counts[target.constructId] ?? 0) + 1;
  }
}

const publicConstructs = constructs.filter(
  (construct) => construct.tier === "headline" || construct.tier === "primary"
);
const distribution = {};
for (const construct of publicConstructs) {
  const n = counts[construct.id] ?? 0;
  distribution[n] = (distribution[n] ?? 0) + 1;
}

const perDomain = {};
for (const construct of publicConstructs) {
  if (!perDomain[construct.domainId]) {
    perDomain[construct.domainId] = { constructs: 0, indicators: 0, minimum: Infinity, maximum: 0 };
  }
  const row = perDomain[construct.domainId];
  const n = counts[construct.id] ?? 0;
  row.constructs += 1;
  row.indicators += n;
  row.minimum = Math.min(row.minimum, n);
  row.maximum = Math.max(row.maximum, n);
}

console.log(JSON.stringify({
  bankVersion: bank.bankVersion,
  itemCount: bank.items.length,
  publicConstructCount: publicConstructs.length,
  indicatorDistribution: distribution,
  perDomain,
  underTwo: publicConstructs
    .filter((construct) => (counts[construct.id] ?? 0) < 2)
    .map((construct) => ({ id: construct.id, count: counts[construct.id] ?? 0 }))
}, null, 2));
