// Centralized Gemini client for the entire app
// Usage: import { generateText, extractJsonObject, GEMINI_MODEL } from "@/lib/ai/gemini-client";

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-exp";
export const GEMINI_API_BASE =
  process.env.GEMINI_API_BASE ||
  "https://generativelanguage.googleapis.com/v1beta/models";

export function getGeminiEndpoint(model?: string): string {
  const m = model || GEMINI_MODEL;
  return `${GEMINI_API_BASE}/${m}:generateContent`;
}

export type GenerationOptions = {
  model?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
  safetySettings?: unknown;
  // When set, requests the model to respond in the specified MIME type
  // e.g., 'application/json' for JSON mode, or 'text/plain' for text
  responseMimeType?: "text/plain" | "application/json";
};

type Part = { text: string };
type Content = { parts: Part[] };
type GenerationConfig = {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
  // JSON/text mode hint for the model
  response_mime_type?: "text/plain" | "application/json";
};
type GenerationRequestBody = {
  contents: Content[];
  generationConfig?: GenerationConfig;
  safetySettings?: unknown;
};

export async function generateContent<T = string>(
  prompt: string,
  options: GenerationOptions = {}
): Promise<T> {
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set. Calls to Gemini will fail.");
  }

  const endpoint = getGeminiEndpoint(options.model);
  const cfg: GenerationConfig = {};
  if (options.temperature !== undefined) cfg.temperature = options.temperature;
  if (options.topK !== undefined) cfg.topK = options.topK;
  if (options.topP !== undefined) cfg.topP = options.topP;
  if (options.maxOutputTokens !== undefined)
    cfg.maxOutputTokens = options.maxOutputTokens;
  if (options.stopSequences) cfg.stopSequences = options.stopSequences;
  if (options.responseMimeType)
    cfg.response_mime_type = options.responseMimeType;

  const body: GenerationRequestBody = {
    contents: [{ parts: [{ text: prompt }] }],
  };
  if (Object.keys(cfg).length > 0) body.generationConfig = cfg;
  if (options.safetySettings) body.safetySettings = options.safetySettings;

  const res = await fetch(`${endpoint}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Attempt to include detailed error from API if present
    let detail = "";
    try {
      const errJson = await res.json();
      detail = errJson?.error?.message || JSON.stringify(errJson);
    } catch {
      try {
        detail = await res.text();
      } catch {
        detail = "";
      }
    }
    console.error("Gemini API Error:", detail);
    throw new Error(`Gemini API error ${res.status}${detail ? ": " + detail : ""}`);
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (options.responseMimeType === "application/json") {
    try {
      return JSON.parse(text) as T;
    } catch {
      console.error("Failed to parse JSON from Gemini:", text);
      throw new Error("Invalid JSON response from Gemini model");
    }
  }

  return text as unknown as T;
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
