import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiFetch, setAiConsent } from "@/lib/client/ai";

describe("client ai helper", () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = vi.fn(async () => new Response("ok"));
    try {
      localStorage.clear();
    } catch {}
  });

  it("attaches consent header by default", async () => {
    setAiConsent("v1");
    await aiFetch("/api/test", { method: "POST" });
    const call = (global.fetch as any).mock.calls[0];
    const init = call[1] as RequestInit;
    const h = new Headers(init.headers as any);
    expect(h.get("x-ai-consent")).toBe("v1");
  });
});

