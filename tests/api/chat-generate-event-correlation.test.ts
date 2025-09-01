import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const calls: Array<{ url: string; headers: Headers }> = [];

vi.mock("@/lib/ai/secure-fetch", () => {
  return {
    secureFetch: vi.fn(async (url: string, opts: any) => {
      const h = new Headers(opts?.headers || {});
      calls.push({ url, headers: h });
      // Simulate event chat success path
      if (String(url).includes("/api/event/chat")) {
        return new Response(
          JSON.stringify({ result: "ok_event", metadata: {} }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ result: "ok_other", metadata: {} }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }),
  };
});

vi.mock("@/lib/ai/semantic-cache", () => ({
  getCachedResponse: vi.fn(async () => null),
  setCachedResponse: vi.fn(async () => undefined),
}));

describe("event-chat correlation id propagation", () => {
  beforeEach(() => {
    calls.length = 0;
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

  it("returns X-Correlation-Id and forwards it to AI event chat", async () => {
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
    // first call should be to /api/event/chat
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0]!.url).toContain("/api/event/chat");
    expect(calls[0]!.headers.get("X-Correlation-Id")).toBe(cid);
  });
});

