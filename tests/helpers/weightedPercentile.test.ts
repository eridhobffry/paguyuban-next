import { describe, it, expect } from "vitest";
import { weightedPercentile } from "@/lib/telemetry";

describe("weightedPercentile", () => {
  it("returns 0 for empty input", () => {
    expect(weightedPercentile([], 0.5)).toBe(0);
  });

  it("handles unweighted simple list", () => {
    const values = [1, 2, 3, 4, 5].map((v) => ({ value: v }));
    expect(weightedPercentile(values, 0)).toBe(1);
    expect(weightedPercentile(values, 0.5)).toBe(3);
    expect(weightedPercentile(values, 0.9)).toBe(5);
    expect(weightedPercentile(values, 0.99)).toBe(5);
  });

  it("respects weights (majority weight dominates)", () => {
    const values = [
      { value: 100, weight: 1 },
      { value: 200, weight: 9 },
    ];
    // Total weight = 10, target for p50 = 5 => hits 200 bucket
    expect(weightedPercentile(values, 0.5)).toBe(200);
    // p1 also should be 100 because cum after first is 1 and target is 0.1
    expect(weightedPercentile(values, 0.01)).toBe(100);
    // p9 ~ 90% => target = 9 -> first bucket 1 < 9, second reaches 10 -> 200
    expect(weightedPercentile(values, 0.9)).toBe(200);
  });

  it("sanitizes negative and non-finite inputs", () => {
    const values = [
      { value: -10, weight: -5 }, // becomes value 0, weight 0
      { value: Number.NaN, weight: 2 },
      { value: 10, weight: 2 },
    ];
    // Only the last item should be valid effectively with weight 2
    expect(weightedPercentile(values, 0.5)).toBe(10);
  });
});
