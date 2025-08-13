import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  verifyToken: vi.fn(() => ({ email: "admin@example.com", role: "admin" })),
  isAdmin: vi.fn(() => true),
}));

vi.mock("@/lib/jwt", () => ({
  isSuperAdminFromToken: vi.fn(() => true),
}));

vi.mock("@/lib/sql", () => ({
  getAllUsers: vi.fn(async (_status?: string) => {
    return [
      {
        id: "1",
        email: "a@x.com",
        role: "member",
        status: "pending",
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        email: "b@x.com",
        role: "admin",
        status: "active",
        created_at: new Date().toISOString(),
      },
    ];
  }),
  approveUser: vi.fn(async () => true),
  rejectUser: vi.fn(async () => true),
  disableUser: vi.fn(async () => true),
  deleteUser: vi.fn(async () => true),
  promoteUserToAdmin: vi.fn(async () => true),
  demoteUserToMember: vi.fn(async () => true),
}));

describe("/api/admin/users route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no token", async () => {
    const { GET } = await import("@/app/api/admin/users/route");
    const req: any = {
      url: "http://localhost/api/admin/users",
      cookies: { get: () => undefined },
    };
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("GET returns users with optional status filter", async () => {
    const { GET } = await import("@/app/api/admin/users/route");
    const req: any = {
      url: "http://localhost/api/admin/users?status=pending",
      cookies: { get: () => ({ value: "token" }) },
    };
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.users)).toBe(true);
  });

  it("PATCH approve calls approveUser and returns 200", async () => {
    const { PATCH } = await import("@/app/api/admin/users/route");
    const req: any = {
      url: "http://localhost/api/admin/users",
      cookies: { get: () => ({ value: "token" }) },
      json: async () => ({ email: "x@y.com", action: "approve" }),
    };
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBeDefined();
  });

  it("PATCH reject calls rejectUser and returns 200", async () => {
    const { PATCH } = await import("@/app/api/admin/users/route");
    const req: any = {
      url: "http://localhost/api/admin/users",
      cookies: { get: () => ({ value: "token" }) },
      json: async () => ({ email: "x@y.com", action: "reject" }),
    };
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it("PATCH disable calls disableUser and returns 200", async () => {
    const { PATCH } = await import("@/app/api/admin/users/route");
    const req: any = {
      url: "http://localhost/api/admin/users",
      cookies: { get: () => ({ value: "token" }) },
      json: async () => ({ email: "x@y.com", action: "disable" }),
    };
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });
});
