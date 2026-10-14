// Serves the built site with the same layout as the Pages workflow (_site):
// site/ at the root, demo/, src/roll.js and src/blob.js, and dist/ with the notices.
// Used by the browser smoke test (playwright.config.js). Run `npm run build` first.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".md": "text/markdown; charset=utf-8", ".json": "application/json",
};

function resolve(path) {
  if (path === "/") return "site/index.html";
  if (path.startsWith("/demo/")) return path.slice(1);
  if (path === "/src/roll.js" || path === "/src/blob.js") return path.slice(1);
  if (path === "/dist/LICENSE") return "LICENSE";
  if (path === "/dist/THIRD_PARTY_NOTICES.md") return "THIRD_PARTY_NOTICES.md";
  if (path.startsWith("/dist/")) return path.slice(1);
  return "site" + path;
}

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (path.includes("..")) { res.writeHead(400).end(); return; }
  const file = join(root, resolve(path));
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`serving on http://127.0.0.1:${port}`));
