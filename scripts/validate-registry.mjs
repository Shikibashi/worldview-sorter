import { readFile } from "node:fs/promises";

const load = async (path) => JSON.parse(await readFile(new URL("../" + path, import.meta.url), "utf8"));

const domainsDoc = await load("data/domains.json");
const constructsDoc = await load("data/constructs.json");
const relationshipsDoc = await load("data/relationships.json");
const sourcesDoc = await load("data/sources.json");

let failures = 0;
const fail = (msg) => { failures++; console.error("FAIL:", msg); };
const pass = (msg) => console.log("PASS:", msg);

if (domainsDoc.domains.length !== 12) fail(`expected 12 UI domains, found ${domainsDoc.domains.length}`);
else pass("12 UI domains");

const domainIds = new Set();
for (const d of domainsDoc.domains) {
  if (domainIds.has(d.id)) fail(`duplicate domain ID ${d.id}`);
  domainIds.add(d.id);
}
if (domainIds.size === domainsDoc.domains.length) pass("domain IDs unique");

const expectedOrders = Array.from({ length: 12 }, (_, i) => i + 1);
const actualOrders = domainsDoc.domains.map(d => d.order).sort((a,b) => a-b);
if (JSON.stringify(expectedOrders) !== JSON.stringify(actualOrders)) fail("domain order must be exactly 1..12");
else pass("domain order is 1..12");

const constructIds = new Set();
const allowedTypes = new Set(constructsDoc.measurementTypes);
const allowedTiers = new Set(constructsDoc.tiers);
const allowedOutputs = new Set(constructsDoc.outputModes);
for (const c of constructsDoc.constructs) {
  if (constructIds.has(c.id)) fail(`duplicate construct ID ${c.id}`);
  constructIds.add(c.id);
  if (!domainIds.has(c.domainId)) fail(`${c.id}: unknown domain ${c.domainId}`);
  if (!allowedTypes.has(c.type)) fail(`${c.id}: unknown type ${c.type}`);
  if (!allowedTiers.has(c.tier)) fail(`${c.id}: unknown tier ${c.tier}`);
  if (!allowedOutputs.has(c.outputMode)) fail(`${c.id}: unknown output mode ${c.outputMode}`);
  if (c.type === "derived" && c.directlyScored) fail(`${c.id}: derived constructs cannot be directly scored`);
  if (c.type === "derived" && c.candidateItemTarget !== 0) fail(`${c.id}: derived construct target must be 0`);
  if (c.type !== "derived" && c.candidateItemTarget < 1) fail(`${c.id}: directly measured construct requires candidate items`);
}
if (constructIds.size === constructsDoc.constructs.length) pass(`${constructIds.size} construct IDs unique`);

for (const c of constructsDoc.constructs) {
  for (const p of c.prerequisites) if (!constructIds.has(p)) fail(`${c.id}: unknown prerequisite ${p}`);
}
pass("construct prerequisites checked");

const sourceIds = new Set(sourcesDoc.sources.map(s => s.id));
for (const c of constructsDoc.constructs) {
  for (const s of c.evidenceBasis) if (!sourceIds.has(s)) fail(`${c.id}: unknown evidence source ${s}`);
}
pass("evidence source references checked");

const relationshipIds = new Set();
const validRelationshipTypes = new Set(["independent","derived_from","related_not_identical","prerequisite","anti_inference"]);
for (const r of relationshipsDoc.rules) {
  if (relationshipIds.has(r.id)) fail(`duplicate relationship ID ${r.id}`);
  relationshipIds.add(r.id);
  if (!validRelationshipTypes.has(r.type)) fail(`${r.id}: unknown relationship type ${r.type}`);
  for (const id of r.constructs ?? []) if (!constructIds.has(id)) fail(`${r.id}: unknown construct ${id}`);
  for (const id of r.from ?? []) if (!constructIds.has(id)) fail(`${r.id}: unknown source construct ${id}`);
  if (r.to && !constructIds.has(r.to)) fail(`${r.id}: unknown target construct ${r.to}`);
}
pass(`${relationshipIds.size} relationship rules checked`);

const bankTarget = domainsDoc.domains.reduce((sum,d) => sum + d.candidateItemTarget, 0);
if (bankTarget !== 472) fail(`domain candidate-bank target drifted from 472 to ${bankTarget}`);
else pass("research-bank target remains 472 items");

const byDomain = Object.fromEntries(domainsDoc.domains.map(d => [d.id, 0]));
for (const c of constructsDoc.constructs) byDomain[c.domainId]++;
for (const d of domainsDoc.domains) {
  if (!byDomain[d.id]) fail(`${d.id}: no constructs`);
}
console.log("constructs by domain:", byDomain);

if (failures) {
  console.error(`\n${failures} validation failure(s)`);
  process.exit(1);
}
console.log("\nRegistry validation passed.");
