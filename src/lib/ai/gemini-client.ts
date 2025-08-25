// Centralized Gemini client for the entire app
// Usage: import { generateText, extractJsonObject, GEMINI_MODEL } from "@/lib/ai/gemini-client";

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
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
type GeminiCandidatePart = { text?: string };
type GeminiCandidateContent = { parts?: GeminiCandidatePart[] };
type GeminiCandidate = { content?: GeminiCandidateContent; finishReason?: string; index?: number };
type GeminiResponse = { candidates?: GeminiCandidate[] };
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

  // Exponential backoff retry for 429 / 5xx
  const maxRetries = 3;
  const baseDelayMs = 500;
  let data: GeminiResponse | null = null;
  let lastStatus = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(`${endpoint}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    lastStatus = res.status;
    if (!res.ok) {
      // Read error details
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

      const err = new Error(
        `Gemini API error ${res.status}${detail ? ": " + detail : ""}`
      );

      // Retry on 429 or 5xx
      if (res.status === 429 || res.status >= 500) {
        if (attempt < maxRetries) {
          const jitter = Math.floor(Math.random() * 200);
          const delay = baseDelayMs * Math.pow(2, attempt) + jitter;
          console.warn(
            `Gemini API ${res.status} — retrying in ${delay}ms (attempt ${
              attempt + 1
            }/${maxRetries})`
          );
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }

      // Non-retryable or out of retries
      console.error("Gemini API Error:", detail);
      throw err;
    }

    // Success: parse JSON and break
    data = (await res.json()) as GeminiResponse;
    break;
  }

  // Debug logging for API response structure
  console.log("Gemini API Response:", {
    status: lastStatus || 200,
    hasCandidates: !!data?.candidates,
    candidatesCount: data?.candidates?.length || 0,
    hasContent: !!data?.candidates?.[0]?.content,
    hasParts: !!data?.candidates?.[0]?.content?.parts,
    partsCount: data?.candidates?.[0]?.content?.parts?.length || 0,
  });

  // Log full response for debugging
  console.log("Full Gemini API Response:", JSON.stringify(data, null, 2));

  // Join all text parts to avoid truncation (JSON may be split across parts)
  const parts = (data?.candidates?.[0]?.content?.parts || []) as GeminiCandidatePart[];
  const joinedText: string = parts
    .map((p) => (typeof p?.text === "string" ? p.text : ""))
    .join("");

  if (options.responseMimeType === "application/json") {
    try {
      // Strip common Markdown code fences if present
      let jsonText = joinedText.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText
          .replace(/^```[a-zA-Z]*\n?/, "")
          .replace(/\n?```\s*$/, "")
          .trim();
      }
      return JSON.parse(jsonText) as T;
    } catch {
      // Fallback: try extracting the first JSON object from the text
      const extracted = extractJsonObject<T>(joinedText);
      if (extracted !== null) return extracted;
      console.error("Failed to parse JSON from Gemini:", joinedText);
      throw new Error("Invalid JSON response from Gemini model");
    }
  }

  return joinedText as unknown as T;
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
