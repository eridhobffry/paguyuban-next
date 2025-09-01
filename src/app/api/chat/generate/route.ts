import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { secureFetch } from "@/lib/ai/secure-fetch";
import { db } from "@/lib/db/drizzle";
import { queryPerformance } from "@/lib/db/schemas/queries";
import {
  sanitizeInput,
  redactPII,
  sanitizeOutput,
} from "@/lib/security/sanitize";
import { hasUserConsent, requiredConsentVersion } from "@/lib/security/consent";
import { detectLanguage } from "@/lib/ai/lang";
import { selectModel } from "@/lib/ai/model-router";
import { getCachedResponse, setCachedResponse } from "@/lib/ai/semantic-cache";
import { SITE } from "@/config/site";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";

const BodySchema = z.object({
  message: z.string().min(1),
  assistantType: z.enum(["ucup", "rima"]).default("ucup"),
  mode: z.enum(["auto", "local"]).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: any;
  const startedAt = Date.now();

  try {
    // Require consent header
    if (!hasUserConsent(req.headers)) {
      return NextResponse.json(
        {
          error: "consent_required",
          requiredVersion: requiredConsentVersion(),
          message:
            "User consent is required before using AI features. Please present the consent modal and set the x-ai-consent header.",
        },
        { status: 403 }
      );
    }

    const json = await req.json();
    const parsed = BodySchema.parse(json);
    // Sanitize user input early
    parsed.message = sanitizeInput(parsed.message);
    body = parsed;
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
    // Lightweight language detection and model routing
    const language = detectLanguage(String(body.message || ""));
    const routing = selectModel({ query: body.message, language, task: "chat" });

    // Semantic cache check
    try {
      const hit = getCachedResponse(body.message, {
        locale: language,
        city: SITE.event?.location,
        eventStart: SITE.event?.startDate,
        eventEnd: SITE.event?.endDate,
      });
      if (hit) {
        const reply = sanitizeOutput(hit.response);
        const res = NextResponse.json(
          { reply, agent: "cache", fallback: false },
          { status: 200 }
        );
        res.headers.set("X-Cache", "HIT");
        res.headers.set("X-Cache-Score", hit.score.toFixed(3));
        res.headers.set("X-AI-Model", routing.model);
        res.headers.set("X-Route-Reason", routing.reason);
        return res;
      }
    } catch {}

    // First, try the EventChatAgent for event-specific questions
    try {
      const eventResponse = await secureFetch(
        `${AI_SERVICE_URL.replace(/\/$/, "")}/api/event/chat`,
        {
          method: "POST",
          headers: { "X-AI-Model": routing.model },
          body: JSON.stringify({ query: redactPII(body.message) }),
          totalBudgetMs: 1200,
          timeoutMs: 800,
          breakerKey: "ai",
          dedupWindowMs: 10_000,
        }
      );

      if (eventResponse.ok) {
        const eventData = await eventResponse.json();
        const reply = sanitizeOutput(String(eventData.result ?? ""));
        // Cache success
        try {
          setCachedResponse(
            body.message,
            {
              locale: language,
              city: SITE.event?.location,
              eventStart: SITE.event?.startDate,
              eventEnd: SITE.event?.endDate,
            },
            reply,
            routing.model,
            { costMs: Date.now() - startedAt }
          );
        } catch {}

        const res = NextResponse.json(
          { reply, agent: "event_chat", fallback: false },
          { status: 200 }
        );
        res.headers.set("X-Cache", "MISS");
        res.headers.set("X-AI-Model", routing.model);
        res.headers.set("X-Route-Reason", routing.reason);
        return res;
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
          query: redactPII(body.message),
          context: {
            assistant_type: body.assistantType,
            mode: body.mode || "auto",
          },
        }),
        headers: { "X-AI-Model": routing.model },
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
    const reply = sanitizeOutput(String(data.result ?? ""));
    // Cache success
    try {
      setCachedResponse(
        body.message,
        {
          locale: language,
          city: SITE.event?.location,
          eventStart: SITE.event?.startDate,
          eventEnd: SITE.event?.endDate,
        },
        reply,
        routing.model,
        { costMs: Date.now() - startedAt }
      );
    } catch {}

    const res = NextResponse.json(
      { reply, agent: "conversational", fallback: false },
      { status: 200 }
    );
    res.headers.set("X-Cache", "MISS");
    res.headers.set("X-AI-Model", routing.model);
    res.headers.set("X-Route-Reason", routing.reason);
    return res;
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
