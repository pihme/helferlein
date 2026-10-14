// Cross-browser smoke test of the demo pages: see e2e/smoke.spec.js. Runs in CI
// (.github/workflows/browsers.yml); locally: npm run build, npx playwright install, npm run e2e.
import { defineConfig, devices } from "@playwright/test";

const port = 4173;

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: { baseURL: `http://127.0.0.1:${port}`, viewport: { width: 1280, height: 800 } },
  webServer: {
    command: "node e2e/serve.mjs",
    url: `http://127.0.0.1:${port}/`,
    env: { PORT: String(port) },
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "msedge", use: { ...devices["Desktop Edge"], channel: "msedge" } },
  ],
});
