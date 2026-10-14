// Renders the README screenshots and the mascot from the current demo pages with Chromium
// (Playwright). Writes PNGs to screenshots/ (or the directory given as the first argument):
//   demo.png 1100x640, wardrobe.png 1100x640, mascot.png 560x825 (first look),
//   website.png 1200x750 (landing page), social.png 1280x640 (social preview card).
// Run `npm run build` and `npx playwright install chromium` first; CI: .github/workflows/screenshots.yml.
// Reduced motion is emulated so every still is taken in a settled pose.
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const out = process.argv[2] || "screenshots";
const port = 4174;
const base = `http://127.0.0.1:${port}`;

const server = spawn(process.execPath, ["e2e/serve.mjs"], { env: { ...process.env, PORT: String(port) }, stdio: ["ignore", "pipe", "inherit"] });
await new Promise((ok, fail) => {
  server.stdout.on("data", chunk => { if (String(chunk).includes("serving")) ok(); });
  server.on("exit", code => fail(new Error("server exited " + code)));
});

const browser = await chromium.launch();
await mkdir(out, { recursive: true });

async function open(width, height) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
  page.on("pageerror", error => { throw error; });
  return page;
}

// Stores a look (and chat) in the demo's shared local storage, then loads `path`.
async function withLook(page, path, parts, extra = {}) {
  await page.goto(base + "/demo/wardrobe.html");
  await page.evaluate(({ parts, extra }) => {
    const { defaultLook, blankMemory } = window.Helferlein;
    localStorage.setItem("helferlein-demo", JSON.stringify({
      look: { ...defaultLook(), ...parts }, memory: blankMemory(), background: "#f4efe6", ...extra
    }));
  }, { parts, extra });
  await page.goto(base + path);
}

async function settled(page, selector = "#stage canvas") {
  await page.locator(selector).first().waitFor({ state: "visible" });
  await page.waitForTimeout(2500);
}

// Demo: chat open with a sample exchange, the figure above it.
{
  const page = await open(1100, 640);
  await withLook(page, "/demo/demo.html", { shape: "Peanut", clothes: "Striped shirt", extra: "Bunny ears", hue: 28, expression: "Pleased" }, {
    chatOpen: true,
    messages: [
      { from: "helferlein", text: "Hi, I am Helferlein. Type a message below and I will act as if I am working on it." },
      { from: "you", text: "Make the sidebar a little wider." },
      { from: "helferlein", text: "This is a sample reply, not a live model." }
    ]
  });
  await settled(page);
  await page.screenshot({ path: `${out}/demo.png` });
  await page.close();
}

// Wardrobe with a dressed figure.
{
  const page = await open(1100, 640);
  await withLook(page, "/demo/wardrobe.html", { shape: "Lightbulb", clothes: "Suit", tool: "Magnifying glass", extra: "Propeller", hue: 150 });
  await settled(page);
  await page.screenshot({ path: `${out}/wardrobe.png` });
  await page.close();
}

// Landing page.
{
  const page = await open(1200, 750);
  await page.goto(base + "/");
  await settled(page);
  await page.screenshot({ path: `${out}/website.png` });
  await page.close();
}

// Mascot: the first look alone, summoned, on a transparent background.
const mascotPage = await open(560, 825);
await mascotPage.route(base + "/__mascot.html", route => route.fulfill({
  contentType: "text/html",
  body: `<!doctype html><html><body style="margin:0;background:transparent">
<div id="stage" style="width:560px;height:825px"></div>
<script src="/dist/helferlein.min.js"></script>
<script>Helferlein.mount(document.getElementById("stage")).summon();</script></body></html>`
}));
await mascotPage.goto(base + "/__mascot.html");
await settled(mascotPage);
const mascot = await mascotPage.screenshot({ path: `${out}/mascot.png`, omitBackground: true });
await mascotPage.close();

// Social preview card (1280x640), same layout as before, with the new mascot.
{
  const page = await open(1280, 640);
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:1280px;height:640px;overflow:hidden}
body{background:#f7f6f3;font-family:Inter,"Noto Sans",sans-serif;color:#1c1c1e;position:relative}
.wrap{position:absolute;left:90px;right:80px;top:0;bottom:0;display:flex;align-items:center;gap:40px}
#figure{height:480px;width:auto;flex:none;filter:drop-shadow(0 14px 22px rgba(60,40,20,.16))}
h1{font-size:84px;font-weight:750;letter-spacing:-.035em;margin:0 0 22px;line-height:1}
p{font-size:32px;line-height:1.38;color:#4a4a52;margin:0;max-width:760px}
.url{position:absolute;left:110px;bottom:46px;font-size:24px;color:#b8732a;font-weight:600;letter-spacing:.01em}
.bar{position:absolute;left:0;right:0;bottom:0;height:12px;background:#b8732a}
</style></head><body><div class="wrap"><img id="figure" src="data:image/png;base64,${mascot.toString("base64")}" alt=""><div><h1>Helferlein</h1><p>Animated 3D avatar. A web page summons it: it floats in, shows when it is working, and gets a new look when the work is done.</p></div></div>
<div class="url">pihme.github.io/helferlein</div><div class="bar"></div></body></html>`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/social.png` });
  await page.close();
}

await browser.close();
server.kill();
console.log("screenshots written to " + out);
