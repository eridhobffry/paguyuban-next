import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/email", () => ({
  notifyAdminNewPartnershipApplication: vi.fn(async () => true),
}));

vi.mock("@/lib/sql", async () => {
  const actual: any = await vi.importActual("@/lib/sql");
  return {
    ...actual,
    ensurePartnershipApplicationsTable: vi.fn(async () => {}),
    createPartnershipApplication: vi.fn(async (input: any) => ({
      id: "uuid-1",
      created_at: new Date().toISOString(),
      ...input,
    })),
  };
});

describe("/api/partnership-application route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates payload and returns 400 on invalid body", async () => {
    const { POST } = await import("@/app/api/partnership-application/route");
    const req: any = { json: async () => ({}) };
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates application and returns 201", async () => {
    const { POST } = await import("@/app/api/partnership-application/route");
    const payload = {
      name: "Jane Doe",
      email: "jane@example.com",
      company: "Acme",
      phone: "+49 123",
      interest: "sponsorship",
      budget: "100k EUR",
      message: "We want to partner",
      source: "test",
    };
    const req: any = { json: async () => payload };
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data?.application?.email).toBe("jane@example.com");
  });
});
