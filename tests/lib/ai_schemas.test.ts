import { describe, expect, it } from "vitest";
import { AiSummarySchema } from "@/lib/ai/schemas";

describe("AiSummarySchema", () => {
  it("accepts a valid AI summary payload", () => {
    const input = {
      summary: "User asked about pricing and sponsors. We discussed tiers and ROI.",
      topics: ["pricing", "sponsorship", "roi"],
      sentiment: "neutral" as const,
    };
    const parsed = AiSummarySchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.summary.length).toBeGreaterThan(0);
      expect(parsed.data.topics.length).toBeGreaterThan(0);
    }
  });

  it("rejects when summary is missing", () => {
    const input = {
      topics: ["pricing"],
      sentiment: "positive" as const,
    } as unknown;
    const parsed = AiSummarySchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it("rejects when sentiment is invalid", () => {
    const input = {
      summary: "Something",
      topics: ["x"],
      sentiment: "great", // invalid
    } as unknown;
    const parsed = AiSummarySchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it("enforces topics to be a non-empty array of strings", () => {
    const input = {
      summary: "Ok",
      topics: [],
      sentiment: "neutral" as const,
    };
    const parsed = AiSummarySchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });
});
