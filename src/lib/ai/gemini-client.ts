// Local AI client (drop-in replacement for the old Gemini client)
// Usage: import { generateText, extractJsonObject, GEMINI_MODEL } from "@/lib/ai/gemini-client";

import { secureFetch } from "@/lib/ai/secure-fetch";

// Backwards-compat exports to avoid refactors
export const GEMINI_API_KEY = ""; // no external API
export const GEMINI_MODEL = process.env.PRIMARY_MODEL || "deepseek-v3";
export const GEMINI_API_BASE = "local://ai";

export type GenerationOptions = {
  model?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
  safetySettings?: unknown;
  // When set, callers expect JSON
  responseMimeType?: "text/plain" | "application/json";
};

function stripCodeFences(s: string): string {
  let t = s.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```\s*$/, "").trim();
  }
  return t;
}

export async function generateContent<T = string>(
  prompt: string,
  options: GenerationOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.model) headers["X-AI-Model"] = options.model;

  const res = await secureFetch("/api/chat/generate", {
    method: "POST",
    headers,
    body: { query: prompt },
    timeoutMs: 800,
    totalBudgetMs: 1200,
    breakerKey: "ai",
    dedupWindowMs: 10_000,
  });

  if (!res.ok) {
    throw new Error(`local_ai_${res.status}`);
  }
  const data = (await res.json()) as { result?: string };
  const out = String(data?.result ?? "");

  if (options.responseMimeType === "application/json") {
    try {
      const jsonText = stripCodeFences(out);
      return JSON.parse(jsonText) as T;
    } catch {
      const extracted = extractJsonObject<T>(out);
      if (extracted !== null) return extracted;
      throw new Error("invalid_json_from_local_ai");
    }
  }

  return out as unknown as T;
}

// Backwards-compatible helper for plain text generations
export async function generateText(
  prompt: string,
  options: Omit<GenerationOptions, "responseMimeType"> = {}
): Promise<string> {
  return generateContent<string>(prompt, {
    ...options,
    responseMimeType: "text/plain",
  });
}

export function extractJsonObject<T = unknown>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

