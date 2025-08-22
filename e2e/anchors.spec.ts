import { test, expect } from "@playwright/test";

test.describe("@smoke homepage anchors", () => {
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
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
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
      {
        label: "Secure Sponsorship",
        href: "/request-access?type=sponsor",
        targetId: "",
      },
      {
        label: "Request Complete Documentation Package",
        href: "/request-access?type=docs",
        targetId: "",
      },
      {
        label: "Become a Sponsor",
        href: "/request-access?type=sponsor",
        targetId: "",
      },
      {
        label: "Download Financial Report",
        href: "/docs/financial-report.pdf",
        targetId: "",
      },
      {
        label: "View Sponsor Deck",
        href: "/docs/sponsor-deck.pdf",
        targetId: "",
      },
      {
        label: "Reserve Your Spot",
        href: "/request-access?type=workshop",
        targetId: "",
      },
      {
        label: "View Full Schedule",
        href: "#schedule",
        targetId: "schedule",
      },
      {
        label: "Download Workshop Guide",
        href: "/docs/workshop-guide.pdf",
        targetId: "",
      },
      {
        label: "Download Full Schedule",
        href: "/docs/schedule.pdf",
        targetId: "",
      },
      {
        label: "Stay Updated",
        href: "/request-access?type=updates",
        targetId: "",
      },
      {
        label: "Become a Speaker",
        href: "/request-access?type=speaker",
        targetId: "",
      },
      {
        label: "Download Brochure",
        href: "/docs/brochure.pdf",
        targetId: "",
      },
      {
        label: "Download Technical Specs",
        href: "/docs/technical-specs.pdf",
        targetId: "",
      },
      {
        label: "Request Platform Demo",
        href: "/request-access?type=demo",
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
