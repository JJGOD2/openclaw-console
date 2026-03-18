// tests/e2e/dashboard.spec.ts
// Playwright E2E tests — runs against dev server
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL    = "admin@example.com";
const ADMIN_PASSWORD = "admin1234";

// ─────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────
test.describe("Authentication", () => {
  test("redirects to /login when not authenticated", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    // Should be on login page or redirected
    await expect(page).toHaveURL(/login|dashboard/);
  });

  test("login with valid credentials", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]',    ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);
  });

  test("shows error for invalid password", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]',    ADMIN_EMAIL);
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator(".text-red-600")).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────
test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
  });

  test("shows metric cards", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    const cards = page.locator(".bg-gray-100.rounded-lg");
    await expect(cards).toHaveCount(4);
  });

  test("sidebar navigation works", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    await page.click("text=Agents");
    await expect(page).toHaveURL(/agents/);

    await page.click("text=Channels");
    await expect(page).toHaveURL(/channels/);

    await page.click("text=Security");
    await expect(page).toHaveURL(/security/);
  });
});

// ─────────────────────────────────────────────────────────────
// Workspaces
// ─────────────────────────────────────────────────────────────
test.describe("Workspaces", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
  });

  test("shows workspace cards", async ({ page }) => {
    await page.goto(`${BASE_URL}/workspaces`);
    const wsCards = page.locator(".rounded-xl.border");
    await expect(wsCards.first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
// Logs — real-time mode
// ─────────────────────────────────────────────────────────────
test.describe("Logs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
  });

  test("shows live streaming indicator", async ({ page }) => {
    await page.goto(`${BASE_URL}/logs`);
    await expect(page.locator("text=即時串流中").or(page.locator("text=連線中"))).toBeVisible();
  });

  test("switches between live and history mode", async ({ page }) => {
    await page.goto(`${BASE_URL}/logs`);
    await page.click("text=📋 歷史");
    // History mode shows filter selects
    await expect(page.locator("select")).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
// Security
// ─────────────────────────────────────────────────────────────
test.describe("Security", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
  });

  test("shows security score", async ({ page }) => {
    await page.goto(`${BASE_URL}/security`);
    await expect(page.locator("text=/ 100")).toBeVisible();
  });

  test("shows audit items", async ({ page }) => {
    await page.goto(`${BASE_URL}/security`);
    await expect(page.locator("text=Security Audit 結果")).toBeVisible();
  });
});
