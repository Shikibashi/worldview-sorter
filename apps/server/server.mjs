import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCollectionHttpServer } from "../../packages/collection/http.js";
import { createFileSessionStore } from "../../packages/collection/store.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const load = async (relative) =>
  JSON.parse(await readFile(path.join(repoRoot, relative), "utf8"));

const current = await load("data/current.json");
const [bank, pilot, instrument, scalesDoc] = await Promise.all([
  load(current.candidateBank.path),
  load(current.pilot.path),
  load(current.instrument.path),
  load("data/response-scales.json")
]);

const storageDirectory = process.env.WORLDVIEW_STORAGE_DIR
  ? path.resolve(process.env.WORLDVIEW_STORAGE_DIR)
  : path.join(repoRoot, ".data", "pilot-sessions");
const store = createFileSessionStore({ directory:storageDirectory });

const server = createCollectionHttpServer({
  repoRoot,
  bank,
  pilot,
  instrument,
  scalesDoc,
  store,
  adminToken:process.env.WORLDVIEW_ADMIN_TOKEN || null
});

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);

server.listen(port, host, () => {
  console.log("Worldview Sorter server: http://" + host + ":" + port + "/apps/web/");
  console.log("Pilot sessions: " + storageDirectory);
  console.log(
    process.env.WORLDVIEW_ADMIN_TOKEN
      ? "Research export endpoint enabled."
      : "Research export endpoint disabled (set WORLDVIEW_ADMIN_TOKEN to enable)."
  );
});

const shutdown = () => server.close(() => process.exit(0));
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
