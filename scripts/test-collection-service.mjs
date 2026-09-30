import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  generatePilotPacket,
  createPilotSession,
  isItemEligible,
  responseMapFor,
  markPresented,
  markBranchSkipped,
  recordResponse,
  finishSession
} from "../packages/runtime/index.js";
import { createFileSessionStore } from "../packages/collection/store.js";
import { createCollectionHttpServer } from "../packages/collection/http.js";

const root = new URL("../", import.meta.url);
const load = async (relative) => JSON.parse(await readFile(new URL(relative, root), "utf8"));

const current = await load("data/current.json");
const [bank, pilot, instrument, scalesDoc] = await Promise.all([
  load(current.candidateBank.path),
  load(current.pilot.path),
  load(current.instrument.path),
  load("data/response-scales.json")
]);

const itemMap = new Map(bank.items.map((item) => [item.id, item]));
const scaleMap = new Map(scalesDoc.scales.map((scale) => [scale.id, scale]));

const answerValue = (item) => {
  const scale = scaleMap.get(item.responseScaleId);
  if (item.responseType === "likert" || item.responseType === "paired_choice") {
    return scale.options[scale.options.length - 1].value;
  }
  if (item.responseType === "single_choice" || item.responseType === "vignette_choice") {
    return item.options[0].id;
  }
  if (item.responseType === "ranking") {
    return item.options.map((option) => option.id);
  }
  throw new Error("unsupported response type " + item.responseType);
};

const packet = generatePilotPacket({
  bank,
  pilot,
  seed:"collection-test-seed",
  size:80,
  packetId:"collection-test-packet"
});

const session = createPilotSession({
  pilot,
  packet,
  locale:"en-US",
  clientVersion:"collection-test",
  sessionId:"collection-test-session",
  respondentKey:"opaque-test-key"
});

for (const entry of packet.entries) {
  const item = itemMap.get(entry.itemId);
  const responses = responseMapFor(session);
  if (!isItemEligible(item, responses)) {
    markBranchSkipped(session, entry.index);
    continue;
  }
  markPresented(session, entry.index, "2026-09-28T00:00:00Z");
  recordResponse(session, {
    itemId:item.id,
    itemRevision:item.revision,
    state:"answered",
    value:answerValue(item),
    responseTimeMs:1234,
    answeredAt:"2026-09-28T00:00:01Z"
  });
}
finishSession(session, "2026-09-28T00:10:00Z");

const directory = await mkdtemp(path.join(os.tmpdir(), "worldview-sorter-"));
const store = createFileSessionStore({ directory });
const server = createCollectionHttpServer({
  repoRoot:path.resolve(new URL("../", import.meta.url).pathname),
  bank,
  pilot,
  instrument,
  scalesDoc,
  store,
  legacyCollectionEnabled:true
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const address = server.address();
const base = "http://127.0.0.1:" + address.port;

try {
  let response = await fetch(base + "/api/health");
  assert.equal(response.status, 200);
  assert.equal((await fetch(base + "/data/current.json")).status, 200);
  assert.equal((await fetch(base + "/data/research/consent-v1.manifest.json")).status, 404);
  const health = await response.json();
  assert.equal(health.status, "ok");
  assert.equal(health.bankVersion, bank.bankVersion);

  response = await fetch(base + "/apps/web/");
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Worldview Sorter/);

  response = await fetch(base + "/api/pilot/sessions", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(session)
  });
  assert.equal(response.status, 201);
  let body = await response.json();
  assert.equal(body.accepted, true);
  assert.equal(body.duplicate, false);

  response = await fetch(base + "/api/pilot/sessions", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(session)
  });
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.duplicate, true);

  const conflicting = { ...session, clientVersion:"different-client" };
  response = await fetch(base + "/api/pilot/sessions", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(conflicting)
  });
  assert.equal(response.status, 409);

  const invalid = { ...session, sessionId:"invalid-bank-session", bankVersion:"wrong" };
  response = await fetch(base + "/api/pilot/sessions", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(invalid)
  });
  assert.equal(response.status, 400);

  const identifying = { ...session, sessionId:"identifying-field-session", email:"person@example.com" };
  response = await fetch(base + "/api/pilot/sessions", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(identifying)
  });
  assert.equal(response.status, 400);
  body = await response.json();
  assert.ok(body.details.some((detail) => detail.includes("unknown field: email")));

  response = await fetch(base + "/api/research/export");
  assert.equal(response.status, 410);
  response = await fetch(base + "/api/research/export", {headers:{ Authorization:"Bearer test-admin-token" }});
  assert.equal(response.status, 410);

  console.log("Collection service integration tests passed.");
} finally {
  await new Promise((resolve) => server.close(resolve));
  await rm(directory, { recursive:true, force:true });
}
