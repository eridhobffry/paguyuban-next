import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyToken, isAdmin } from "@/lib/auth";
import type { User } from "@/lib/sql";
import { db } from "@/lib/db/drizzle";
import { sql as dsql } from "drizzle-orm";

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

    const geminiKey = process.env.GEMINI_API_KEY || "";
    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

    const prompt = `You are a senior CX strategist. Respond ONLY with strict JSON (no markdown, no commentary) in this exact shape:
{
  "recommended_actions": [{"title": string, "description": string, "priority": "high"|"medium"|"low"}],
  "journey": [{"stage": string, "insight": string, "risk": string, "recommendation": string}],
  "next_best_action": string,
  "prospect_summary": string,
  "sentiment": "positive"|"neutral"|"negative",
  "follow_ups": {
    "email_positive": string,
    "email_neutral": string,
    "email_negative": string,
    "whatsapp_positive": string,
    "whatsapp_neutral": string,
    "whatsapp_negative": string
  }
}
Use the chat SUMMARY and TRANSCRIPT below. Focus on concrete next steps for sponsorship conversion.

SUMMARY: ${body.summary ?? "(none)"}
SENTIMENT: ${body.sentiment ?? "(unknown)"}
PROSPECT (if any): ${JSON.stringify(body.prospect || {})}
TRANSCRIPT:\n${transcript
      .map((t) => `${t.role}: ${t.message}`)
      .join("\n")
      .slice(0, 4000)}\n`;

    const resp = await fetch(`${endpoint}?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
      }),
    });
    if (!resp.ok) return json({ error: `gemini_${resp.status}` }, 502);
    const data = await resp.json();
    let text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];
    const parsed: {
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
      sentiment?: string;
      follow_ups?: {
        email_positive?: string;
        email_neutral?: string;
        email_negative?: string;
        whatsapp_positive?: string;
        whatsapp_neutral?: string;
        whatsapp_negative?: string;
      };
    } = {};
    try {
      const raw = JSON.parse(text) as unknown;
      // Normalize camelCase keys to expected snake_case structure
      if (raw && typeof raw === "object") {
        const r = raw as Record<string, unknown>;
        // recommended_actions / recommendedActions
        const ra1 = r["recommended_actions"];
        if (Array.isArray(ra1)) {
          parsed.recommended_actions = ra1 as Array<{
            title?: string;
            description?: string;
            priority?: string;
          }>;
        } else {
          const ra2 = r["recommendedActions"];
          if (Array.isArray(ra2)) {
            parsed.recommended_actions = ra2 as Array<{
              title?: string;
              description?: string;
              priority?: string;
            }>;
          }
        }

        // journey
        const jv = r["journey"];
        if (Array.isArray(jv)) parsed.journey = jv as Array<{
          stage?: string;
          insight?: string;
          risk?: string;
          recommendation?: string;
        }>;

        // next_best_action / nextBestAction
        const nba = (r["next_best_action"] ?? r["nextBestAction"]) as unknown;
        parsed.next_best_action = typeof nba === "string" ? nba : undefined;

        // prospect_summary / prospectSummary
        const ps = (r["prospect_summary"] ?? r["prospectSummary"]) as unknown;
        parsed.prospect_summary = typeof ps === "string" ? ps : undefined;

        // sentiment (optional)
        const rsent = r["sentiment"] as unknown;
        if (typeof rsent === "string") {
          parsed.sentiment = rsent;
        }

        // follow_ups / followUps
        const fu = (r["follow_ups"] ?? r["followUps"]) as unknown;
        if (fu && typeof fu === "object") {
          const furec = fu as Record<string, unknown>;
          parsed.follow_ups = {
            email_positive:
              (typeof furec["email_positive"] === "string"
                ? (furec["email_positive"] as string)
                : typeof furec["emailPositive"] === "string"
                ? (furec["emailPositive"] as string)
                : ""),
            email_neutral:
              (typeof furec["email_neutral"] === "string"
                ? (furec["email_neutral"] as string)
                : typeof furec["emailNeutral"] === "string"
                ? (furec["emailNeutral"] as string)
                : ""),
            email_negative:
              (typeof furec["email_negative"] === "string"
                ? (furec["email_negative"] as string)
                : typeof furec["emailNegative"] === "string"
                ? (furec["emailNegative"] as string)
                : ""),
            whatsapp_positive:
              (typeof furec["whatsapp_positive"] === "string"
                ? (furec["whatsapp_positive"] as string)
                : typeof furec["whatsappPositive"] === "string"
                ? (furec["whatsappPositive"] as string)
                : ""),
            whatsapp_neutral:
              (typeof furec["whatsapp_neutral"] === "string"
                ? (furec["whatsapp_neutral"] as string)
                : typeof furec["whatsappNeutral"] === "string"
                ? (furec["whatsappNeutral"] as string)
                : ""),
            whatsapp_negative:
              (typeof furec["whatsapp_negative"] === "string"
                ? (furec["whatsapp_negative"] as string)
                : typeof furec["whatsappNegative"] === "string"
                ? (furec["whatsappNegative"] as string)
                : ""),
          };
        }
      }
    } catch {}

    // Normalize sentiment from model or body
    const modelSent = (parsed.sentiment || "").toLowerCase();
    const bodySent = (body.sentiment || "").toLowerCase();
    function normalizeSent(s: string): "positive" | "neutral" | "negative" | undefined {
      if (!s) return undefined;
      if (s.startsWith("pos")) return "positive";
      if (s.startsWith("neg")) return "negative";
      if (s.startsWith("neu")) return "neutral";
      if (s === "positive" || s === "negative" || s === "neutral") return s as "positive" | "neutral" | "negative";
      return undefined;
    }
    const sentiment = normalizeSent(modelSent) ?? normalizeSent(bodySent) ?? "neutral";

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
