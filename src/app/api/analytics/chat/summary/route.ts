import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/drizzle";
import { chatbotSummaries } from "@/lib/db/schema";
import { stackServerApp } from "@/stack";

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

async function generateSummary(
  transcript: Array<{ role: string; content: string }>
): Promise<{ summary: string; topics: string[]; sentiment: string }> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";
  const prompt = `You are an analytics assistant. Respond ONLY with strict JSON (no markdown) in this shape: {"summary": string (3-5 sentences), "topics": string[] (3-6 concise topics), "sentiment": "positive"|"neutral"|"negative"}.\n\nTranscript:\n${transcript
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n")}`;

  try {
    const res = await fetch(`${endpoint}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 300 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini error ${res.status}`);
    const data = await res.json();
    let text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];
    const parsed = JSON.parse(text) as {
      summary?: string;
      topics?: string[];
      sentiment?: string;
    };
    return {
      summary: parsed.summary || text || "",
      topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 8) : [],
      sentiment: parsed.sentiment || "neutral",
    };
  } catch {
    // Heuristic fallback
    const content = transcript.map((m) => m.content).join(" ");
    const words = (
      content.toLowerCase().match(/[a-z][a-z\-]{2,}/g) ?? []
    ).filter(
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
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const json = await request.json();
    const body = BodySchema.parse(json);

    let userId: string | undefined = undefined;
    try {
      const user = await stackServerApp.getUser();
      userId = user?.id ?? undefined;
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
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400, headers: corsHeaders() }
    );
  }
}
