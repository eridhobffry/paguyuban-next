import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/ai/data/chat-context/route";

// Hoisted state to avoid referencing not-yet-initialized variables inside mock factories
const hoisted = vi.hoisted(() => {
  const getCachedMock = vi.fn((key: string, _ttl: number, provider: () => any) => provider());
  const state = {
    chatRows: [] as any[],
  };
  const makeChain = (rowsProvider: () => any[]) => ({
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation(async () => rowsProvider()),
  });
  const schema = {
    chatbotLogs: {
      id: "id",
      sessionId: "session_id",
      role: "role",
      message: "message",
      userId: "user_id",
      tokens: "tokens",
      createdAt: "created_at",
    },
  } as const;
  return { getCachedMock, state, makeChain, schema };
});

// Cache mock (call-through) using hoisted reference to avoid hoisting issues
vi.mock("@/lib/cache", () => ({ getCached: (hoisted as any).getCachedMock }));

// Schema mock uses hoisted.schema so identity is shared with drizzle mock
vi.mock("@/lib/db/schema", () => (hoisted as any).schema);

// DB mock constructed inside factory and using mocked schema identity
vi.mock("@/lib/db/drizzle", () => {
  const { state, makeChain, schema } = hoisted as unknown as {
    state: { chatRows: any[] };
    makeChain: (rowsProvider: () => any[]) => any;
    schema: any;
  };
  const db = {
    select: vi.fn((_fields?: any) => ({
      from: vi.fn((table: any) => {
        if (table === schema.chatbotLogs) return makeChain(() => state.chatRows);
        return makeChain(() => []);
      }),
    })),
  };
  return { db };
});

describe("API: /api/ai/data/chat-context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 2 user messages and 1 assistant for sentiment checks
    hoisted.state.chatRows.length = 0;
    hoisted.state.chatRows.push(
      {
        id: "3",
        session_id: "11111111-1111-4111-8111-111111111111",
        role: "assistant",
        message: "Here is more info.",
        user_id: "u1",
        tokens: 10,
        created_at: new Date(Date.now() - 1000).toISOString(),
      },
      {
        id: "2",
        session_id: "11111111-1111-4111-8111-111111111111",
        role: "user",
        message: "I am very interested and excited",
        user_id: "u1",
        tokens: 5,
        created_at: new Date(Date.now() - 2000).toISOString(),
      },
      {
        id: "1",
        session_id: "11111111-1111-4111-8111-111111111111",
        role: "user",
        message: "This looks great!",
        user_id: "u1",
        tokens: 5,
        created_at: new Date(Date.now() - 3000).toISOString(),
      }
    );
  });

  it("validates sessionId and returns 400 for missing/invalid", async () => {
    const bad = new NextRequest("http://localhost:3000/api/ai/data/chat-context");
    const badRes = await GET(bad);
    expect(badRes.status).toBe(400);
    const badData = await badRes.json();
    expect(badData).toHaveProperty("error");
    expect(Array.isArray(badData.issues)).toBe(true);
  });

  it("returns logs, metadata, and cache headers for valid sessionId", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/ai/data/chat-context?sessionId=11111111-1111-4111-8111-111111111111"
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe(
      "s-maxage=10, stale-while-revalidate=10"
    );

    expect(Array.isArray(data.logs)).toBe(true);
    expect(data.logs.length).toBe(3);
    // Should be chronological order after reverse()
    expect(data.logs[0].id).toBe("1");
    expect(data.logs[2].id).toBe("3");

    expect(data.metadata.session_id).toBe(
      "11111111-1111-4111-8111-111111111111"
    );

    // getCached called with composite key and TTL
    expect((hoisted as any).getCachedMock).toHaveBeenCalledWith(
      expect.stringContaining("chat-context:11111111-1111-4111-8111-111111111111:20"),
      10_000,
      expect.any(Function)
    );
  });

  it("computes positive sentiment when positive words dominate", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/ai/data/chat-context?sessionId=11111111-1111-4111-8111-111111111111"
    );
    const res = await GET(req);
    const data = await res.json();
    expect(["positive", "neutral", "negative"]).toContain(data.sentiment);
    expect(data.sentiment).toBe("positive");
  });

  it("computes negative sentiment when negative words dominate", async () => {
    hoisted.state.chatRows[1].message = "This is expensive and I am disappointed";
    hoisted.state.chatRows[2].message = "not sure";
    const req = new NextRequest(
      "http://localhost:3000/api/ai/data/chat-context?sessionId=11111111-1111-4111-8111-111111111111"
    );
    const res = await GET(req);
    const data = await res.json();
    expect(data.sentiment).toBe("negative");
  });
});
