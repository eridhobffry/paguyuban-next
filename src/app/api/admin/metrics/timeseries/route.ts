import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import type { User } from "@/lib/sql";
import { db } from "@/lib/db/drizzle";
import { sql as dsql } from "drizzle-orm";

function json(res: unknown, status = 200) {
  return NextResponse.json(res, {
    status,
    headers: {
      // Private caching to ease load while allowing slight staleness
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    },
  });
}

export async function GET(request: NextRequest) {
  // Authn/z
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return json({ error: "Unauthorized" }, 401);
  const decoded = verifyToken(token);
  if (!decoded || !isAdmin(decoded as User))
    return json({ error: "Admin access required" }, 403);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _user = decoded as User; // Stored for potential future use
  const url = new URL(request.url);
  const rawRange = (url.searchParams.get("range") || "30d").toLowerCase();
  const rawInterval = (url.searchParams.get("interval") || "1h").toLowerCase();

  const ranges: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const range =
    rawRange in ranges ? (rawRange as keyof typeof ranges) : ("30d" as const);
  const days = ranges[range];

  const interval = ["5m", "1h", "1d"].includes(rawInterval)
    ? rawInterval
    : "1h";

  // Build SQL fragments for bucketing
  // We avoid extensions like Timescale; stick to pure Postgres
  const bucketExpr =
    interval === "1d"
      ? dsql`date_trunc('day', created_at)`
      : interval === "1h"
      ? dsql`date_trunc('hour', created_at)`
      : dsql`to_timestamp(floor(extract(epoch from created_at) / 300) * 300)`; // 5m buckets

  const intervalLiteral = `${days} days`;

  // Pull weighted latency plus error counts per bucket
  const result = (await db.execute(dsql`
    with base as (
      select ${bucketExpr} as bucket,
             response_time,
             coalesce((metadata ->> 'sample_weight')::int, 1) as weight,
             success
      from ai_query_performance
      where created_at >= now() - ${intervalLiteral}::interval
    )
    select bucket,
           -- weighted avg latency (ms)
           case when sum(weight) > 0 then round(sum(response_time * weight)::numeric / nullif(sum(weight),0)) else 0 end as latency_avg,
           -- weighted percentiles approximated via avg of top quantiles can be added later if needed
           sum(case when success then 0 else weight end) as error_weight,
           sum(weight) as total_weight
    from base
    group by 1
    order by 1 asc
  `)) as unknown as {
    rows: Array<{
      bucket: string;
      latency_avg: string | number | null;
      error_weight: string | number | null;
      total_weight: string | number | null;
    }>;
  };

  const rows = result.rows || [];

  return json({
    window: {
      range,
      interval,
      from: new Date(Date.now() - days * 24 * 3600 * 1000).toISOString(),
      to: new Date().toISOString(),
    },
    series: rows.map((r) => ({
      t: r.bucket,
      latencyAvgMs: Number(r.latency_avg ?? 0),
      errorWeighted: Number(r.error_weight ?? 0),
      totalWeighted: Number(r.total_weight ?? 0),
      successRateWeighted:
        Number(r.total_weight ?? 0) > 0
          ? (Number(r.total_weight ?? 0) - Number(r.error_weight ?? 0)) /
            Number(r.total_weight ?? 0)
          : 0,
    })),
  });
}
