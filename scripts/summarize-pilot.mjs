import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const dir = process.argv[2];
if (!dir) throw new Error("usage: node scripts/summarize-pilot.mjs <session-directory>");

const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
const itemStats = new Map();
const completion = {};

const ensure = (id) => {
  if (!itemStats.has(id)) {
    itemStats.set(id, {
      itemId:id, assigned:0, presented:0, skippedByBranch:0,
      answered:0, no_view:0, not_understood:0, not_applicable:0, missing:0,
      responseTimes:[]
    });
  }
  return itemStats.get(id);
};

for (const file of files) {
  const session = JSON.parse(await readFile(path.join(dir, file), "utf8"));
  completion[session.completionStatus] = (completion[session.completionStatus] ?? 0) + 1;
  const responseMap = new Map(session.responses.map((r) => [r.itemId, r]));
  for (const p of session.presentedItems) {
    const s = ensure(p.itemId);
    s.assigned += 1;
    if (p.presented) s.presented += 1;
    if (p.skippedByBranch) s.skippedByBranch += 1;
    const r = responseMap.get(p.itemId);
    if (!r) {
      s.missing += 1;
      continue;
    }
    s[r.state] = (s[r.state] ?? 0) + 1;
    if (typeof r.responseTimeMs === "number") s.responseTimes.push(r.responseTimeMs);
  }
}

const median = (xs) => {
  if (!xs.length) return null;
  const a = [...xs].sort((x,y) => x-y);
  const m = Math.floor(a.length/2);
  return a.length % 2 ? a[m] : (a[m-1]+a[m])/2;
};

const items = [...itemStats.values()].sort((a,b) => a.itemId.localeCompare(b.itemId)).map((s) => {
  const times = s.responseTimes;
  const missingPosition = s.no_view + s.not_understood + s.not_applicable + s.missing;
  return {
    itemId:s.itemId,
    assigned:s.assigned,
    presented:s.presented,
    skippedByBranch:s.skippedByBranch,
    answered:s.answered,
    no_view:s.no_view,
    not_understood:s.not_understood,
    not_applicable:s.not_applicable,
    missing:s.missing,
    missingPositionRate:s.presented ? missingPosition / s.presented : null,
    meanResponseTimeMs:times.length ? times.reduce((a,b)=>a+b,0)/times.length : null,
    medianResponseTimeMs:median(times)
  };
});

process.stdout.write(JSON.stringify({
  schemaVersion:"1.0.0",
  sessions:files.length,
  completionStatus:completion,
  items
}, null, 2) + "\n");
