import { describe, it, expect, vi, beforeEach } from "vitest";
import { __private__ as healthPrivate } from "@/app/api/health/route";

describe("/api/health checks", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns ok for AI and DB when both succeed", async () => {
    // Mock fetch
    const mockFetch = vi.spyOn(global, "fetch" as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: "2.25.0", uptime: 10 }),
    } as any);

    // Mock db
    const mockDb = vi
      .spyOn(await import("@/lib/db/drizzle"), "db")
      // @ts-expect-error partial mock
      .mockImplementation(() => ({})) as any;
    // Patch execute
    (mockDb as any).execute = vi
      .fn()
      .mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });

    const ai = await healthPrivate.checkAI();
    const db = await healthPrivate.checkDB();

    expect(ai.ok).toBe(true);
    expect(db.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalled();
  });

  it("handles AI failure and DB success (degraded)", async () => {
    vi.spyOn(global, "fetch" as any).mockRejectedValueOnce(
      new Error("network")
    );
    const mockDb = vi.spyOn(
      await import("@/lib/db/drizzle"),
      "db"
    ) as unknown as { execute: any };
    (mockDb as any).execute = vi.fn().mockResolvedValueOnce({});

    const ai = await healthPrivate.checkAI();
    const db = await healthPrivate.checkDB();
    expect(ai.ok).toBe(false);
    expect(db.ok).toBe(true);
  });
});
