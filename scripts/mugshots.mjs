// Writes one four-view sheet per catalog item.
//   npm run mugshots                 design/progress
//   npm run mugshots -- --into final design/final
//   npm run mugshots -- --only wrench
//   npm run mugshots -- --serve      open the page and leave it up
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { createMugshot } from "../design/mugshot.js";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function args(argv) {
  let into = "progress";
  let only = "";
  let out = "";
  let serve = false;
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--into") into = argv[++i];
    else if (arg === "--only") only = argv[++i];
    else if (arg === "--out") out = argv[++i];
    else if (arg === "--serve") serve = true;
    else if (arg === "--help") return { help: true };
    else throw new Error("unknown argument " + arg);
  }
  if (into !== "progress" && into !== "final") throw new Error("--into is progress or final");
  return { into, only, out, serve };
}

function wanted(only) {
  const items = createMugshot(THREE).items();
  if (!only) return items;
  const key = only.toLowerCase();
  const found = items.filter(item => item.slug === key || item.name.toLowerCase() === key);
  if (!found.length) throw new Error("no item named " + only);
  return found;
}

function serveRepo() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://127.0.0.1");
      const full = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
      if (full !== root && !full.startsWith(root + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      const body = await readFile(full);
      res.writeHead(200, { "content-type": TYPES[path.extname(full)] || "application/octet-stream", "cache-control": "no-store" });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise(resolve => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function launchChrome() {
  const bin = process.env.CHROME || "/snap/bin/chromium";
  return mkdtemp(path.join(tmpdir(), "helferlein-mugshot-")).then(dir => new Promise((resolve, reject) => {
    const proc = spawn(bin, [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--remote-debugging-port=0",
      "--remote-allow-origins=*",
      `--user-data-dir=${dir}`,
      "about:blank"
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let buf = "";
    const timer = setTimeout(() => reject(new Error("chromium did not open a debugging port")), 20000);
    const onData = chunk => {
      buf += chunk.toString();
      const found = buf.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
      if (!found) return;
      clearTimeout(timer);
      resolve({ proc, port: found[1], dir });
    };
    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    proc.once("exit", code => {
      clearTimeout(timer);
      reject(new Error("chromium exited " + code));
    });
  }));
}

function connect(port) {
  return fetch(`http://127.0.0.1:${port}/json/list`).then(res => res.json()).then(list => new Promise((resolve, reject) => {
    const page = list.find(target => target.type === "page");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    const pending = new Map();
    const waits = [];
    let id = 0;
    ws.addEventListener("open", () => {
      function send(method, params = {}) {
        const msgId = ++id;
        return new Promise((done, fail) => {
          pending.set(msgId, { done, fail });
          ws.send(JSON.stringify({ id: msgId, method, params }));
        });
      }
      resolve({ ws, send, waits });
    });
    ws.addEventListener("error", () => reject(new Error("devtools socket failed")));
    ws.addEventListener("message", event => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const job = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) job.fail(new Error(msg.error.message));
        else job.done(msg.result);
      } else if (msg.method) {
        for (const wait of waits) wait(msg);
      }
    });
  }));
}

async function grab(session, url) {
  await session.send("Page.enable");
  await session.send("Runtime.enable");
  let resolveLoad;
  const loaded = new Promise(resolve => { resolveLoad = resolve; });
  const onLoad = msg => { if (msg.method === "Page.loadEventFired") resolveLoad(); };
  session.waits.push(onLoad);
  await session.send("Page.navigate", { url });
  await Promise.race([
    loaded,
    new Promise((_, reject) => setTimeout(() => reject(new Error("page did not load")), 20000))
  ]);
  session.waits.splice(session.waits.indexOf(onLoad), 1);
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const result = await session.send("Runtime.evaluate", {
      expression: "({ href: location.href, png: window.__mugshotPng || '', error: window.__mugshotError || '' })",
      returnByValue: true
    });
    if (result.exceptionDetails) {
      await new Promise(resolve => setTimeout(resolve, 40));
      continue;
    }
    const value = result.result.value;
    if (!value || !String(value.href).includes("capture=1")) {
      await new Promise(resolve => setTimeout(resolve, 40));
      continue;
    }
    if (value.error) throw new Error(value.error);
    if (value.png) return value.png;
    await new Promise(resolve => setTimeout(resolve, 40));
  }
  throw new Error("timed out waiting for " + url);
}

const help = `Usage: npm run mugshots -- [--into progress|final] [--only name] [--out dir] [--serve]`;

try {
  const options = args(process.argv);
  if (options.help) {
    console.log(help);
    process.exit(0);
  }
  const server = await serveRepo();
  const port = server.address().port;
  const page = `http://127.0.0.1:${port}/design/mugshot.html`;
  if (options.serve) {
    console.log(page);
    await new Promise(() => {});
  }
  const items = wanted(options.only);
  const destRoot = options.out || path.join(root, "design", options.into);
  const chrome = await launchChrome();
  const session = await connect(chrome.port);
  try {
    for (const item of items) {
      const url = `${page}?capture=1&kind=${encodeURIComponent(item.kind)}&name=${encodeURIComponent(item.name)}`;
      const png = await grab(session, url);
      const match = png.match(/^data:image\/png;base64,(.+)$/);
      if (!match) throw new Error("not a png for " + item.name);
      const file = path.join(destRoot, item.folder, item.slug + ".png");
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, Buffer.from(match[1], "base64"));
      const shown = path.relative(root, file);
      console.log(shown.startsWith("..") ? file : shown);
    }
  } finally {
    chrome.proc.kill();
    await rm(chrome.dir, { recursive: true, force: true });
    server.close();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
