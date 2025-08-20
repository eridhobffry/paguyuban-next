import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyToken, isAdmin } from "@/lib/auth";
import type { User } from "@/lib/sql";
import {
  ensurePartnershipApplicationRecommendationsTable,
  getPartnershipApplicationById,
  createPartnershipApplicationRecommendation,
} from "@/lib/sql";
import { generateText } from "@/lib/ai/gemini-client";

function json(res: unknown, status = 200) {
  return NextResponse.json(res, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export const runtime = "nodejs";

const BodySchema = z.object({
  applicationId: z.string().uuid(),
  sentiment: z.string().optional().nullable(),
  // Optional personalization inputs (will not be stored directly)
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
  summary: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    // Auth: admin only
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return json({ error: "Unauthorized" }, 401);
    const decoded = verifyToken(token) as User;
    if (!decoded || !isAdmin(decoded))
      return json({ error: "Admin access required" }, 403);

    const body = BodySchema.safeParse(await request.json());
    if (!body.success) return json({ error: "Invalid payload" }, 400);
    const {
      applicationId,
      sentiment: bodySentiment,
      prospect,
      summary,
    } = body.data;

    await ensurePartnershipApplicationRecommendationsTable();

    const app = await getPartnershipApplicationById(applicationId);
    if (!app) return json({ error: "Application not found" }, 404);

    // Build prompt for Gemini

    const prompt = `You are a partner-success strategist for a tech event. Respond ONLY with strict JSON (no markdown) in this exact shape:
{
  "recommended_actions": [{"title": string, "description": string, "priority": "high"|"medium"|"low"}],
  "journey": [{"stage": string, "insight": string, "risk": string, "recommendation": string}],
  "next_best_action": string,
  "prospect_summary": string,
  "follow_ups": {
    "email_positive": string,
    "email_neutral": string,
    "email_negative": string,
    "whatsapp_positive": string,
    "whatsapp_neutral": string,
    "whatsapp_negative": string
  }
}
Use the PARTNERSHIP APPLICATION details to suggest concrete follow-ups for sponsorship conversion.
Keep messages concise and actionable.

SUMMARY: ${summary ?? "(none)"}
SENTIMENT: ${bodySentiment ?? "(unknown)"}
APPLICATION: ${JSON.stringify({
      name: app.name,
      email: app.email,
      company: app.company,
      phone: app.phone,
      interest: app.interest,
      budget: app.budget,
      message: app.message,
      source: app.source,
    })}
PERSONALIZATION (optional): ${JSON.stringify(prospect || {})}`;

    type Parsed = {
      recommended_actions?: Array<{
        title?: string;
        description?: string;
        priority?: string;
      }>;
      journey?: Array<{
        stage?: string;
        insight?: string;
        risk?: string;
        recommendation?: string;
      }>;
      next_best_action?: string;
      prospect_summary?: string;
      follow_ups?: {
        email_positive?: string;
        email_neutral?: string;
        email_negative?: string;
        whatsapp_positive?: string;
        whatsapp_neutral?: string;
        whatsapp_negative?: string;
      };
    };

    let parsed: Parsed = {};
    try {
      let text = await generateText(prompt, {
        temperature: 0.4,
        maxOutputTokens: 600,
      });
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) text = jsonMatch[0];
      parsed = JSON.parse(text);
    } catch {}

    // Fallback logic to ensure completeness without overwriting valid AI output
    const s = (bodySentiment ?? "neutral").toLowerCase();
    const p = prospect || {};
    const name = p.name || app.name || "there";

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
        email_positive: `Subject: Next steps for Paguyuban Messe partnership\n\nHi ${name},\n\nGreat reviewing your application about ${
          app.interest || "your goals"
        }. Based on what you shared${
          app.company ? ` at ${app.company}` : ""
        }, I suggest a quick 20‑minute call this week to walk through the ${
          app.budget ? `${app.budget} range ` : ""
        }options and ROI examples for your sector. I’ve attached our concise deck.\n\nWould Tue 10:00 or Wed 14:00 work?\n\nBest,\nPaguyuban Team`,
        email_neutral: `Subject: Info you can forward internally\n\nHi ${name},\n\nThanks for the application. I’m sharing a one‑pager and deck you can forward to your team outlining audience, tiers, and case studies. If helpful, I can tailor a short scenario for ${
          app.company || "your team"
        }.\n\nWould a brief call later this week make sense?\n\nBest,\nPaguyuban Team`,
        email_negative: `Subject: Quick clarification & options\n\nHi ${name},\n\nI understand the concerns around fit and ROI. If you share your main goal, I can outline a minimal package and 2–3 concrete outcomes we’ve delivered for similar partners. No pressure—just clarity.\n\nIf useful, I can send a tailored deck for ${
          app.company || "your team"
        }.\n\nBest,\nPaguyuban Team`,
        whatsapp_positive: app.phone
          ? `Hi ${name}, thanks for your partnership interest (${
              app.interest || "partnership"
            }). Can we lock a 20‑min call? Tue 10:00 or Wed 14:00? I’ll send a deck beforehand.`
          : "",
        whatsapp_neutral: app.phone
          ? `Hi ${name}, sharing a short one‑pager + deck you can forward. Want a quick call later this week to tailor examples for ${
              app.company || "your team"
            }?`
          : "",
        whatsapp_negative: app.phone
          ? `Hi ${name}, I hear your concern re ROI/fit. If helpful, I can outline a minimal option + expected outcomes for ${
              app.company || "your team"
            }.`
          : "",
      };
    }

    if (!parsed.next_best_action) {
      parsed.next_best_action =
        s === "negative"
          ? "Send a short note acknowledging concerns and propose a brief call to clarify ROI and fit."
          : "Propose a 20‑minute call this week and attach the sponsorship deck tailored to their industry.";
    }

    if (
      !parsed.recommended_actions ||
      parsed.recommended_actions.length === 0
    ) {
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

    // Store recommendation
    await createPartnershipApplicationRecommendation({
      applicationId,
      sentiment: bodySentiment ?? null,
      recommendedActions: parsed.recommended_actions ?? null,
      journey: parsed.journey ?? null,
      followUps: parsed.follow_ups ?? null,
      nextBestAction: parsed.next_best_action ?? null,
      prospectSummary: parsed.prospect_summary ?? null,
    });

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
      sentiment: bodySentiment ?? null,
    });
  } catch (error) {
    console.error("/api/admin/partnership/recommend error", error);
    return json({ error: "Internal server error" }, 500);
  }
}
