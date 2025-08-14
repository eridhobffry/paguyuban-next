import { test, expect } from "@playwright/test";

test.describe("homepage anchors", () => {
  test.beforeEach(async ({ page }) => {
    // Craft a dummy JWT accepted by middleware (no signature verification)
    const header = Buffer.from(
      JSON.stringify({ alg: "none", typ: "JWT" })
    ).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        sub: "e2e",
        role: "member",
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString("base64url");
    const token = `${header}.${payload}.x`;
    await page.context().addCookies([
      {
        name: "auth-token",
        value: token,
        url: "http://localhost:3000",
      },
    ]);
    await page.goto("/");
  });

  const anchorTests: Array<{ label: string; href: string; targetId: string }> =
    [
      {
        label: "View Investment Opportunity",
        href: "#investment-opportunity",
        targetId: "investment-opportunity",
      },
      {
        label: "Executive Summary",
        href: "#financial-transparency",
        targetId: "financial-transparency",
      },
      {
        label: "Register Now",
        href: "/request-access?type=register",
        targetId: "",
      },
    ];

  for (const { label, href, targetId } of anchorTests) {
    test(`CTA ${label} navigates to ${href}`, async ({ page }) => {
      // Use partial text since buttons may have trailing icons
      const link = page.getByRole("link", { name: new RegExp(label, "i") });
      await expect(link).toBeVisible();
      await link.click();
      if (href.startsWith("#") && targetId) {
        await expect(page.locator(`#${targetId}`)).toBeVisible();
      } else {
        await expect(page).toHaveURL(
          (url) => url.pathname === "/request-access"
        );
      }
    });
  }
});
