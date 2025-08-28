import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/ai/data/analytics-context/route";

// Hoisted state for DB rows and shared schema identity
const hoisted = vi.hoisted(() => {
  const state = {
    prefsRows: [] as any[],
    eventsRows: [] as any[],
    perfRows: [] as any[],
  };
  const makeChain = (rowsProvider: () => any[]) => ({
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation(async () => rowsProvider()),
  });
  const schema = {
    analyticsEvents: {
      id: "id",
      type: "type",
      section: "section",
      route: "route",
      metadata: "metadata",
      createdAt: "created_at",
      sessionId: "session_id",
      userId: "user_id",
    },
    userQueryPreferences: {
      userId: "user_id",
      language: "language",
      theme: "theme",
      preferredMetrics: "preferred_metrics",
      preferredDimensions: "preferred_dimensions",
      autoSaveQueries: "auto_save_queries",
      updatedAt: "updated_at",
    },
    queryPerformance: {
      id: "id",
      queryType: "query_type",
      responseTime: "response_time",
      tokenCount: "token_count",
      success: "success",
      userRating: "user_rating",
      userFeedback: "user_feedback",
      createdAt: "created_at",
      sessionId: "session_id",
      userId: "user_id",
    },
  } as const;
  return { state, makeChain, schema };
});

// Schema mocks used by the route (shared identity with drizzle mock)
vi.mock("@/lib/db/schema", () => (hoisted as any).schema);

// DB mock constructed inside mock factory and using mocked schema identity
vi.mock("@/lib/db/drizzle", () => {
  const { state, makeChain, schema } = hoisted as unknown as {
    state: { prefsRows: any[]; eventsRows: any[]; perfRows: any[] };
    makeChain: (rowsProvider: () => any[]) => any;
    schema: any;
  };
  const db = {
    select: vi.fn((_fields?: any) => ({
      from: vi.fn((table: any) => {
        if (table === schema.userQueryPreferences) return makeChain(() => state.prefsRows);
        if (table === schema.analyticsEvents) return makeChain(() => state.eventsRows);
        if (table === schema.queryPerformance) return makeChain(() => state.perfRows);
        return makeChain(() => []);
      }),
    })),
  };
  return { db };
});

// We don't assert the internals of drizzle-orm helpers; no need to mock eq/and/gte/desc

describe("API: /api/ai/data/analytics-context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.state.prefsRows.length = 0;
    hoisted.state.eventsRows.length = 0;
    hoisted.state.eventsRows.push(
      {
        id: "e1",
        type: "click",
        section: "hero",
        route: "/",
        metadata: { el: "cta" },
        created_at: new Date(Date.now() - 1000).toISOString(),
      },
      {
        id: "e2",
        type: "view",
        section: "speakers",
        route: "/speakers",
        metadata: {},
        created_at: new Date(Date.now() - 2000).toISOString(),
      }
    );
    hoisted.state.perfRows.length = 0;
    hoisted.state.perfRows.push(
      {
        id: "p1",
        query_type: "faq",
        response_time: 1000,
        token_count: 200,
        success: true,
        user_rating: 4,
        user_feedback: null,
        created_at: new Date(Date.now() - 5000).toISOString(),
      },
      {
        id: "p2",
        query_type: "faq",
        response_time: 3000,
        token_count: 150,
        success: false,
        user_rating: null,
        user_feedback: null,
        created_at: new Date(Date.now() - 6000).toISOString(),
      }
    );
  });

  it("returns metadata, events, and cache headers by default", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/data/analytics-context");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe(
      "s-maxage=30, stale-while-revalidate=30"
    );
    expect(data.metadata.time_range_days).toBe(7);
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.events.length).toBe(2);
  });

  it("includes preferences when userId is provided", async () => {
    hoisted.state.prefsRows.length = 0;
    hoisted.state.prefsRows.push({
      language: "en",
      theme: "dark",
      preferred_metrics: ["sessions"],
      preferred_dimensions: ["device"],
      auto_save_queries: true,
      updated_at: new Date().toISOString(),
    });
    const req = new NextRequest(
      "http://localhost:3000/api/ai/data/analytics-context?userId=u1"
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.preferences).toBeTruthy();
    expect(data.metadata.user_id).toBe("u1");
  });

  it("computes behavior metrics when sessionId is provided", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/ai/data/analytics-context?sessionId=11111111-1111-4111-8111-111111111111"
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.performance.length).toBe(2);
    expect(data.behavior).toBeTruthy();
    // average_response_time should be rounded of (1000 + 3000)/2 = 2000
    expect(data.behavior.average_response_time).toBe(2000);
    // success_rate = 1/2 = 0.5
    expect(data.behavior.success_rate).toBe(0.5);
  });

  it("adds personalization when intent=personalization and events exist", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/ai/data/analytics-context?intent=personalization&userId=u1"
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.personalization).toBeTruthy();
    expect(Array.isArray(data.personalization.frequent_sections)).toBe(true);
    expect(Array.isArray(data.personalization.common_routes)).toBe(true);
  });
});
