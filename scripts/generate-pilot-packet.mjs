import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const load = async (p) => JSON.parse(await readFile(new URL(p, root), "utf8"));

const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
};

const current = await load("data/current.json");
const pilot = await load(current.pilot.path);
const bank = await load(current.candidateBank.path);

const size = Number(getArg("--size", pilot.administration.defaultPacketSize));
const seed = getArg("--seed", "packet-0");
const packetId = getArg("--packet-id", `${pilot.pilotId}-${seed}`);

if (!Number.isInteger(size)) throw new Error("--size must be an integer");
if (size < pilot.administration.allowedPacketSize.min || size > pilot.administration.allowedPacketSize.max) {
  throw new Error(`packet size must be between ${pilot.administration.allowedPacketSize.min} and ${pilot.administration.allowedPacketSize.max}`);
}
if (size > bank.items.length) throw new Error("packet size exceeds bank size");

const hashString = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const mulberry32 = (a) => () => {
  let t = a += 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
const rand = mulberry32(hashString(seed));
const shuffle = (arr) => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const byDomain = new Map();
for (const item of bank.items) {
  if (!byDomain.has(item.domainId)) byDomain.set(item.domainId, []);
  byDomain.get(item.domainId).push(item);
}

const domainRows = [...byDomain.entries()].map(([domainId, items]) => {
  const exact = size * items.length / bank.items.length;
  return { domainId, items, exact, quota: Math.floor(exact), remainder: exact - Math.floor(exact) };
});
let assigned = domainRows.reduce((s, d) => s + d.quota, 0);
for (const row of [...domainRows].sort((a, b) => b.remainder - a.remainder || a.domainId.localeCompare(b.domainId))) {
  if (assigned >= size) break;
  row.quota += 1;
  assigned += 1;
}

const selected = new Map();
for (const row of domainRows) {
  for (const item of shuffle(row.items).slice(0, row.quota)) selected.set(item.id, item);
}

const itemMap = new Map(bank.items.map((item) => [item.id, item]));
const prerequisiteIds = (item) =>
  item.eligibility?.mode === "conditional"
    ? item.eligibility.all.map((cond) => cond.itemId)
    : [];

let changed = true;
while (changed) {
  changed = false;
  for (const item of [...selected.values()]) {
    for (const prereqId of prerequisiteIds(item)) {
      if (selected.has(prereqId)) continue;
      const prereq = itemMap.get(prereqId);
      if (!prereq) throw new Error(`missing prerequisite ${prereqId}`);
      const removable = [...selected.values()].find((candidate) =>
        candidate.domainId === prereq.domainId &&
        candidate.id !== item.id &&
        prerequisiteIds(candidate).length === 0 &&
        ![...selected.values()].some((other) => prerequisiteIds(other).includes(candidate.id))
      );
      if (!removable) throw new Error(`cannot make room for prerequisite ${prereqId}`);
      selected.delete(removable.id);
      selected.set(prereq.id, prereq);
      changed = true;
    }
  }
}
if (selected.size !== size) throw new Error(`packet size drifted to ${selected.size}`);

const deps = new Map([...selected.keys()].map((id) => [id, new Set()]));
for (const item of selected.values()) {
  for (const p of prerequisiteIds(item)) if (selected.has(p)) deps.get(item.id).add(p);
}

const ordered = [];
const remaining = new Set(selected.keys());
let recentDomains = [];
while (remaining.size) {
  let available = [...remaining].filter((id) =>
    [...deps.get(id)].every((dep) => !remaining.has(dep))
  );
  if (!available.length) throw new Error("dependency cycle in selected packet");
  available = shuffle(available);
  const preferred = available.find((id) => {
    const d = selected.get(id).domainId;
    return !(recentDomains.length >= 2 && recentDomains.slice(-2).every((x) => x === d));
  });
  const chosen = preferred ?? available[0];
  ordered.push(chosen);
  recentDomains.push(selected.get(chosen).domainId);
  remaining.delete(chosen);
}

const packet = {
  schemaVersion: "1.0.0",
  pilotId: pilot.pilotId,
  packetId,
  seed,
  bankVersion: bank.bankVersion,
  sourceInstrumentVersion: pilot.sourceInstrumentVersion,
  size: ordered.length,
  selectionMethod: pilot.administration.packetSelection,
  entries: ordered.map((id, index) => {
    const item = selected.get(id);
    return {
      index,
      itemId: item.id,
      itemRevision: item.revision,
      domainId: item.domainId,
      responseScaleId: item.responseScaleId
    };
  })
};

process.stdout.write(JSON.stringify(packet, null, 2) + "\n");
