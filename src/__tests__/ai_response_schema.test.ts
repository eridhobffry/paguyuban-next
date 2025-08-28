import { describe, it, expect } from "vitest";
import { parseAiTextResponse } from "@/lib/ai/response-schema";

describe("parseAiTextResponse", () => {
  it("extracts result", () => {
    expect(parseAiTextResponse({ result: "hello" })).toBe("hello");
  });
  it("extracts response", () => {
    expect(parseAiTextResponse({ response: "world" })).toBe("world");
  });
  it("returns null on invalid", () => {
    expect(parseAiTextResponse({ foo: 1 })).toBeNull();
  });
});

