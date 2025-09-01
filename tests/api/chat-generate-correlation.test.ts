import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock secureFetch to avoid network and DB
vi.mock("@/lib/ai/secure-fetch", () => {
  return {
    secureFetch: vi.fn(async (url: string) => {
      return new Response(
        JSON.stringify({ result: "ok", metadata: {} }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }),
  };
});

// Avoid DB-backed semantic cache during test
vi.mock("@/lib/ai/semantic-cache", () => ({
  getCachedResponse: vi.fn(async () => null),
  setCachedResponse: vi.fn(async () => undefined),
}));

describe("chat generate sets correlation id header", () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (url: any) => {
      if (typeof url === "string" && url.includes("/api/ai/intent/resolve")) {
        return new Response(
          JSON.stringify({ intent: "event_timing", confidence: 0.9 }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as any;
  });

  it("returns X-Correlation-Id on response", async () => {
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
    const cid = res.headers.get("x-correlation-id");
    expect(cid).toBeTruthy();
  });
});

