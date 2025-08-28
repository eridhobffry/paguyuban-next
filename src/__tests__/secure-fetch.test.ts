import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { secureFetch, __private__ } from "@/lib/ai/secure-fetch";

describe("secureFetch resilience", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  });
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset state
    __private__.breakers.clear();
    __private__.inflight.clear();
    __private__.resultCache.clear();
  });

  it("deduplicates identical requests within 10s window", async () => {
    const body = JSON.stringify({ hello: "world" });
    let calls = 0;
    vi.spyOn(global, "fetch" as any).mockImplementation(async () => {
      calls++;
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
    });

    const url = "http://ai.local/api/chat/generate";
    const res1 = await secureFetch(url, { method: "POST", body });
    const res2 = await secureFetch(url, { method: "POST", body });
    expect(calls).toBe(1);
    const j1 = await res1.json();
    const j2 = await res2.json();
    expect(j1).toEqual(j2);
  });

  it("opens breaker after 5 consecutive failures and short-circuits", async () => {
    vi.spyOn(global, "fetch" as any).mockResolvedValue(new Response("fail", { status: 502 }));
    const url = "http://ai.local/api/event/chat";
    let failures = 0;
    for (let i = 0; i < 5; i++) {
      try {
        await secureFetch(url, { method: "POST", body: JSON.stringify({}) });
      } catch {
        failures++;
      }
    }
    expect(failures).toBe(5);
    await expect(secureFetch(url, { method: "POST", body: JSON.stringify({}) })).rejects.toThrow();
  });
});
