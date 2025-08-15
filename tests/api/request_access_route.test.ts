import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  hashPassword: vi.fn(async (p: string) => `hashed:${p}`),
}));

const upsertSpy = vi.fn(async () => ({}));
vi.mock("@/lib/sql", () => ({
  upsertPendingUser: upsertSpy,
}));

describe("/api/auth/request-access route", () => {
  beforeEach(() => {
    upsertSpy.mockClear();
  });

  it("requires email and password", async () => {
    const { POST } = await import("@/app/api/auth/request-access/route");
    const req: any = { json: async () => ({}) };
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("upserts pending user with hashed password", async () => {
    const { POST } = await import("@/app/api/auth/request-access/route");
    const req: any = {
      json: async () => ({ email: "a@b.com", password: "pw" }),
    };
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(upsertSpy).toHaveBeenCalledWith(
      "a@b.com",
      expect.stringContaining("hashed:")
    );
  });
});
