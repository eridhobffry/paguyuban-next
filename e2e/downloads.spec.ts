import { test, expect } from "@playwright/test";
import { PUBLIC_DOWNLOAD_KEY } from "../src/lib/documents/constants";

test.describe("public downloads", () => {
  const keys = Object.values(PUBLIC_DOWNLOAD_KEY);

  for (const key of keys) {
    test(`GET /api/documents/public/download/${key} resolves`, async ({
      request,
    }) => {
      const res = await request.get(`/api/documents/public/download/${key}`);
      const status = res.status();
      expect([200, 302]).toContain(status);
      if (status === 200) {
        const buf = await res.body();
        expect(buf.byteLength).toBeGreaterThan(0);
      }
    });
  }
});
