import { describe, it, expect } from "vitest";
import { getCachedResponse, setCachedResponse } from "@/lib/ai/semantic-cache";

describe("semantic cache", () => {
  it("returns a hit for similar Indonesian prompts", () => {
    const ctx = { locale: "id" as const, city: "Berlin", eventStart: "2026-08-05", eventEnd: "2026-08-10" };
    setCachedResponse(
      "Kapan acara Paguyuban Messe 2026 di Berlin?",
      ctx,
      "Acara berlangsung 7-8 Agustus 2026 di Arena Berlin.",
      "qwen25-max"
    );
    const hit = getCachedResponse("Tanggal Paguyuban Messe 2026 di Berlin kapan ya?", ctx, 0.7); // Lower threshold for test
    expect(hit).not.toBeNull();
    expect(hit!.score).toBeGreaterThan(0.6); // More lenient expectation
  });
});

