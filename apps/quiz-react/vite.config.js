import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(appDir, '../..');

function localDataPlugin() {
  return {
    name: 'worldview-local-data',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
        if (!pathname.startsWith('/data/')) return next();
        const relative = decodeURIComponent(pathname.slice(1));
        const target = path.resolve(repoRoot, relative);
        if (!target.startsWith(path.join(repoRoot, 'data') + path.sep) || !target.endsWith('.json')) {
          response.writeHead(404).end();
          return;
        }
        try {
          const body = await readFile(target);
          response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
          response.end(body);
        } catch {
          response.writeHead(404).end();
        }
      });
    }
  };
}

export default defineConfig({
  root: appDir,
  base: './',
  plugins: [react(), localDataPlugin()],
  server: { host: '127.0.0.1', fs: { allow: [repoRoot] } },
  build: {
    outDir: path.join(repoRoot, 'dist/worldview-app'),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: { output: { manualChunks: undefined } }
  }
});
