// Enhanced Gemini client for admin features requiring complex analysis
// Usage: import { generateAdminContent } from "@/lib/ai/gemini-admin";

import { generateContent } from "./gemini-client";

// Use the more powerful Pro model for admin analytics and recommendations
const ADMIN_GEMINI_MODEL = process.env.ADMIN_GEMINI_MODEL || "gemini-2.5-pro";

export async function generateAdminContent<T = string>(
  prompt: string,
  options: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
    responseMimeType?: "text/plain" | "application/json";
  } = {}
): Promise<T> {
  // Override the model for admin features to use Pro
  const adminOptions = {
    model: ADMIN_GEMINI_MODEL,
    temperature: 0.4, // Lower temperature for more analytical, consistent outputs
    topK: 40,
    topP: 0.9, // Slightly more focused than chat
    maxOutputTokens: 1000, // More room for complex analysis
    ...options,
  };

  return generateContent<T>(prompt, adminOptions);
}

// Helper for structured admin outputs
export async function generateAdminAnalysis<T = unknown>(
  prompt: string,
  options: Omit<
    Parameters<typeof generateAdminContent>[1],
    "responseMimeType"
  > = {}
): Promise<T> {
  return generateAdminContent<T>(prompt, {
    ...options,
    responseMimeType: "application/json",
  });
}
