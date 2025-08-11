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
  const prompt = `You are an analytics assistant. Summarize the following chat transcript in 3-5 sentences, list the top 3-6 topics as single words/short phrases, and classify overall sentiment as one of: positive, neutral, negative. Return strict JSON with keys summary (string), topics (string[]), sentiment (string).\n\nTranscript:\n${transcript
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
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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
    // Fallback: naive topics from keywords
    const content = transcript.map((m) => m.content).join(" \n ");
    const topics = Array.from(
      new Set(
        content
          .toLowerCase()
          .match(/[a-zA-Z][a-zA-Z\-]{2,}/g)
          ?.slice(0, 6) ?? []
      )
    ).slice(0, 6);
    const sentiment = /thanks|great|awesome|terima kasih|bagus|baik/.test(
      content.toLowerCase()
    )
      ? "positive"
      : /disappoint|bad|buruk|kecewa/.test(content.toLowerCase())
      ? "negative"
      : "neutral";
    const summary = content.slice(0, 800);
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
