import { test, expect } from "@playwright/test";

test("@smoke homepage loads and has correct title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Nusantara Messe 2026/);
});

test("@smoke homepage has no broken images", async ({ page }) => {
  await page.goto("/");

  // Check for broken images by looking for img elements with failed src
  const images = page.locator("img");
  const imageCount = await images.count();

  for (let i = 0; i < imageCount; i++) {
    const img = images.nth(i);
    const src = await img.getAttribute("src");

    if (src && !src.startsWith("data:")) {
      // For non-data URLs, check if image loads
      const response = await page.request.get(src);
      expect(response.ok(), `Image ${src} should load successfully`).toBe(true);
    }
  }
});

test("@smoke homepage sections are visible", async ({ page }) => {
  await page.goto("/");

  // Check that main sections exist and are visible
  const sections = [
    "#investment-opportunity",
    "#financial-transparency",
    "#features",
    "#about",
    "#cultural-workshops",
    "#schedule",
    "#speakers",
    "#sponsors",
    "#technology-platform",
    "#trade-context",
  ];

  for (const section of sections) {
    const element = page.locator(section);
    await expect(element).toBeVisible({ timeout: 10000 });
  }
});

test("@smoke homepage has no console errors", async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");

  // Wait a bit more for any dynamic content
  await page.waitForTimeout(3000);

  // Allow some console errors (like favicon, manifest, etc.)
  const criticalErrors = consoleErrors.filter(
    (error) =>
      !error.includes("favicon") &&
      !error.includes("manifest") &&
      !error.includes("Failed to load resource") &&
      !error.includes("404") &&
      !error.includes("google") &&
      !error.includes("analytics")
  );

  expect(
    criticalErrors,
    `Critical console errors found: ${criticalErrors.join(", ")}`
  ).toHaveLength(0);
});
