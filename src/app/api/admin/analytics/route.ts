import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import type { User } from "@/lib/sql";
import { db } from "@/lib/db/drizzle";
import { sql as dsql } from "drizzle-orm";

type DailyPoint = { date: string; count: number };
type TopItem = { name: string; count: number };
type SingleNumber = { value: number };
type DepthBucket = { bucket: string; count: number };
type SentimentItem = { name: string; count: number };
type ChatSummaryItem = {
  session_id: string;
  summary: string;
  sentiment: string | null;
  created_at: string;
};
type FunnelStep = { name: string; count: number };

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
    const rawRange = (url.searchParams.get("range") || "30d").toLowerCase();
    const allowed: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
    const range =
      rawRange in allowed
        ? (rawRange as keyof typeof allowed)
        : ("30d" as const);
    const days = allowed[range];
    const intervalLiteral = `${days} days`;

    // Sessions per day (last 30d)
    const sessionsDailyResult = (await db.execute(
      dsql`select (date_trunc('day', started_at))::date as date, count(*)::int as count
           from analytics_sessions
           where started_at >= now() - ${intervalLiteral}::interval
           group by 1
           order by 1`
    )) as unknown as { rows: DailyPoint[] };

    // Events per day (last 30d)
    const eventsDailyResult = (await db.execute(
      dsql`select (date_trunc('day', created_at))::date as date, count(*)::int as count
           from analytics_events
           where created_at >= now() - ${intervalLiteral}::interval
           group by 1
           order by 1`
    )) as unknown as { rows: DailyPoint[] };

    // Top routes from events (last 30d)
    const topRoutesResult = (await db.execute(
      dsql`select coalesce(route, '(unknown)') as name, count(*)::int as count
           from analytics_events
           where created_at >= now() - ${intervalLiteral}::interval
             and route is not null
           group by 1
           order by count desc
           limit 10`
    )) as unknown as { rows: TopItem[] };

    // Top sections from events (last 30d)
    const topSectionsResult = (await db.execute(
      dsql`select coalesce(section, '(unknown)') as name, count(*)::int as count
           from analytics_events
           where created_at >= now() - ${intervalLiteral}::interval
             and section is not null
           group by 1
           order by count desc
           limit 10`
    )) as unknown as { rows: TopItem[] };

    // Average engagement score (where present)
    const avgEngagementResult = (await db.execute(
      dsql`select coalesce(round(avg(engagement_score))::int, 0) as value
           from analytics_sessions
           where started_at >= now() - ${intervalLiteral}::interval
             and engagement_score is not null`
    )) as unknown as { rows: SingleNumber[] };

    // Bounce rate: sessions with exactly 1 page_view divided by total sessions
    const bounceRateResult = (await db.execute(
      dsql`with s as (
             select id
             from analytics_sessions
             where started_at >= now() - ${intervalLiteral}::interval
           ),
           pv as (
             select e.session_id, count(*)::int as pv_count
             from analytics_events e
             join s on s.id = e.session_id
             where e.type = 'page_view'
             group by e.session_id
           ),
           totals as (
             select (select count(*) from s)::int as total_sessions,
                    (select count(*) from pv where pv_count = 1)::int as bounces
           )
           select case when total_sessions > 0 then (bounces::decimal / total_sessions) else 0 end as value
           from totals`
    )) as unknown as { rows: SingleNumber[] };

    // Scroll depth distribution from exit_position events
    const scrollDepthResult = (await db.execute(
      dsql`with depths as (
             select coalesce((metadata->>'scroll_depth_pct_max')::int, 0) as d
             from analytics_events
             where created_at >= now() - ${intervalLiteral}::interval
               and type = 'exit_position'
           )
           select case
                    when d < 25 then '0-25%'
                    when d < 50 then '25-50%'
                    when d < 75 then '50-75%'
                    else '75-100%'
                  end as bucket,
                  count(*)::int as count
           from depths
           group by 1
           order by 1`
    )) as unknown as { rows: DepthBucket[] };

    // Chat daily volume (from chatbot_logs)
    const chatDailyResult = (await db.execute(
      dsql`select (date_trunc('day', created_at))::date as date, count(*)::int as count
           from chatbot_logs
           where created_at >= now() - ${intervalLiteral}::interval
           group by 1
           order by 1`
    )) as unknown as { rows: DailyPoint[] };

    // Sentiment breakdown (from chatbot_summaries)
    const sentimentResult = (await db.execute(
      dsql`select coalesce(sentiment, '(unknown)') as name, count(*)::int as count
           from chatbot_summaries
           where created_at >= now() - ${intervalLiteral}::interval
           group by 1
           order by count desc`
    )) as unknown as { rows: SentimentItem[] };

    // Top topics (unnest topics JSON array)
    const topTopicsResult = (await db.execute(
      dsql`select lower(x)::text as name, count(*)::int as count
           from chatbot_summaries cs,
                lateral jsonb_array_elements_text(coalesce(cs.topics, '[]'::jsonb)) as t(x)
           where cs.created_at >= now() - ${intervalLiteral}::interval
           group by 1
           order by count desc
           limit 10`
    )) as unknown as { rows: TopItem[] };

    // Recent chat summaries (latest 10)
    const recentSummariesResult = (await db.execute(
      dsql`select session_id, summary, sentiment, created_at
           from chatbot_summaries
           where created_at >= now() - ${intervalLiteral}::interval
           order by created_at desc
           limit 10`
    )) as unknown as { rows: ChatSummaryItem[] };

    // Funnel A: page_view -> section_visible(hero) -> click(Request Access)
    const funnelAResult = (await db.execute(
      dsql`with s as (
             select id
             from analytics_sessions
             where started_at >= now() - ${intervalLiteral}::interval
           ),
           pv as (
             select distinct session_id
             from analytics_events e
             join s on s.id = e.session_id
             where e.type = 'page_view'
           ),
           hero as (
             select distinct session_id
             from analytics_events e
             join s on s.id = e.session_id
             where e.type = 'section_visible' and e.section = 'hero'
           ),
           req as (
             select distinct session_id
             from analytics_events e
             join s on s.id = e.session_id
             where e.type = 'click' and (e.metadata->>'text') ilike '%request access%'
           )
           select 'page_view' as name, (select count(*) from pv)::int as count
           union all
           select 'hero_visible' as name, (select count(*) from hero)::int as count
           union all
           select 'request_access_click' as name, (select count(*) from req)::int as count`
    )) as unknown as { rows: FunnelStep[] };

    return json({
      range,
      rangeDays: days,
      sessionsDaily: sessionsDailyResult.rows,
      eventsDaily: eventsDailyResult.rows,
      topRoutes: topRoutesResult.rows,
      topSections: topSectionsResult.rows,
      avgEngagement: (avgEngagementResult.rows[0]?.value ?? 0) as number,
      bounceRate: Number(bounceRateResult.rows[0]?.value ?? 0),
      scrollDepthBuckets: scrollDepthResult.rows,
      chatDaily: chatDailyResult.rows,
      chatSentiment: sentimentResult.rows,
      chatTopTopics: topTopicsResult.rows,
      chatRecentSummaries: recentSummariesResult.rows.map((r) => ({
        sessionId: r.session_id,
        summary: r.summary,
        sentiment: r.sentiment,
        createdAt: r.created_at,
      })),
      funnelA: funnelAResult.rows,
    });
  } catch (error) {
    console.error("/api/admin/analytics GET error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}
