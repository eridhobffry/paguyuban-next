import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "sh -c 'npm run build && npx next start -p 3100'",
    url: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_FEATURE_SPONSORS: "1",
      JWT_SECRET: process.env.JWT_SECRET || "your-secret-key-change-in-production",
      ...(process.env.DATABASE_URL ? { DATABASE_URL: process.env.DATABASE_URL } : {}),
      // If set locally/CI, this enables logo upload path to work during tests
      ...(process.env.BLOB_READ_WRITE_TOKEN
        ? { BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN }
        : {}),
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
});
