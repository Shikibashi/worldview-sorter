import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT ?? 4173);

const contentType = (file) => {
  const ext = path.extname(file);
  return ({
    ".html":"text/html; charset=utf-8",
    ".js":"text/javascript; charset=utf-8",
    ".css":"text/css; charset=utf-8",
    ".json":"application/json; charset=utf-8",
    ".svg":"image/svg+xml"
  })[ext] ?? "application/octet-stream";
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/") {
      res.writeHead(302, { Location:"/apps/web/" });
      res.end();
      return;
    }

    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";

    const file = path.resolve(repoRoot, "." + pathname);
    if (!file.startsWith(repoRoot + path.sep)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const info = await stat(file);
    if (!info.isFile()) throw new Error("not a file");
    const bytes = await readFile(file);
    res.writeHead(200, {
      "Content-Type":contentType(file),
      "Cache-Control":"no-store"
    });
    res.end(bytes);
  } catch {
    res.writeHead(404, { "Content-Type":"text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`Worldview Sorter pilot runner: http://localhost:${port}/apps/web/`);
});
