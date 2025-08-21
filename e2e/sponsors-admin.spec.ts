import { test, expect, type Page } from "@playwright/test";
import jwt from "jsonwebtoken";

// Helper to create an admin auth token consistent with the app's verify logic
function createAdminToken(): string {
  const secret =
    process.env.JWT_SECRET || "your-secret-key-change-in-production";
  const payload = {
    id: "e2e-admin",
    email: "e2e-admin@example.com",
    role: "admin",
    user_type: "admin",
    is_super_admin: true,
  } as Record<string, unknown>;
  return jwt.sign(payload, secret, { expiresIn: "1d" });
}

async function loginAsAdmin({
  page,
  baseURL,
}: {
  page: Page;
  baseURL: string;
}) {
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
        console.log(
          "[BROWSER pageerror]",
          err?.stack || err?.message || String(err)
        );
      });
    }
  });

  test("create, update, and delete a sponsor", async ({ page }) => {
    // Set longer timeout for this CRUD test and mark as slow
    test.slow();
    test.setTimeout(120_000);

    await page.goto("/admin/sponsors");

    // Create with unique name to avoid collisions in parallel runs
    const uniqueName = `E2E Test Sponsor ${Date.now()}`;
    const addBtn = page.getByRole("button", { name: /add sponsor/i });
    await addBtn.scrollIntoViewIfNeeded();
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    await page.getByTestId("sponsor-name").fill(uniqueName);
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

    // Wait for both the POST request and subsequent GET request to complete
    const savePromise = Promise.all([
      // Wait for POST to /api/admin/sponsors
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/admin/sponsors") &&
          resp.request().method() === "POST" &&
          resp.ok()
      ),
      // Click save button
      page.getByRole("button", { name: /save/i }).click(),
    ]);

    await savePromise;

    // Wait for the GET request that refreshes the table data
    await page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/admin/sponsors") &&
        resp.request().method() === "GET" &&
        resp.ok()
    );

    // Wait for table refresh and assert new row exists using row-level selector
    const table = page.getByRole("table");
    await expect(
      table.getByRole("row", { name: new RegExp(uniqueName, "i") })
    ).toBeVisible({ timeout: 15_000 });

    // Update: open dialog by clicking the name cell (not the link cell)
    const updatedName = `${uniqueName} Updated`;
    const rowToEdit = page
      .getByRole("row", { name: new RegExp(uniqueName, "i") })
      .first();
    const nameCell = rowToEdit.getByRole("cell", { name: uniqueName });
    await nameCell.scrollIntoViewIfNeeded();
    await expect(nameCell).toBeVisible();
    await nameCell.click();
    await expect(page.getByTestId("sponsor-name")).toBeVisible();
    await page.getByTestId("sponsor-name").fill(updatedName);

    // Wait for PUT request and table refresh
    const updatePromise = Promise.all([
      // Wait for PUT to /api/admin/sponsors
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/admin/sponsors") &&
          resp.request().method() === "PUT" &&
          resp.ok()
      ),
      // Click save button
      page.getByRole("button", { name: /save/i }).click(),
    ]);

    await updatePromise;

    // Wait for the GET request that refreshes the table data
    await page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/admin/sponsors") &&
        resp.request().method() === "GET" &&
        resp.ok()
    );

    // Assert updated row exists
    await expect(
      table.getByRole("row", { name: new RegExp(updatedName, "i") })
    ).toBeVisible({ timeout: 15_000 });

    // Optional: Logo upload if configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const logoRow = page
        .getByRole("row", { name: new RegExp(updatedName, "i") })
        .first();
      const nameCell2 = logoRow.getByRole("cell", { name: updatedName });
      await nameCell2.scrollIntoViewIfNeeded();
      await expect(nameCell2).toBeVisible();
      await nameCell2.click();
      const fileInput = page.getByTestId("logo-file");
      // Use a small existing image from the repo
      await fileInput.setInputFiles("public/images/og-image.jpg");
      // The hook shows an uploading note, then image preview
      await expect(page.getByText(/uploading/i)).toBeVisible({ timeout: 5000 });
      await expect(page.locator("img[alt='Logo']")).toBeVisible({
        timeout: 15000,
      });

      // Wait for logo upload save with network timing
      const logoSavePromise = Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("/api/admin/sponsors") &&
            resp.request().method() === "PUT" &&
            resp.ok()
        ),
        page.getByRole("button", { name: /save/i }).click(),
      ]);

      await logoSavePromise;

      // Wait for table refresh after logo update
      await page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/admin/sponsors") &&
          resp.request().method() === "GET" &&
          resp.ok()
      );

      // After save, dialog closes
      await expect(fileInput).toBeHidden();
    }

    // Delete
    const row = page.getByRole("row", { name: new RegExp(updatedName, "i") });
    await expect(row).toBeVisible();

    // Accept the confirm() dialog and wait for DELETE request
    const deletePromise = Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/admin/sponsors") &&
          resp.request().method() === "DELETE" &&
          resp.ok()
      ),
      new Promise<void>((resolve) => {
        page.once("dialog", (dialog) => {
          dialog.accept();
          resolve();
        });
      }),
      row.getByRole("button", { name: /delete/i }).click(),
    ]);

    await deletePromise;

    // Wait for table refresh after delete
    await page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/admin/sponsors") &&
        resp.request().method() === "GET" &&
        resp.ok()
    );

    // Assert row is removed
    await expect(
      table.getByRole("row", { name: new RegExp(updatedName, "i") })
    ).toHaveCount(0);
  });
});
