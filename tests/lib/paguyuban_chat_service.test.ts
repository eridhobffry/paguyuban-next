import { describe, expect, it } from "vitest";
import { PaguyubanChatService } from "@/lib/gemini";

// Note: We access private methods via type casting for unit testing.
// This is acceptable for white-box tests to verify intent/lookup behavior
// without invoking the external AI service.

describe("PaguyubanChatService internals", () => {
  it("detectIntent() identifies sponsorship cost intent and topic", () => {
    const svc = new PaguyubanChatService();
    const { intent, topic } = (svc as unknown as { detectIntent: (m: string) => { intent: string; topic: string } }).detectIntent(
      "How much is the sponsor package price?"
    );
    expect(intent).toBe("sponsorship_cost");
    expect(topic).toBe("sponsorship");
  });

  it("detectIntent() falls back to general_query with derived topic when no specific intent matches", () => {
    const svc = new PaguyubanChatService();
    const { intent, topic } = (svc as unknown as { detectIntent: (m: string) => { intent: string; topic: string } }).detectIntent(
      "When is the event date?"
    );
    expect(intent).toBe("general_query");
    // 'date' belongs to dates topic keywords
    expect(topic).toBe("dates");
  });

  it("resolveFunctionCall() replaces [get:path] with knowledge value (simple string)", () => {
    const svc = new PaguyubanChatService();
    const text = "The event runs on [get:event.dates].";
    const out = (svc as unknown as { resolveFunctionCall: (t: string) => string }).resolveFunctionCall(text);
    expect(out).toContain("August 7-8, 2026");
  });

  it("resolveFunctionCall() supports nested numeric/string paths like financials.revenue.total", () => {
    const svc = new PaguyubanChatService();
    const text = "Target revenue is [get:financials.revenue.total].";
    const out = (svc as unknown as { resolveFunctionCall: (t: string) => string }).resolveFunctionCall(text);
    // Accept either raw number or stringified number depending on knowledge format
    expect(out).toMatch(/\d/);
  });

  it("resolveFunctionCall() returns not-found placeholder for missing path", () => {
    const svc = new PaguyubanChatService();
    const text = "Value: [get:does.not.exist]";
    const out = (svc as unknown as { resolveFunctionCall: (t: string) => string }).resolveFunctionCall(text);
    expect(out).toContain("[Data for does.not.exist not found]");
  });

  it("resolveFunctionCall() stringifies objects when the value is non-primitive", () => {
    const svc = new PaguyubanChatService();
    const text = "Venue info: [get:event.venue]";
    const out = (svc as unknown as { resolveFunctionCall: (t: string) => string }).resolveFunctionCall(text);
    expect(() => JSON.parse(out.replace("Venue info: ", ""))).not.toThrow();
  });
});
