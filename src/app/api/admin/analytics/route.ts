import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import type { User } from "@/lib/sql";
import { db } from "@/lib/db/drizzle";
import { sql as dsql } from "drizzle-orm";

type DailyPoint = { date: string; count: number };
type TopItem = { name: string; count: number };

function json(res: unknown, status = 200) {
  return NextResponse.json(res, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return json({ error: "Unauthorized" }, 401);
    const decoded = verifyToken(token) as User;
    if (!decoded || !isAdmin(decoded))
      return json({ error: "Admin access required" }, 403);

    // Accept optional range query but clamp to 30d for minimal dashboard
    const url = new URL(request.url);
    const range = url.searchParams.get("range") || "30d";
    const days = 30; // minimal: fixed 30d to keep queries fast and results small

    // Sessions per day (last 30d)
    const sessionsDailyResult = (await db.execute(
      dsql`select (date_trunc('day', started_at))::date as date, count(*)::int as count
           from analytics_sessions
           where started_at >= now() - interval '30 days'
           group by 1
           order by 1`
    )) as unknown as { rows: DailyPoint[] };

    // Events per day (last 30d)
    const eventsDailyResult = (await db.execute(
      dsql`select (date_trunc('day', created_at))::date as date, count(*)::int as count
           from analytics_events
           where created_at >= now() - interval '30 days'
           group by 1
           order by 1`
    )) as unknown as { rows: DailyPoint[] };

    // Top routes from events (last 30d)
    const topRoutesResult = (await db.execute(
      dsql`select coalesce(route, '(unknown)') as name, count(*)::int as count
           from analytics_events
           where created_at >= now() - interval '30 days'
             and route is not null
           group by 1
           order by count desc
           limit 10`
    )) as unknown as { rows: TopItem[] };

    // Top sections from events (last 30d)
    const topSectionsResult = (await db.execute(
      dsql`select coalesce(section, '(unknown)') as name, count(*)::int as count
           from analytics_events
           where created_at >= now() - interval '30 days'
             and section is not null
           group by 1
           order by count desc
           limit 10`
    )) as unknown as { rows: TopItem[] };

    return json({
      range,
      rangeDays: days,
      sessionsDaily: sessionsDailyResult.rows,
      eventsDaily: eventsDailyResult.rows,
      topRoutes: topRoutesResult.rows,
      topSections: topSectionsResult.rows,
    });
  } catch (error) {
    console.error("/api/admin/analytics GET error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}
