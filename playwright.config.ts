// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries:    process.env.CI ? 2 : 0,
  workers:    process.env.CI ? 1 : undefined,

  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  use: {
    baseURL:       process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace:         "on-first-retry",
    screenshot:    "only-on-failure",
    video:         "retain-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile",   use: { ...devices["iPhone 14"] } },
  ],

  // Run Next.js dev server before tests in local mode
  webServer: process.env.CI ? undefined : {
    command: "npm run dev",
    url:     "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
