import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { db } from "@/lib/db/drizzle";
import { chatbotSummaries } from "@/lib/db/schema";
import { stackServerApp } from "@/stack";
import { generateContent } from "@/lib/ai/gemini-client";
import { AiSummarySchema, type SummaryData } from "@/lib/ai/schemas";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  };
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

const TranscriptItemSchema = z.object({
  role: z.enum(["user", "assistant"]).transform((r) => String(r)),
  content: z.string().min(1),
});

const BodySchema = z.object({
  sessionId: z.string().uuid(),
  transcript: z.array(TranscriptItemSchema).min(1).max(50),
});

// AiSummarySchema and SummaryData are now imported from shared module

function buildAiPrompt(
  transcript: Array<{ role: string; content: string }>
): string {
  return `You are an analytics assistant. Return a JSON object with: {"summary": string (3-5 sentences), "topics": string[] (3-6 concise topics), "sentiment": "positive"|"neutral"|"negative"}.\n\nTranscript:\n${transcript
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n")}`;
}

async function generateSummaryWithAI(
  transcript: Array<{ role: string; content: string }>
): Promise<SummaryData> {
  const prompt = buildAiPrompt(transcript);
  const aiJson = await generateContent<unknown>(prompt, {
    temperature: 0.4,
    maxOutputTokens: 300,
    responseMimeType: "application/json",
  });
  const parsed = AiSummarySchema.safeParse(aiJson);
  if (!parsed.success) {
    console.error("Gemini response validation failed:", parsed.error);
    throw new Error("gemini_validation_failed");
  }
  return parsed.data;
}

function createHeuristicSummary(
  transcript: Array<{ role: string; content: string }>
): SummaryData {
  const content = transcript.map((m) => m.content).join(" ");
  const words = (content.toLowerCase().match(/[a-z][a-z\-]{2,}/g) ?? []).filter(
    (w) =>
      ![
        "the",
        "and",
        "you",
        "for",
        "with",
        "that",
        "this",
        "atau",
        "dan",
        "yang",
        "untuk",
        "dengan",
      ].includes(w)
  );
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  const topics = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w);
  const sentences = content
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .slice(0, 5);
  const summary = sentences.join(" ").slice(0, 600);
  const lc = content.toLowerCase();
  const sentiment = /terima kasih|thanks|great|awesome|bagus|baik/.test(lc)
    ? "positive"
    : /disappoint|bad|buruk|kecewa|maaf/.test(lc)
    ? "negative"
    : "neutral";
  return { summary, topics, sentiment };
}

async function generateSummary(
  transcript: Array<{ role: string; content: string }>
): Promise<SummaryData> {
  try {
    return await generateSummaryWithAI(transcript);
  } catch (e) {
    console.warn("AI summary generation failed. Falling back to heuristic.", e);
    return createHeuristicSummary(transcript);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const json = await request.json();
    const body = BodySchema.parse(json);

    // Preserve existing optional auth behavior
    try {
      await stackServerApp.getUser();
    } catch {}

    const { summary, topics, sentiment } = await generateSummary(
      body.transcript
    );

    const [inserted] = await db
      .insert(chatbotSummaries)
      .values({
        sessionId: body.sessionId,
        summary,
        topics,
        sentiment,
      })
      .returning({ id: chatbotSummaries.id });

    return NextResponse.json(
      { id: inserted.id },
      { status: 201, headers: corsHeaders() }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400, headers: corsHeaders() }
      );
    }
    console.error("Error in chat summary endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
