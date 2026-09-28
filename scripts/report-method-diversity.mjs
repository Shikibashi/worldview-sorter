import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const load = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

const current = await load("data/current.json");
const constructs = (await load("data/constructs.json")).constructs;
const bank = await load(current.candidateBank.path);

const primaryCounts = Object.fromEntries(constructs.map((c) => [c.id, 0]));
const scaleSets = Object.fromEntries(constructs.map((c) => [c.id, new Set()]));
const typeSets = Object.fromEntries(constructs.map((c) => [c.id, new Set()]));

for (const item of bank.items) {
  for (const target of item.targets) {
    if (target.role !== "primary") continue;
    primaryCounts[target.constructId] = (primaryCounts[target.constructId] ?? 0) + 1;
    scaleSets[target.constructId].add(item.responseScaleId);
    typeSets[target.constructId].add(item.responseType);
  }
}

const headline = constructs.filter((c) => c.tier === "headline");
const primary = constructs.filter((c) => c.tier === "primary");

const summarize = (list) => list.map((c) => ({
  id: c.id,
  name: c.name,
  domainId: c.domainId,
  indicators: primaryCounts[c.id] ?? 0,
  responseScales: [...scaleSets[c.id]].sort(),
  responseTypes: [...typeSets[c.id]].sort()
}));

const headlineRows = summarize(headline);
const primaryRows = summarize(primary);

console.log(JSON.stringify({
  bankVersion: bank.bankVersion,
  itemCount: bank.items.length,
  headline: {
    constructs: headlineRows.length,
    atLeastThreeIndicators: headlineRows.filter((r) => r.indicators >= 3).length,
    multipleResponseScales: headlineRows.filter((r) => r.responseScales.length >= 2).length,
    singleResponseScale: headlineRows.filter((r) => r.responseScales.length === 1)
  },
  primary: {
    constructs: primaryRows.length,
    atLeastTwoIndicators: primaryRows.filter((r) => r.indicators >= 2).length,
    multipleResponseScales: primaryRows.filter((r) => r.responseScales.length >= 2).length
  }
}, null, 2));
