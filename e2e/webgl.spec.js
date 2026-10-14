// WebGL probe (informational, never fails on missing WebGL): reports per browser which WebGL
// version is available and the renderer string, and whether the demo figure rendered as a
// WebGL canvas or as the still fallback. Visible as a test annotation, in the log and, in CI,
// in the job summary ($GITHUB_STEP_SUMMARY).
import { appendFileSync } from "node:fs";
import { test } from "@playwright/test";

test("webgl probe", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "load" });
  const gl = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    for (const version of ["webgl2", "webgl"]) {
      let ctx = null;
      try { ctx = canvas.getContext(version); } catch { /* unsupported */ }
      if (!ctx) continue;
      const ext = ctx.getExtension("WEBGL_debug_renderer_info");
      const renderer = ext ? ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ctx.getParameter(ctx.RENDERER);
      const vendor = ext ? ctx.getParameter(ext.UNMASKED_VENDOR_WEBGL) : ctx.getParameter(ctx.VENDOR);
      return { version, renderer: String(renderer), vendor: String(vendor) };
    }
    return { version: "none", renderer: "-", vendor: "-" };
  });

  await page.goto("/demo/demo.html", { waitUntil: "load" });
  await page.locator("#summon").click();
  const figure = page.locator("#stage canvas, #stage .helferlein-fallback").first();
  let demo = "not found";
  try {
    await figure.waitFor({ state: "visible", timeout: 15000 });
    demo = await figure.evaluate(el => el.tagName === "CANVAS" ? "webgl canvas" : "still fallback");
  } catch { /* reported as "not found" */ }

  const browser = testInfo.project.name;
  const line = `${browser}: WebGL=${gl.version}, renderer="${gl.renderer}", vendor="${gl.vendor}", demo=${demo}`;
  console.log(`[webgl-probe] ${line}`);
  testInfo.annotations.push({ type: "webgl", description: line });
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `### WebGL probe: ${browser}\n\n| WebGL | Renderer | Vendor | Demo figure |\n|---|---|---|---|\n` +
      `| ${gl.version} | ${gl.renderer} | ${gl.vendor} | ${demo} |\n\n`);
  }
});
