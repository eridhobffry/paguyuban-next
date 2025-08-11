import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  try {
    // Allow machine-triggered runs via secret header, otherwise require admin
    const secretHeader = request.headers.get("x-sessionizer-secret");
    const allowedSecret = process.env.ANALYTICS_SESSIONIZER_SECRET;
    if (!(secretHeader && allowedSecret && secretHeader === allowedSecret)) {
      const token = request.cookies.get("auth-token")?.value;
      if (!token) return json({ error: "Unauthorized" }, 401);
      const decoded = verifyToken(token) as User;
      if (!decoded || !isAdmin(decoded))
        return json({ error: "Admin access required" }, 403);
    }

    let thresholdMinutes = 30;
    try {
      const body = (await request.json().catch(() => null)) as {
        thresholdMinutes?: number;
      } | null;
      if (body && typeof body.thresholdMinutes === "number") {
        thresholdMinutes = Math.max(
          10,
          Math.min(240, Math.floor(body.thresholdMinutes))
        );
      }
    } catch {
      // ignore body parse errors; use default
    }

    const intervalLiteral = `${thresholdMinutes} minutes`;

    // Close stale sessions and compute engagement score in one statement
    const result = await db.execute(dsql`
      with t as (
        select s.id,
               s.started_at,
               coalesce(max(e.created_at), s.started_at) as last_ts
        from analytics_sessions s
        left join analytics_events e on e.session_id = s.id
        where s.ended_at is null
          and s.started_at >= now() - interval '90 days'
        group by s.id, s.started_at
        having now() - coalesce(max(e.created_at), s.started_at) > ${intervalLiteral}::interval
      ),
      upd as (
        update analytics_sessions s
        set ended_at = t.last_ts
        from t
        where s.id = t.id
        returning s.id, s.started_at, t.last_ts as ended_at
      ),
      agg as (
        select u.id,
               count(e.id) as events_count,
               coalesce(sum(sd.dwell_ms), 0) as dwell_ms,
               extract(epoch from (u.ended_at - u.started_at))::int as duration_sec
        from upd u
        left join analytics_events e on e.session_id = u.id
        left join analytics_section_durations sd on sd.session_id = u.id
        group by u.id, u.started_at, u.ended_at
      ),
      scored as (
        select id,
               least(
                 100,
                 least(60, events_count * 3) +
                 least(30, ln(1 + greatest(0, dwell_ms) / 1000.0) * 10) +
                 least(20, greatest(0, duration_sec) / 60.0 * 5)
               )::int as score
        from agg
      )
      update analytics_sessions s
      set engagement_score = scored.score
      from scored
      where s.id = scored.id
      returning s.id, s.ended_at, s.engagement_score;
    `);

    const rows =
      (
        result as unknown as {
          rows?: Array<{
            id: string;
            ended_at: string;
            engagement_score: number;
          }>;
        }
      ).rows || [];
    return json({
      updated: rows.length,
      sessions: rows.map((r) => ({
        id: r.id,
        endedAt: r.ended_at,
        engagementScore: r.engagement_score,
      })),
    });
  } catch (error) {
    console.error("/api/admin/analytics/sessionize POST error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}
