import { describe, it, expect } from "vitest";
import { selectModel } from "@/lib/ai/model-router";

describe("model router", () => {
  it("routes Indonesian chat to qwen25-max", () => {
    const d = selectModel({ query: "Kapan acara dan berapa harga tiket?", task: "chat" });
    expect(d.model).toBe("qwen25-max");
    expect(d.language).toBe("id");
  });

  it("routes high-complexity analytics to deepseek-v3", () => {
    const d = selectModel({
      query: "Run ROI regression on campaign cohorts and optimize schedule",
      task: "analytics",
      taskComplexity: "high",
      involves: ["analytics", "math"],
    });
    expect(d.model).toBe("deepseek-v3");
  });
});

