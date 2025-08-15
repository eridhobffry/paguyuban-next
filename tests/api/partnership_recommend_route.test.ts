import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  verifyToken: vi.fn(() => ({ id: "u1", email: "admin@x.com", role: "admin", status: "active" })),
  isAdmin: vi.fn(() => true),
}));

vi.mock("@/lib/sql", () => ({
  ensurePartnershipApplicationRecommendationsTable: vi.fn(async () => {}),
  getPartnershipApplicationById: vi.fn(async (id: string) => {
    if (id === "00000000-0000-0000-0000-000000000000") return null;
    return {
      id,
      name: "Alex",
      email: "alex@co.com",
      company: "ACME",
      phone: "+62xxxx",
      interest: "Gold Sponsorship",
      budget: "10k-20k",
      message: "Interested in the event",
      source: "web",
      created_at: new Date(),
    };
  }),
  createPartnershipApplicationRecommendation: vi.fn(async () => ({ id: "rec1" })),
}));

describe("/api/admin/partnership/recommend route", () => {
  const OLD_FETCH = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text:
                    '{"recommended_actions":[{"title":"Schedule call","description":"Offer 20-min call","priority":"high"}],"journey":[],"next_best_action":"Propose call","prospect_summary":"Summary","follow_ups":{"email_positive":"Hi Alex...","email_neutral":"Hi Alex...","email_negative":"Hi Alex...","whatsapp_positive":"Hi Alex...","whatsapp_neutral":"Hi Alex...","whatsapp_negative":"Hi Alex..."}}',
                },
              ],
            },
          },
        ],
      }),
    })) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = OLD_FETCH;
  });

  it("returns 401 when no token", async () => {
    const { POST } = await import("@/app/api/admin/partnership/recommend/route");
    type MockCookies = { get: () => { value: string } | undefined };
    type MockRequest = { url: string; cookies: MockCookies; json: () => Promise<unknown> };
    const req: MockRequest = {
      url: "http://localhost/api/admin/partnership/recommend",
      cookies: { get: () => undefined },
      json: async () => ({ applicationId: "11111111-1111-1111-1111-111111111111" }),
    };
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(401);
  });

  it("returns 404 when application not found", async () => {
    const { POST } = await import("@/app/api/admin/partnership/recommend/route");
    type MockCookies = { get: () => { value: string } | undefined };
    type MockRequest = { url: string; cookies: MockCookies; json: () => Promise<unknown> };
    const req: MockRequest = {
      url: "http://localhost/api/admin/partnership/recommend",
      cookies: { get: () => ({ value: "token" }) },
      json: async () => ({
        applicationId: "00000000-0000-0000-0000-000000000000",
      }),
    };
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(404);
  });

  it("generates, stores and returns structured recommendations", async () => {
    const { POST } = await import("@/app/api/admin/partnership/recommend/route");
    // Valid v4 UUID (version=4, variant=8-9-a-b)
    const applicationId = "550e8400-e29b-41d4-a716-446655440000";
    type MockCookies = { get: () => { value: string } | undefined };
    type MockRequest = { url: string; cookies: MockCookies; json: () => Promise<unknown> };
    const req: MockRequest = {
      url: "http://localhost/api/admin/partnership/recommend",
      cookies: { get: () => ({ value: "token" }) },
      json: async () => ({ applicationId, sentiment: "positive" }),
    };
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.nextBestAction).toBeTruthy();
    expect(Array.isArray(body.recommendedActions)).toBe(true);
    expect(body.followUps).toBeTruthy();
    expect(body.followUps.emailPositive).toContain("Hi");
  });
});
