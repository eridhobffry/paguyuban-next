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
  "next_best_action": string
}
Use the chat SUMMARY and TRANSCRIPT below. Focus on concrete next steps for sponsorship conversion.

SUMMARY: ${body.summary ?? "(none)"}
SENTIMENT: ${body.sentiment ?? "(unknown)"}
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
    let parsed: {
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
    } = {};
    try {
      parsed = JSON.parse(text);
    } catch {}

    if (
      !parsed?.recommended_actions ||
      parsed.recommended_actions.length === 0
    ) {
      const sentiment = (body.sentiment ?? "neutral").toLowerCase();
      parsed = {
        recommended_actions: [
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
          {
            title: "Follow-up reminder",
            description:
              "Set a 3–5 day reminder to follow-up after they consult their boss.",
            priority: "medium",
          },
        ],
        journey: [
          {
            stage: "Awareness",
            insight: "User asked about sponsorship pricing and benefits.",
            risk: "Price sensitivity; unclear ROI.",
            recommendation:
              "Lead with benefits and concrete ROI scenarios for their sector.",
          },
          {
            stage: "Consideration",
            insight: "User will consult their boss.",
            risk: "Internal misalignment or competing priorities.",
            recommendation:
              "Provide a one-pager the user can forward internally.",
          },
          {
            stage: "Decision",
            insight: "Needs clear next step to proceed.",
            risk: "Stall without a scheduled touchpoint.",
            recommendation:
              "Offer a specific time slot for a call and send calendar invite.",
          },
        ],
        next_best_action:
          sentiment === "negative"
            ? "Send a short note acknowledging concerns and propose a brief call to clarify ROI and fit."
            : "Propose a 20‑minute call this week and attach the sponsorship deck tailored to their industry.",
      };
    }

    return json({
      recommendedActions: parsed.recommended_actions || [],
      journey: parsed.journey || [],
      nextBestAction: parsed.next_best_action || "",
    });
  } catch (error) {
    console.error("/api/admin/analytics/chat/recommend error", error);
    return json({ error: "Internal server error" }, 500);
  }
}
