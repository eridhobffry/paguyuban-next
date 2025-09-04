import { describe, it, expect } from "vitest";
import {
  estimateTokens,
  modelBudget,
  assembleContext,
  type ContextChunk,
} from "@/lib/ai/context/window";

// Simple character-based estimator for deterministic tests
const charEstimator = (text: string) => text.length;

function chunk(
  role: ContextChunk["role"],
  content: string,
  extra: Partial<ContextChunk> = {}
): ContextChunk {
  return { role, content, timestamp: Date.now(), ...extra };
}

describe("ai/context/window", () => {
  it("estimateTokens() should return >=1 and roughly char/4", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("a")).toBe(1);
    expect(estimateTokens("hello")).toBeGreaterThanOrEqual(1);
  });

  it("modelBudget() should reserve headroom", () => {
    expect(modelBudget(1000, 0.1)).toBe(900);
    expect(modelBudget(1000, 0)).toBe(1000);
    expect(modelBudget(1000, 0.5)).toBe(500);
  });

  it("assembleContext() should include higher priority roles first within budget", () => {
    const input = {
      system: [chunk("system", "SYS")], // priority 100
      policy: [chunk("policy", "POL")], // 90
      current: [chunk("user", "USR"), chunk("assistant", "AST")], // 80,70
      overlays: [chunk("overlay", "OVR")], // 60
      tools: [chunk("tool", "TOOL")], // 50
      history: [chunk("assistant", "H1"), chunk("user", "H2")],
    };

    // Budget of 9 characters (tokens) with zero headroom, charEstimator
    // This allows including SYS (3) + POL (3) + USR (3)
    const out = assembleContext(input, {
      maxTokens: 9,
      headroomRatio: 0,
      tokenEstimator: charEstimator,
    });

    // Expect highest priority chunks to be included first: system, policy, user (current)
    const roles = out.map((c) => c.role);
    expect(roles).toContain("system");
    expect(roles).toContain("policy");
    expect(roles).toContain("user");

    // Ensure we do not exceed budget (9 chars)
    const used = out.reduce((sum, c) => sum + charEstimator(c.content), 0);
    expect(used).toBeLessThanOrEqual(9);
  });

  it("assembleContext() should always include essentials when possible within budget", () => {
    const essentialHistory = chunk("assistant", "E", { essential: true }); // 1 char
    const input = {
      system: [chunk("system", "SYS")], // 3 chars
      history: [essentialHistory],
    };

    // Budget 4 chars, zero headroom: should fit both SYS (3) and E (1)
    const out = assembleContext(input, {
      maxTokens: 4,
      headroomRatio: 0,
      tokenEstimator: charEstimator,
    });
    expect(out).toEqual(expect.arrayContaining([essentialHistory]));
    const used = out.reduce((sum, c) => sum + charEstimator(c.content), 0);
    expect(used).toBeLessThanOrEqual(4);
  });

  it("assembleContext() drops lower priority history first when tight", () => {
    const input = {
      system: [chunk("system", "SYS")], // 3
      policy: [chunk("policy", "POL")], // 3
      history: [chunk("assistant", "H1"), chunk("assistant", "H2")], // 2 + 2
    };

    // Budget 6 chars -> should include SYS + POL (6), drop history
    const out = assembleContext(input, {
      maxTokens: 6,
      headroomRatio: 0,
      tokenEstimator: charEstimator,
    });
    const roles = out.map((c) => c.role);
    expect(roles).toContain("system");
    expect(roles).toContain("policy");
    expect(roles).not.toContain("assistant");
  });
});
