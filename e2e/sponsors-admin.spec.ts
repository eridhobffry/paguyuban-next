import { test, expect, type Page } from "@playwright/test";
import jwt from "jsonwebtoken";

// Helper to create an admin auth token consistent with the app's verify logic
function createAdminToken(): string {
  const secret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
  const payload = {
    id: "e2e-admin",
    email: "e2e-admin@example.com",
    role: "admin",
    user_type: "admin",
    is_super_admin: true,
  } as Record<string, unknown>;
  return jwt.sign(payload, secret, { expiresIn: "1d" });
}

async function loginAsAdmin({ page, baseURL }: { page: Page; baseURL: string }) {
  const token = createAdminToken();
  // Set cookie for the server domain before navigating
  await page.context().addCookies([
    {
      name: "auth-token",
      value: token,
      url: baseURL,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

test.describe.serial("Admin Sponsors CRUD", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await loginAsAdmin({ page, baseURL: baseURL! });
    // Optionally capture browser console/page errors for debugging
    if (process.env.PW_DEBUG_LOGS) {
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          console.log("[BROWSER console error]", msg.text());
        }
      });
      page.on("pageerror", (err) => {
        console.log("[BROWSER pageerror]", err?.stack || err?.message || String(err));
      });
    }
  });

  test("create, update, and delete a sponsor", async ({ page }) => {
    await page.goto("/admin/sponsors");

    // Create
    const addBtn = page.getByRole("button", { name: /add sponsor/i });
    await addBtn.scrollIntoViewIfNeeded();
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    await page.getByTestId("sponsor-name").fill("E2E Test Sponsor");
    await page.getByTestId("sponsor-url").fill("https://example.com/e2e");
    await page.getByTestId("sponsor-slug").fill("e2e-sponsor");
    await page.getByTestId("sponsor-tags").fill("testing, e2e");
    await page.getByTestId("sponsor-sort-order").fill("42");

    // Tier is optional depending on seed data availability
    const tierTrigger = page.getByTestId("sponsor-tier");
    if (await tierTrigger.isVisible()) {
      await tierTrigger.click();
      // Prefer selecting the first available item if present
      const firstOption = page.locator("[role='option']").first();
      if (await firstOption.isVisible()) await firstOption.click();
    }

    await page.getByRole("button", { name: /save/i }).click();

    // Wait for table refresh and assert new row exists
    await expect(page.getByRole("cell", { name: "E2E Test Sponsor" })).toBeVisible();

    // Update: open dialog by clicking the name cell (not the link cell)
    const rowToEdit = page.getByRole("row", { name: /E2E Test Sponsor/i }).first();
    const nameCell = rowToEdit.getByRole("cell", { name: "E2E Test Sponsor" });
    await nameCell.scrollIntoViewIfNeeded();
    await expect(nameCell).toBeVisible();
    await nameCell.click();
    await expect(page.getByTestId("sponsor-name")).toBeVisible();
    await page.getByTestId("sponsor-name").fill("E2E Test Sponsor Updated");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByRole("cell", { name: "E2E Test Sponsor Updated" })).toBeVisible();

    // Optional: Logo upload if configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const logoRow = page.getByRole("row", { name: /E2E Test Sponsor Updated/i }).first();
      const nameCell2 = logoRow.getByRole("cell", { name: "E2E Test Sponsor Updated" });
      await nameCell2.scrollIntoViewIfNeeded();
      await expect(nameCell2).toBeVisible();
      await nameCell2.click();
      const fileInput = page.getByTestId("logo-file");
      // Use a small existing image from the repo
      await fileInput.setInputFiles("public/images/og-image.jpg");
      // The hook shows an uploading note, then image preview
      await expect(page.getByText(/uploading/i)).toBeVisible({ timeout: 5000 });
      await expect(page.locator("img[alt='Logo']")).toBeVisible({ timeout: 15000 });
      await page.getByRole("button", { name: /save/i }).click();
      // After save, dialog closes
      await expect(fileInput).toBeHidden();
    }

    // Delete
    const row = page.getByRole("row", { name: /E2E Test Sponsor Updated/i });
    await expect(row).toBeVisible();

    // Accept the confirm() dialog
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: /delete/i }).click();

    await expect(page.getByRole("cell", { name: "E2E Test Sponsor Updated" })).toHaveCount(0);
  });
});
