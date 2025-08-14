import { test, expect } from "@playwright/test";

const cases = [
  { type: "sponsor", heading: "Secure Sponsorship" },
  { type: "docs", heading: "Request Documentation" },
  { type: "demo", heading: "Request Platform Demo" },
  { type: "register", heading: "Register Interest" },
  { type: "workshop", heading: "Reserve Workshop Spot" },
];

test.describe("request-access types", () => {
  for (const c of cases) {
    test(`renders labels for type=${c.type}`, async ({ page }) => {
      await page.goto(`/request-access?type=${c.type}`);
      await expect(
        page.locator("h1, h2, [data-slot=card-title]")
      ).toContainText(c.heading);
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
      await expect(page.locator("#confirmPassword")).toBeVisible();
    });
  }
});
