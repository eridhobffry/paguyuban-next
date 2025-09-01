import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Capture calls to secureFetch
const calls: Array<{ url: string; headers: Headers }> = [];

vi.mock("@/lib/ai/secure-fetch", () => {
  return {
    secureFetch: vi.fn(async (url: string, opts: any) => {
      const h = new Headers(opts?.headers || {});
      calls.push({ url, headers: h });
      // Simulate AI service success
      return new Response(
        JSON.stringify({ result: "ok", metadata: { model_used: h.get("X-AI-Model") } }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }),
  };
});

// Avoid hitting DB during semantic cache operations in tests
vi.mock("@/lib/ai/semantic-cache", () => {
  return {
    getCachedResponse: vi.fn(async () => null),
    setCachedResponse: vi.fn(async () => undefined),
  };
});

describe("chat generate sets intent headers", () => {
  beforeEach(() => {
    calls.length = 0;
    // Mock intent resolver fetch
    global.fetch = vi.fn(async (url: any, init: any) => {
      if (typeof url === "string" && url.includes("/api/ai/intent/resolve")) {
        return new Response(
          JSON.stringify({ intent: "event_timing", confidence: 0.9 }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      // Default empty JSON
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as any;
  });

  it("propagates X-Intent and complexity headers to AI service", async () => {
    const { POST } = await import("@/app/api/chat/generate/route");
    const req = new NextRequest("http://localhost:3000/api/chat/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ai-consent": "v1",
      },
      body: JSON.stringify({ message: "Kapan acara?", assistantType: "ucup" }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(calls.length).toBeGreaterThan(0);
    const h = calls[0]!.headers;
    expect(h.get("X-Intent")).toBe("event_timing");
    expect(h.get("X-Task-Complexity")).toBe("low");
    // When no analytics intent, X-Involves should be empty or null
    expect(h.get("X-Involves") || "").toBe("");
  });
});
