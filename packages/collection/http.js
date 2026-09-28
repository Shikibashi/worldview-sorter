import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { validateSubmittedSession, SessionValidationError } from "./session-validation.js";
import { SessionConflictError, sanitizeSessionForResearchExport } from "./store.js";

const json = (res, status, body, headers = {}) => {
  const bytes = Buffer.from(JSON.stringify(body) + "\n");
  res.writeHead(status, {
    "Content-Type":"application/json; charset=utf-8",
    "Content-Length":bytes.length,
    "Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"no-referrer",
    ...headers
  });
  res.end(bytes);
};

const text = (res, status, body, headers = {}) => {
  const bytes = Buffer.from(body);
  res.writeHead(status, {
    "Content-Type":"text/plain; charset=utf-8",
    "Content-Length":bytes.length,
    "Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"no-referrer",
    ...headers
  });
  res.end(bytes);
};

const readJsonBody = async (req, maxBytes) => {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      const error = new Error("request body too large");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) {
    const error = new Error("request body is empty");
    error.statusCode = 400;
    throw error;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("request body is not valid JSON");
    error.statusCode = 400;
    throw error;
  }
};

const contentType = (file) => ({
  ".html":"text/html; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".json":"application/json; charset=utf-8",
  ".svg":"image/svg+xml"
})[path.extname(file)] ?? "application/octet-stream";

const bearer = (req) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
};

export function createCollectionHttpServer({
  repoRoot,
  bank,
  pilot,
  instrument,
  scalesDoc,
  store,
  adminToken = null,
  maxBodyBytes = 2_000_000
}) {
  const root = path.resolve(repoRoot);

  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const method = req.method ?? "GET";

      if (method === "GET" && url.pathname === "/api/health") {
        json(res, 200, {
          status:"ok",
          pilotId:pilot.pilotId,
          bankVersion:bank.bankVersion,
          instrumentVersion:instrument.instrumentVersion
        });
        return;
      }

      if (method === "GET" && url.pathname === "/api/pilot/config") {
        json(res, 200, {
          pilotId:pilot.pilotId,
          bankVersion:bank.bankVersion,
          instrumentVersion:instrument.instrumentVersion,
          allowedPacketSize:pilot.administration.allowedPacketSize,
          defaultPacketSize:pilot.administration.defaultPacketSize
        });
        return;
      }

      if (method === "POST" && url.pathname === "/api/pilot/sessions") {
        const type = String(req.headers["content-type"] ?? "");
        if (!type.toLowerCase().startsWith("application/json")) {
          json(res, 415, { error:"content_type", message:"Content-Type must be application/json" });
          return;
        }

        const session = await readJsonBody(req, maxBodyBytes);
        const summary = validateSubmittedSession({ session, bank, pilot, instrument, scalesDoc });
        const saved = await store.save(session);
        json(res, saved.created ? 201 : 200, {
          accepted:true,
          duplicate:saved.duplicate,
          sessionId:saved.sessionId,
          completionStatus:summary.completionStatus,
          packetSize:summary.packetSize,
          responseCount:summary.responseCount
        });
        return;
      }

      if (method === "GET" && url.pathname === "/api/research/export") {
        if (!adminToken) {
          json(res, 503, { error:"export_disabled", message:"Research export is disabled until WORLDVIEW_ADMIN_TOKEN is configured." });
          return;
        }
        if (bearer(req) !== adminToken) {
          json(res, 401, { error:"unauthorized", message:"Valid Bearer token required." });
          return;
        }
        const sessions = await store.list();
        res.writeHead(200, {
          "Content-Type":"application/x-ndjson; charset=utf-8",
          "Cache-Control":"no-store",
          "X-Content-Type-Options":"nosniff",
          "Referrer-Policy":"no-referrer"
        });
        for (const session of sessions) {
          res.write(JSON.stringify(sanitizeSessionForResearchExport(session)) + "\n");
        }
        res.end();
        return;
      }

      if (method !== "GET" && method !== "HEAD") {
        json(res, 405, { error:"method_not_allowed" }, { Allow:"GET, HEAD, POST" });
        return;
      }

      let pathname = decodeURIComponent(url.pathname);
      if (pathname === "/") pathname = "/apps/web/";
      if (pathname.endsWith("/")) pathname += "index.html";

      const file = path.resolve(root, "." + pathname);
      if (!file.startsWith(root + path.sep)) {
        text(res, 403, "Forbidden");
        return;
      }

      const info = await stat(file);
      if (!info.isFile()) throw Object.assign(new Error("not found"), { statusCode:404 });
      const bytes = await readFile(file);
      res.writeHead(200, {
        "Content-Type":contentType(file),
        "Content-Length":bytes.length,
        "Cache-Control":file.endsWith(".json") ? "no-store" : "public, max-age=60",
        "X-Content-Type-Options":"nosniff",
        "Referrer-Policy":"no-referrer",
        "Content-Security-Policy":"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
      });
      if (method === "HEAD") res.end();
      else res.end(bytes);
    } catch (error) {
      if (error instanceof SessionValidationError) {
        json(res, 400, { error:"invalid_session", message:error.message, details:error.details });
        return;
      }
      if (error instanceof SessionConflictError) {
        json(res, 409, { error:"session_conflict", message:error.message });
        return;
      }
      const status = error.statusCode ?? 500;
      if (status >= 500) {
        json(res, status, { error:"internal_error", message:"Internal server error." });
      } else {
        json(res, status, { error:"request_error", message:error.message });
      }
    }
  });
}
