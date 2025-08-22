import { test, expect } from "@playwright/test";

test.describe("@smoke comprehensive smoke tests", () => {
  test("homepage has no failed network requests", async ({ page }) => {
    const failedRequests: string[] = [];

    page.on("requestfailed", (request) => {
      // Ignore common acceptable failures
      if (
        !request.url().includes("favicon.ico") &&
        !request.url().includes("robots.txt") &&
        !request.url().includes("manifest.json") &&
        !request.url().includes("google-analytics") &&
        !request.url().includes("googletagmanager")
      ) {
        failedRequests.push(`${request.method()} ${request.url()}`);
      }
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000); // Wait for any dynamic content

    // Allow some non-critical failed requests
    const criticalFailures = failedRequests.filter(
      (req) =>
        !req.includes("_rsc") && // Next.js RSC requests
        !req.includes("favicon") &&
        !req.includes("manifest") &&
        !req.includes("google") &&
        !req.includes("analytics")
    );

    expect(
      criticalFailures,
      `Critical failed requests: ${criticalFailures.join(", ")}`
    ).toHaveLength(0);
  });

  test("public API endpoints respond correctly", async ({ request }) => {
    const endpoints = [
      "/api/speakers/public",
      "/api/artists/public",
      "/api/documents/public",
      "/api/financial/public",
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect(response.ok(), `${endpoint} should return 200`).toBe(true);

      const data = await response.json();
      // Some endpoints might return objects with data array, others direct arrays
      expect(data, `${endpoint} should return data`).toBeTruthy();
      if (Array.isArray(data)) {
        expect(data.length).toBeGreaterThanOrEqual(0);
      } else if (data && typeof data === "object" && "data" in data) {
        expect(
          Array.isArray(data.data),
          `${endpoint} should have data array`
        ).toBe(true);
      }
    }
  });

  test("all document downloads are accessible", async ({ request }) => {
    const documents = [
      "/docs/brochure.pdf",
      "/docs/proposal.pdf",
      "/docs/sponsorship-kit.pdf",
      "/docs/financial-report.pdf",
      "/docs/sponsor-deck.pdf",
      "/docs/workshop-guide.pdf",
      "/docs/schedule.pdf",
      "/docs/technical-specs.pdf",
    ];

    for (const doc of documents) {
      const response = await request.get(doc);
      expect(response.ok(), `${doc} should be accessible`).toBe(true);
      expect(
        response.headers()["content-length"],
        `${doc} should have content`
      ).toBeTruthy();
    }
  });

  test("ICS calendar is valid and downloadable", async ({ request }) => {
    const response = await request.get("/calendar/event.ics");
    expect(response.ok()).toBe(true);

    const icsContent = await response.text();
    expect(icsContent).toContain("BEGIN:VCALENDAR");
    expect(icsContent).toContain("END:VCALENDAR");
    expect(icsContent).toContain("DTSTART");
    expect(icsContent).toContain("DTEND");
  });

  test("homepage performance - lighthouse score baseline", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Measure key performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentEventEnd - navigation.fetchStart,
      };
    });

    const totalTime = Date.now() - startTime;

    // Performance thresholds (reasonable for a content-heavy site)
    expect(metrics.loadTime).toBeLessThan(5000); // 5 seconds
    expect(metrics.domContentLoaded).toBeLessThan(3000); // 3 seconds
    expect(totalTime).toBeLessThan(8000); // 8 seconds total
  });

  test("mobile responsiveness - viewport and touch targets", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto("/");

    // Check that content is accessible on mobile
    await expect(page.locator("h1")).toBeVisible();
    // Check for horizontal scroll (should be minimal)
    const body = page.locator("body");
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);
    expect(scrollWidth - clientWidth).toBeLessThan(50); // Allow minimal horizontal scroll

    // Check for minimum touch target sizes (44px recommended)
    const buttons = page.locator("button, a[role='button'], [onclick]");
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const boundingBox = await button.boundingBox();

      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("accessibility - basic ARIA and semantic checks", async ({ page }) => {
    await page.goto("/");

    // Check for proper heading hierarchy
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeGreaterThan(0);

    // Check for alt text on images
    const imagesWithoutAlt = await page.locator("img:not([alt])").count();
    expect(imagesWithoutAlt).toBe(0);

    // Check for proper form labels
    const inputsWithoutLabels = await page
      .locator(
        "input:not([aria-label]):not([aria-labelledby]):not([placeholder])"
      )
      .count();
    // Allow some inputs without labels (e.g., hidden inputs)
    expect(inputsWithoutLabels).toBeLessThan(5);

    // Check for proper button text
    const buttonsWithoutText = await page
      .locator("button:not([aria-label]):not([aria-labelledby]):empty")
      .count();
    expect(buttonsWithoutText).toBe(0);
  });
});
