import { describe, expect, it, vi } from "vitest";

// Mock the knowledge loader before importing the chat service
vi.mock("@/lib/knowledge/loader", () => {
  const deepMerge = (a: Record<string, unknown>, b: Record<string, unknown>) => {
    const out: Record<string, unknown> = { ...a };
    for (const [k, v] of Object.entries(b)) {
      const av = out[k];
      if (
        av && typeof av === "object" && !Array.isArray(av) &&
        v && typeof v === "object" && !Array.isArray(v)
      ) {
        out[k] = deepMerge(av as Record<string, unknown>, v as Record<string, unknown>);
      } else {
        out[k] = v;
      }
    }
    return out;
  };
  return {
    // Simulate an overlay that changes dates and adds a new contact
    loadKnowledgeOverlay: vi.fn(async () => ({
      event: { dates: "December 1-2, 2026" },
      contact: { email: "overlay@paguyuban-messe.com" },
    })),
    deepMerge,
  };
});

import { PaguyubanChatService } from "@/lib/gemini";

function nextTick() {
  return new Promise((r) => setTimeout(r, 0));
}

describe("PaguyubanChatService overlay integration", () => {
  it("uses overlay values via [get:path] resolution", async () => {
    const svc = new PaguyubanChatService();
    // Allow the constructor's async overlay loader to complete
    await nextTick();

    const text = "Dates: [get:event.dates], Email: [get:contact.email]";
    const out = (svc as unknown as { resolveFunctionCall: (t: string) => string }).resolveFunctionCall(text);
    expect(out).toContain("December 1-2, 2026");
    expect(out).toContain("overlay@paguyuban-messe.com");
  });
});
