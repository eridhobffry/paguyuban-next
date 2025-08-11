import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import type { User } from "@/lib/sql";
import { db } from "@/lib/db/drizzle";
import { sql as dsql, eq } from "drizzle-orm";
import { chatbotSummaries } from "@/lib/db/schema";

type SummaryItem = {
  id: string;
  session_id: string;
  summary: string;
  sentiment: string | null;
  created_at: string;
};

function json(res: unknown, status = 200) {
  return NextResponse.json(res, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return json({ error: "Unauthorized" }, 401);
  const decoded = verifyToken(token) as User;
  if (!decoded || !isAdmin(decoded))
    return json({ error: "Admin access required" }, 403);

  const url = new URL(request.url);
  const rawRange = (url.searchParams.get("range") || "30d").toLowerCase();
  const allowed: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const range =
    rawRange in allowed ? (rawRange as keyof typeof allowed) : ("30d" as const);
  const days = allowed[range];
  const intervalLiteral = `${days} days`;

  const limitParam = Number(url.searchParams.get("limit") || 20);
  const limit = Math.min(
    Math.max(1, isFinite(limitParam) ? limitParam : 20),
    100
  );
  const cursor = url.searchParams.get("cursor");

  const cursorClause = cursor
    ? dsql`and created_at < ${cursor}::timestamptz`
    : dsql``;

  const result = (await db.execute(
    dsql`select id, session_id, summary, sentiment, created_at
         from chatbot_summaries
         where created_at >= now() - ${intervalLiteral}::interval
           ${cursorClause}
         order by created_at desc
         limit ${limit + 1}`
  )) as unknown as { rows: SummaryItem[] };

  const rows = result.rows.slice(0, limit);
  const next = result.rows.length > limit ? result.rows[limit] : undefined;
  const nextCursor = next ? next.created_at : null;

  return json({
    items: rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      summary: r.summary,
      sentiment: r.sentiment,
      createdAt: r.created_at,
    })),
    nextCursor,
  });
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return json({ error: "Unauthorized" }, 401);
  const decoded = verifyToken(token) as User;
  if (!decoded || !isAdmin(decoded))
    return json({ error: "Admin access required" }, 403);

  try {
    const { id } = (await request.json()) as { id?: string };
    if (!id) return json({ error: "Summary ID is required" }, 400);

    const [deleted] = await db
      .delete(chatbotSummaries)
      .where(eq(chatbotSummaries.id, id))
      .returning({ id: chatbotSummaries.id });
    if (!deleted) return json({ error: "Not found" }, 404);
    return json({ id: deleted.id });
  } catch (e) {
    return json({ error: "Invalid request" }, 400);
  }
}
