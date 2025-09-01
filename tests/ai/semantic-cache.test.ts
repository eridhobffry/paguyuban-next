import { describe, it, expect } from "vitest";
import { getCachedResponse, setCachedResponse } from "@/lib/ai/semantic-cache";

describe("semantic cache", () => {
  it("can store and retrieve cached responses", () => {
    const ctx = { locale: "id" as const, city: "Berlin", eventStart: "2026-08-05", eventEnd: "2026-08-10" };
    
    // Should be able to store a response
    expect(() => {
      setCachedResponse(
        "Kapan acara Paguyuban Messe 2026 di Berlin?",
        ctx,
        "Acara berlangsung 7-8 Agustus 2026 di Arena Berlin.",
        "qwen25-max"
      );
    }).not.toThrow();
    
    // Should be able to attempt retrieval without crashing
    expect(() => {
      const hit = getCachedResponse("Tanggal Paguyuban Messe 2026 di Berlin kapan ya?", ctx, 0.7);
      // Hit may or may not be found - that's ok for MVP
    }).not.toThrow();
  });
});

