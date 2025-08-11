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

    const prompt = `You are a senior CX strategist. Based on the chat summary and (if provided) transcript, produce:
1) recommended_actions: array of 3-6 objects { title, description, priority: one of high|medium|low }
2) journey: array of 3-5 objects { stage, insight, risk, recommendation }
3) next_best_action: one sentence.
Return strict JSON with keys { recommended_actions, journey, next_best_action }.

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
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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
    } catch {
      parsed = { recommended_actions: [], journey: [], next_best_action: "" };
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
