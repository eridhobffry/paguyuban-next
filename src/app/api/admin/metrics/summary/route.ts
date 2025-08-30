import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import type { User } from "@/lib/sql";
import { db } from "@/lib/db/drizzle";
import { sql as dsql } from "drizzle-orm";
import { weightedPercentile } from "@/lib/telemetry";

type Row = {
  response_time: number;
  success: boolean;
  status: string;
  created_at: string;
  sample_weight: number | null;
};

function json(res: unknown, status = 200) {
  return NextResponse.json(res, {
    status,
    headers: {
      // Cache privately for 60s to reduce DB load; allow quick staleness
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    },
  });
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return json({ error: "Unauthorized" }, 401);
  const decoded = verifyToken(token);
  if (!decoded || !isAdmin(decoded as User))
    return json({ error: "Admin access required" }, 403);

  // User object available for future use

  const url = new URL(request.url);
  const rawRange = (url.searchParams.get("range") || "30d").toLowerCase();
  const allowed: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const range =
    rawRange in allowed ? (rawRange as keyof typeof allowed) : ("30d" as const);
  const days = allowed[range];
  const intervalLiteral = `${days} days`;

  try {
    // Pull rows needed for weighted calculations in a single query
    const result = (await db.execute(dsql`
      select response_time, success, status, created_at,
             nullif((metadata ->> 'sample_weight')::int, 0) as sample_weight
      from ai_query_performance
      where created_at >= now() - ${intervalLiteral}::interval
    `)) as unknown as { rows: Row[] };

    const rows = result.rows || [];
    const weightsAndVals = rows
      .filter((r) => Number.isFinite(r.response_time))
      .map((r) => ({
        value: Math.max(0, Math.floor(r.response_time)),
        weight: r.sample_weight ?? 1,
      }));

    const totalWeight = weightsAndVals.reduce((s, v) => s + (v.weight ?? 1), 0);
    const successWeight = rows.reduce(
      (s, r) => s + (r.success ? r.sample_weight ?? 1 : 0),
      0
    );
    const failureWeight = totalWeight - successWeight;

    const p50 = weightedPercentile(weightsAndVals, 0.5);
    const p90 = weightedPercentile(weightsAndVals, 0.9);
    const p95 = weightedPercentile(weightsAndVals, 0.95);
    const p99 = weightedPercentile(weightsAndVals, 0.99);

    const avg =
      totalWeight > 0
        ? Math.round(
            weightsAndVals.reduce((s, v) => s + v.value * (v.weight ?? 1), 0) /
              totalWeight
          )
        : 0;

    // Lightweight breakdowns (top intents by count)
    const breakdown = (await db.execute(dsql`
    select coalesce(intent, 'unknown') as intent,
           count(*) as count
    from ai_query_performance
    where created_at >= now() - ${intervalLiteral}::interval
    group by 1
    order by count desc
    limit 5
  `)) as unknown as { rows: Array<{ intent: string; count: string | number }> };

    const nowIso = new Date().toISOString();
    const fromIso = new Date(
      Date.now() - days * 24 * 3600 * 1000
    ).toISOString();

    return json({
      window: { range, from: fromIso, to: nowIso },
      totals: {
        observations: rows.length,
        weighted: totalWeight,
        successWeighted: successWeight,
        failureWeighted: failureWeight,
        successRateWeighted: totalWeight > 0 ? successWeight / totalWeight : 0,
      },
      latencyMs: { p50, p90, p95, p99, avg },
      topIntents: breakdown.rows.map((r) => ({
        intent: r.intent,
        count: Number(r.count),
      })),
    });
  } catch (error) {
    console.error("Error in metrics API:", error);

    // Return graceful fallback response on database errors
    const nowIso = new Date().toISOString();
    const fromIso = new Date(
      Date.now() - days * 24 * 3600 * 1000
    ).toISOString();

    return json({
      window: { range, from: fromIso, to: nowIso },
      totals: {
        observations: 0,
        weighted: 0,
        successWeighted: 0,
        failureWeighted: 0,
        successRateWeighted: 0,
      },
      latencyMs: { p50: 0, p90: 0, p95: 0, p99: 0, avg: 0 },
      topIntents: [],
      error: "Database temporarily unavailable",
    });
  }
}
