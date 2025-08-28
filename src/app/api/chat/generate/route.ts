import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { secureFetch } from "@/lib/ai/secure-fetch";
import { db } from "@/lib/db/drizzle";
import { queryPerformance } from "@/lib/db/schemas/queries";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";

const BodySchema = z.object({
  message: z.string().min(1),
  assistantType: z.enum(["ucup", "rima"]).default("ucup"),
  mode: z.enum(["auto", "local"]).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: any;

  try {
    const json = await req.json();
    body = BodySchema.parse(json);
  } catch (validationError) {
    console.error("Validation error:", validationError);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Simple per-IP rate limit: 10 requests/minute
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const allowed = rateLimitAllow(`chat:${ip}`, 10, 60_000);
  if (!allowed.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(allowed.retryAfterMs / 1000)),
        },
      }
    );
  }

  try {
    // First, try the EventChatAgent for event-specific questions
    try {
      const eventResponse = await secureFetch(
        `${AI_SERVICE_URL.replace(/\/$/, "")}/api/event/chat`,
        {
          method: "POST",
          body: JSON.stringify({ query: body.message }),
          totalBudgetMs: 1200,
          timeoutMs: 800,
          breakerKey: "ai",
          dedupWindowMs: 10_000,
        }
      );

      if (eventResponse.ok) {
        const eventData = await eventResponse.json();
        return NextResponse.json({
          reply: eventData.result,
          agent: "event_chat",
          fallback: false,
        });
      }
    } catch (eventError) {
      // EventChatAgent failed, continue to general chat
      console.log("EventChatAgent failed, trying general chat:", eventError);
    }

    // Fallback to general conversational agent
    const response = await secureFetch(
      `${AI_SERVICE_URL.replace(/\/$/, "")}/api/chat/generate`,
      {
        method: "POST",
        body: JSON.stringify({
          query: body.message,
          context: {
            assistant_type: body.assistantType,
            mode: body.mode || "auto",
          },
        }),
        totalBudgetMs: 1200,
        timeoutMs: 800,
        breakerKey: "ai",
        dedupWindowMs: 10_000,
      }
    );

    if (!response.ok) {
      throw new Error(`AI service responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({
      reply: data.result,
      agent: "conversational",
      fallback: false,
    });
  } catch (error) {
    console.error("/api/chat/generate error", error);
    // DLQ logging best-effort
    try {
      await db.insert(queryPerformance).values({
        queryType: "chat",
        responseTime: 0,
        success: false,
        errorMessage: String(error instanceof Error ? error.message : error),
      });
    } catch {}

    // Graceful fallback to static FAQs
    try {
      const faq = await buildFaqFallback(req);
      if (faq) {
        return NextResponse.json({ reply: faq, agent: "faq", fallback: true });
      }
    } catch {}

    // Fallback to local knowledge if AI service is unavailable
    try {
      const { paguyubanChat } = await import("@/lib/gemini");
      const reply = await paguyubanChat.chat(body.message, body.assistantType, {
        mode: "local",
      });
      return NextResponse.json({
        reply,
        agent: "gemini_local",
        fallback: true,
      });
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      return NextResponse.json({ error: "chat_failed" }, { status: 500 });
    }
  }
}

// Lightweight in-memory rate limiter (best-effort, single-instance)
const buckets = new Map<string, number[]>();
function rateLimitAllow(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const arr = buckets.get(key) || [];
  // drop old
  while (arr.length && now - arr[0] > windowMs) arr.shift();
  if (arr.length >= max) {
    const retryAfterMs = windowMs - (now - arr[0]!);
    return { ok: false as const, retryAfterMs };
  }
  arr.push(now);
  buckets.set(key, arr);
  return { ok: true as const };
}

async function buildFaqFallback(req: NextRequest): Promise<string | null> {
  try {
    const base = req.nextUrl.origin;
    const res = await fetch(`${base}/api/admin/knowledge/static`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const k = data?.knowledge?.event;
    if (!k) return null;
    const lines = [
      `Here’s key info about Paguyuban Messe:`,
      `• Name: ${k.name}`,
      `• Dates: ${k.dates}`,
      `• Location: ${k.location}`,
      `• Venue: ${k.venue?.mainHall}`,
      `For sponsorship packages, see Sponsors in Admin or contact nusantaraexpoofficial@gmail.com.`,
    ];
    return lines.join("\n");
  } catch {
    return null;
  }
}
