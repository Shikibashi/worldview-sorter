import { mkdir, open, readFile, readdir } from "node:fs/promises";
import path from "node:path";

export class SessionConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "SessionConflictError";
    this.statusCode = 409;
  }
}

const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, stable(value[key])])
    );
  }
  return value;
};

export const stableStringify = (value) => JSON.stringify(stable(value));

const safeSessionId = (sessionId) => {
  if (!/^[A-Za-z0-9._-]{8,128}$/.test(sessionId)) {
    throw new Error("unsafe sessionId");
  }
  return sessionId;
};

export function createFileSessionStore({ directory }) {
  const root = path.resolve(directory);

  const init = async () => {
    await mkdir(root, { recursive:true, mode:0o700 });
  };

  const fileFor = (sessionId) => path.join(root, safeSessionId(sessionId) + ".json");

  const save = async (session) => {
    await init();
    const file = fileFor(session.sessionId);
    const canonical = stableStringify(session) + "\n";

    try {
      const handle = await open(file, "wx", 0o600);
      try {
        await handle.writeFile(canonical, "utf8");
      } finally {
        await handle.close();
      }
      return { created:true, duplicate:false, sessionId:session.sessionId };
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      const existing = JSON.parse(await readFile(file, "utf8"));
      if (stableStringify(existing) === stableStringify(session)) {
        return { created:false, duplicate:true, sessionId:session.sessionId };
      }
      throw new SessionConflictError("sessionId already exists with different content");
    }
  };

  const list = async () => {
    await init();
    const files = (await readdir(root)).filter((name) => name.endsWith(".json")).sort();
    const sessions = [];
    for (const name of files) {
      sessions.push(JSON.parse(await readFile(path.join(root, name), "utf8")));
    }
    return sessions;
  };

  return { root, init, save, list };
}
