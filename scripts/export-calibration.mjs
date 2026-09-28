import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = new URL("../", import.meta.url);
const loadRepo = async (p) => JSON.parse(await readFile(new URL(p, root), "utf8"));

const dir = process.argv[2];
if (!dir) throw new Error("usage: node scripts/export-calibration.mjs <session-directory>");

const current = await loadRepo("data/current.json");
const bank = await loadRepo(current.candidateBank.path);
const itemMap = new Map(bank.items.map((i) => [i.id, i]));

const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
for (const file of files) {
  const session = JSON.parse(await readFile(path.join(dir, file), "utf8"));
  const responseMap = new Map(session.responses.map((r) => [r.itemId, r]));
  for (const presented of session.presentedItems) {
    const item = itemMap.get(presented.itemId);
    if (!item) continue;
    const response = responseMap.get(presented.itemId);
    const value = response?.value ?? null;
    const record = {
      exportVersion: "0.1.0",
      sessionId: session.sessionId,
      pilotId: session.pilotId,
      instrumentVersion: session.instrumentVersion,
      bankVersion: session.bankVersion,
      packetId: session.packetId,
      locale: session.locale,
      presentationIndex: presented.index,
      itemId: item.id,
      itemRevision: presented.itemRevision,
      domainId: item.domainId,
      responseType: item.responseType,
      responseScaleId: item.responseScaleId,
      state: response?.state ?? "missing",
      numericValue: typeof value === "number" ? value : null,
      categoricalValue: typeof value === "string" ? value : null,
      rankingValue: Array.isArray(value) ? value : null,
      responseTimeMs: response?.responseTimeMs ?? null,
      changedAnswerCount: response?.changedAnswerCount ?? 0,
      presented: presented.presented,
      skippedByBranch: presented.skippedByBranch
    };
    process.stdout.write(JSON.stringify(record) + "\n");
  }
}
