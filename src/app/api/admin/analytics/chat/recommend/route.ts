import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyToken, isAdmin } from "@/lib/auth";
import type { User } from "@/lib/sql";
import { db } from "@/lib/db/drizzle";
import { sql as dsql } from "drizzle-orm";
import { generateContent } from "@/lib/ai/gemini-client";

function json(res: unknown, status = 200) {
  return NextResponse.json(res, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

const BodySchema = z.object({
  sessionId: z.string().uuid().optional(),
  summary: z.string().min(1).optional(),
  sentiment: z.string().optional().nullable(),
  prospect: z
    .object({
      name: z.string().optional().nullable(),
      email: z.string().email().optional().nullable(),
      phone: z.string().optional().nullable(),
      company: z.string().optional().nullable(),
      interest: z.string().optional().nullable(),
      budget: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

type ChatRow = { role: string; message: string };

// Zod schema for AI JSON output with camel/snake tolerance
const AiResponseSchema = z
  .object({
    recommended_actions: z
      .array(
        z.object({
          title: z.string(),
          description: z.string(),
          priority: z.enum(["high", "medium", "low"]).optional(),
        })
      )
      .optional(),
    recommendedActions: z
      .array(
        z.object({
          title: z.string(),
          description: z.string(),
          priority: z.enum(["high", "medium", "low"]).optional(),
        })
      )
      .optional(),
    journey: z
      .array(
        z.object({
          stage: z.string(),
          insight: z.string(),
          risk: z.string(),
          recommendation: z.string(),
        })
      )
      .optional(),
    next_best_action: z.string().optional(),
    nextBestAction: z.string().optional(),
    prospect_summary: z.string().optional(),
    prospectSummary: z.string().optional(),
    sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
    follow_ups: z
      .object({
        email_positive: z.string().optional(),
        email_neutral: z.string().optional(),
        email_negative: z.string().optional(),
        whatsapp_positive: z.string().optional(),
        whatsapp_neutral: z.string().optional(),
        whatsapp_negative: z.string().optional(),
        emailPositive: z.string().optional(),
        emailNeutral: z.string().optional(),
        emailNegative: z.string().optional(),
        whatsappPositive: z.string().optional(),
        whatsappNeutral: z.string().optional(),
        whatsappNegative: z.string().optional(),
      })
      .optional(),
    followUps: z
      .object({
        email_positive: z.string().optional(),
        email_neutral: z.string().optional(),
        email_negative: z.string().optional(),
        whatsapp_positive: z.string().optional(),
        whatsapp_neutral: z.string().optional(),
        whatsapp_negative: z.string().optional(),
        emailPositive: z.string().optional(),
        emailNeutral: z.string().optional(),
        emailNegative: z.string().optional(),
        whatsappPositive: z.string().optional(),
        whatsappNeutral: z.string().optional(),
        whatsappNegative: z.string().optional(),
      })
      .optional(),
  })
  .transform((data) => {
    const follow = (data.follow_ups || data.followUps) as
      | Record<string, string>
      | undefined;
    const normalizedFollow = follow
      ? {
          email_positive: follow.email_positive || follow.emailPositive || "",
          email_neutral: follow.email_neutral || follow.emailNeutral || "",
          email_negative: follow.email_negative || follow.emailNegative || "",
          whatsapp_positive:
            follow.whatsapp_positive || follow.whatsappPositive || "",
          whatsapp_neutral:
            follow.whatsapp_neutral || follow.whatsappNeutral || "",
          whatsapp_negative:
            follow.whatsapp_negative || follow.whatsappNegative || "",
        }
      : undefined;
    return {
      recommended_actions:
        data.recommended_actions || data.recommendedActions || [],
      journey: data.journey || [],
      next_best_action: data.next_best_action || data.nextBestAction || "",
      prospect_summary: data.prospect_summary || data.prospectSummary || "",
      sentiment: data.sentiment,
      follow_ups: normalizedFollow,
    } as {
      recommended_actions: Array<{
        title: string;
        description: string;
        priority?: "high" | "medium" | "low";
      }>;
      journey: Array<{
        stage: string;
        insight: string;
        risk: string;
        recommendation: string;
      }>;
      next_best_action: string;
      prospect_summary: string;
      sentiment?: "positive" | "neutral" | "negative";
      follow_ups?: {
        email_positive?: string;
        email_neutral?: string;
        email_negative?: string;
        whatsapp_positive?: string;
        whatsapp_neutral?: string;
        whatsapp_negative?: string;
      };
    };
  });

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return json({ error: "Unauthorized" }, 401);
    const decoded = verifyToken(token) as User;
    if (!decoded || !isAdmin(decoded))
      return json({ error: "Admin access required" }, 403);

    const body = BodySchema.parse(await request.json());

    let transcript: ChatRow[] = [];
    if (body.sessionId) {
      const rows = (await db.execute(dsql`
        select role, message
        from chatbot_logs
        where session_id = ${body.sessionId}
        order by created_at asc
        limit 50
      `)) as unknown as { rows: ChatRow[] };
      transcript = rows.rows || [];
    }

    // Build prompt (JSON mode removes need for strict JSON admonitions)
    const prompt = `You are a senior CX strategist. Analyze the following chat data and respond with a JSON object that adheres to the provided schema.
Focus on concrete next steps for sponsorship conversion.

SCHEMA:
{
  "recommended_actions": [{"title": string, "description": string, "priority": "high"|"medium"|"low"}],
  "journey": [{"stage": string, "insight": string, "risk": string, "recommendation": string}],
  "next_best_action": string,
  "prospect_summary": string,
  "sentiment": "positive"|"neutral"|"negative",
  "follow_ups": { "email_positive": string, "email_neutral": string, "email_negative": string, "whatsapp_positive": string, "whatsapp_neutral": string, "whatsapp_negative": string }
}

DATA:
SUMMARY: ${body.summary ?? "(none)"}
SENTIMENT: ${body.sentiment ?? "(unknown)"}
PROSPECT (if any): ${JSON.stringify(body.prospect || {})}
TRANSCRIPT:\n${transcript
      .map((t) => `${t.role}: ${t.message}`)
      .join("\n")
      .slice(0, 4000)}\n`;

    let aiJson: unknown;
    try {
      aiJson = await generateContent<object>(prompt, {
        temperature: 0.4,
        maxOutputTokens: 800,
        responseMimeType: "application/json",
      });
    } catch {
      return json({ error: "gemini_502" }, 502);
    }

    const validated = AiResponseSchema.safeParse(aiJson);
    if (!validated.success) {
      console.error("AI response failed validation", validated.error);
      return json({ error: "gemini_validation_failed" }, 502);
    }
    const parsed = validated.data;

    // Normalize sentiment from model or body
    const modelSent = (parsed.sentiment || "").toLowerCase();
    const bodySent = (body.sentiment || "").toLowerCase();
    function normalizeSent(
      s: string
    ): "positive" | "neutral" | "negative" | undefined {
      if (!s) return undefined;
      if (s.startsWith("pos")) return "positive";
      if (s.startsWith("neg")) return "negative";
      if (s.startsWith("neu")) return "neutral";
      if (s === "positive" || s === "negative" || s === "neutral")
        return s as "positive" | "neutral" | "negative";
      return undefined;
    }
    const sentiment =
      normalizeSent(modelSent) ?? normalizeSent(bodySent) ?? "neutral";

    // Build sensible defaults only when missing pieces, without overwriting
    const p = body.prospect || {};
    const name = p.name || "there";

    // Ensure follow-ups exist (primary output we care about for follow-up workflows)
    const f = parsed.follow_ups || {};
    const hasAnyFollowUps =
      Boolean(f.email_positive) ||
      Boolean(f.email_neutral) ||
      Boolean(f.email_negative) ||
      Boolean(f.whatsapp_positive) ||
      Boolean(f.whatsapp_neutral) ||
      Boolean(f.whatsapp_negative);
    if (!hasAnyFollowUps) {
      parsed.follow_ups = {
        email_positive: `Subject: Next steps for Paguyuban Messe partnership\n\nHi ${name},\n\nGreat chatting about ${
          p.interest || "your goals"
        }. Based on what you shared${
          p.company ? ` at ${p.company}` : ""
        }, I suggest a quick 20‑minute call this week to walk through the ${
          p.budget ? `${p.budget} range ` : ""
        }options and ROI examples for your sector. I’ve attached our concise deck.\n\nWould Tue 10:00 or Wed 14:00 work?\n\nBest,\nPaguyuban Team`,
        email_neutral: `Subject: Info you can forward internally\n\nHi ${name},\n\nThanks for the interest in Paguyuban Messe. I’m sharing a one‑pager and deck you can forward to your team outlining audience, tiers, and case studies. If helpful, I can tailor a short scenario for ${
          p.company || "your team"
        }.\n\nWould a brief call later this week make sense?\n\nBest,\nPaguyuban Team`,
        email_negative: `Subject: Quick clarification & options\n\nHi ${name},\n\nI understand the concerns around fit and ROI. If you share your main goal, I can outline a minimal package and 2–3 concrete outcomes we’ve delivered for similar partners. No pressure—just clarity.\n\nIf useful, I can send a tailored deck for ${
          p.company || "your team"
        }.\n\nBest,\nPaguyuban Team`,
        whatsapp_positive: p.phone
          ? `Hi ${name}, thanks for discussing ${
              p.interest || "partnership"
            }. Can we lock a 20‑min call? Tue 10:00 or Wed 14:00? I’ll send a deck beforehand.`
          : "",
        whatsapp_neutral: p.phone
          ? `Hi ${name}, sharing a short one‑pager + deck you can forward. Want a quick call later this week to tailor examples for ${
              p.company || "your team"
            }?`
          : "",
        whatsapp_negative: p.phone
          ? `Hi ${name}, I hear your concern re ROI/fit. If helpful, I can outline a minimal option + expected outcomes for ${
              p.company || "your team"
            }.`
          : "",
      };
    }

    // Ensure next best action exists
    if (!parsed.next_best_action) {
      parsed.next_best_action =
        sentiment === "negative"
          ? "Send a short note acknowledging concerns and propose a brief call to clarify ROI and fit."
          : "Propose a 20‑minute call this week and attach the sponsorship deck tailored to their industry.";
    }

    // Provide minimal actions if absent
    if (!parsed.recommended_actions || parsed.recommended_actions.length === 0) {
      parsed.recommended_actions = [
        {
          title: "Schedule sponsorship call",
          description:
            "Offer a 15–20 min call to discuss tiers and ROI; tailor examples to their industry.",
          priority: "high",
        },
        {
          title: "Send sponsorship deck",
          description:
            "Share a concise PDF with tiers, benefits, audience, and case studies; include contact and next steps.",
          priority: "medium",
        },
      ];
    }

    const camelFollowUps = parsed.follow_ups
      ? {
          emailPositive: parsed.follow_ups.email_positive || "",
          emailNeutral: parsed.follow_ups.email_neutral || "",
          emailNegative: parsed.follow_ups.email_negative || "",
          whatsappPositive: parsed.follow_ups.whatsapp_positive || "",
          whatsappNeutral: parsed.follow_ups.whatsapp_neutral || "",
          whatsappNegative: parsed.follow_ups.whatsapp_negative || "",
        }
      : undefined;

    return json({
      recommendedActions: parsed.recommended_actions || [],
      journey: parsed.journey || [],
      nextBestAction: parsed.next_best_action || "",
      prospectSummary: parsed.prospect_summary || "",
      followUps: camelFollowUps,
      sentiment,
    });
  } catch (error) {
    console.error("/api/admin/analytics/chat/recommend error", error);
    return json({ error: "Internal server error" }, 500);
  }
}
