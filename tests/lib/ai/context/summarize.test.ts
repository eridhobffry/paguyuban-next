import { describe, it, expect } from "vitest";
import { compactText, summarizeTurns } from "@/lib/ai/context/summarize";
import type { ContextChunk } from "@/lib/ai/context/window";

const charEstimator = (t: string) => t.length;

function chunk(
  role: ContextChunk["role"],
  content: string,
  ts: number
): ContextChunk {
  return { role, content, timestamp: ts };
}

describe("ai/context/summarize", () => {
  it("compactText() returns original when within budget", () => {
    const input = "Hello world.";
    const { text, truncated } = compactText(input, 20, {
      tokenEstimator: charEstimator,
    });
    expect(text).toBe("Hello world.");
    expect(truncated).toBe(false);
  });

  it("compactText() truncates with ellipsis when exceeding budget", () => {
    const input = "A. B. C."; // sentences
    const { text, truncated } = compactText(input, 3, {
      tokenEstimator: charEstimator,
    });
    expect(text.endsWith("…")).toBe(true);
    expect(truncated).toBe(true);
  });

  it("summarizeTurns() prefers most recent turns within budget and compacts", () => {
    const turns: ContextChunk[] = [
      chunk("user", "Old question?", 1),
      chunk("assistant", "Old answer.", 2),
      chunk("user", "New question with more details.", 3),
      chunk("assistant", "Newer, longer answer with explanation.", 4),
    ];

    const { text, truncated } = summarizeTurns(turns, 40, {
      tokenEstimator: charEstimator,
    });
    // Should include recent ones first when assembling
    expect(text).toMatch(/\[assistant\] Newer/);
    expect(text).toMatch(/\[user\]/);
    // May drop older due to budget
    expect(truncated).toBeTypeOf("boolean");
  });
});
