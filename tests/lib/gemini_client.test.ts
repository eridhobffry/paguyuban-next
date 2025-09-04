import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock secureFetch to avoid real network calls
const mockSecureFetch = vi.fn();
vi.mock("@/lib/ai/secure-fetch", () => ({
  secureFetch: (...args: any[]) => mockSecureFetch(...args),
}));

import {
  generateText,
  generateContent,
} from "@/lib/ai/gemini-client";

describe("local ai client (gemini-client adapter)", () => {
  beforeEach(() => {
    mockSecureFetch.mockReset();
  });

  it("generateText returns plain string from local AI", async () => {
    mockSecureFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: "Hello World" }),
    });

    const out = await generateText("Say hello");
    expect(out).toBe("Hello World");

    expect(mockSecureFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockSecureFetch.mock.calls[0] as [string, any];
    expect(url).toBe("/api/chat/generate");
    expect(init?.method).toBe("POST");
    // Body gets stringified in secureFetch; here we only check shape passed in
    expect(init?.body).toEqual({ query: "Say hello" });
  });

  it("generateContent parses JSON mode response", async () => {
    mockSecureFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: '{"a": 1, "b": "x"}' }),
    });

    const out = await generateContent<{ a: number; b: string }>("json please", {
      responseMimeType: "application/json",
    });
    expect(out).toEqual({ a: 1, b: "x" });
  });

  it("generateContent strips code fences before JSON parse", async () => {
    mockSecureFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: "```json\n{\"k\":42}\n```" }),
    });

    const out = await generateContent<{ k: number }>("fenced json", {
      responseMimeType: "application/json",
    });
    expect(out).toEqual({ k: 42 });
  });

  it("generateContent falls back to first JSON object within text", async () => {
    mockSecureFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: "prefix {\"x\": 7} suffix" }),
    });

    const out = await generateContent<{ x: number }>("embedded json", {
      responseMimeType: "application/json",
    });
    expect(out).toEqual({ x: 7 });
  });

  it("generateContent throws on invalid JSON when JSON mode required", async () => {
    mockSecureFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: "not json at all" }),
    });

    await expect(
      generateContent("bad json", { responseMimeType: "application/json" })
    ).rejects.toThrow(/invalid_json_from_local_ai/);
  });

  it("sets X-AI-Model header when model is provided", async () => {
    mockSecureFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: "ok" }),
    });

    await generateText("test", { model: "qwen2.5:7b" });
    const [, init] = mockSecureFetch.mock.calls[0] as [string, any];
    expect(init?.headers?.["X-AI-Model"]).toBe("qwen2.5:7b");
  });
});

