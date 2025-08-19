import { test, expect } from "@playwright/test";

test("@smoke homepage loads and has correct title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Nusantara Messe 2026/);
});
