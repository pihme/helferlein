// Browser smoke test: each page loads, the figure (canvas, or the still fallback without WebGL)
// is visible with a non-zero size, and nothing went wrong on the way: no console errors, no
// uncaught page errors, no failed same-origin requests and no same-origin response >= 400.
// No screenshot comparisons, on purpose.
import { expect, test } from "@playwright/test";

const pages = [
  { name: "landing page", path: "/" },
  { name: "demo", path: "/demo/demo.html", summon: "#summon" },
  { name: "wardrobe", path: "/demo/wardrobe.html" },
];

for (const { name, path, summon } of pages) {
  test(`${name} loads without errors`, async ({ page, baseURL }) => {
    const origin = new URL(baseURL).origin;
    const problems = [];
    let script = false;
    page.on("console", msg => { if (msg.type() === "error") problems.push(`console error: ${msg.text()}`); });
    page.on("pageerror", error => problems.push(`page error: ${error.message}`));
    page.on("requestfailed", req => {
      if (new URL(req.url()).origin === origin) problems.push(`request failed: ${req.url()} (${req.failure()?.errorText})`);
    });
    page.on("response", res => {
      if (new URL(res.url()).origin !== origin) return;
      if (res.status() >= 400) problems.push(`HTTP ${res.status()}: ${res.url()}`);
      else if (/\/dist\/helferlein(\.min)?\.js$/.test(new URL(res.url()).pathname)) script = true;
    });

    await page.goto(path, { waitUntil: "load" });
    if (summon) await page.locator(summon).click();

    const figure = page.locator("#stage canvas, #stage .helferlein-fallback").first();
    await expect(figure).toBeVisible();
    await expect.poll(async () => {
      const box = await figure.boundingBox();
      return box ? Math.min(box.width, box.height) : 0;
    }).toBeGreaterThan(0);
    test.info().annotations.push({ type: "figure", description: await figure.evaluate(el => el.tagName.toLowerCase()) });

    await page.waitForLoadState("networkidle");
    expect(script, "helferlein.js was loaded").toBe(true);
    expect(problems).toEqual([]);
  });
}
