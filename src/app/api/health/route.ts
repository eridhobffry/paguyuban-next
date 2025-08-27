import { NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { sql as dsql } from "drizzle-orm";

type HealthStatus = "healthy" | "degraded" | "unhealthy";

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  // @ts-expect-error fetch-only signal, we only use for fetch below
  (p as any).signal = ctl.signal;
  return p.finally(() => clearTimeout(t));
}

async function checkAI() {
  const base =
    process.env.AI_SERVICE_URL ||
    process.env.AI_API_URL ||
    "http://localhost:8001";
  const url = `${base.replace(/\/$/, "")}/health`;
  const started = Date.now();
  try {
    const res = await withTimeout(fetch(url, { cache: "no-store" }), 1200);
    const latencyMs = Date.now() - started;
    if (!res.ok)
      return { ok: false, latencyMs, error: `status_${res.status}` } as const;
    const data = await res.json().catch(() => ({}));
    return {
      ok: true,
      latencyMs,
      version: data?.version ?? null,
      uptime: data?.uptime ?? null,
      details: data ?? null,
    } as const;
  } catch (e: any) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: e?.name || "ai_fetch_error",
    } as const;
  }
}

async function checkDB() {
  const started = Date.now();
  try {
    await db.execute(dsql`select 1`);
    return { ok: true, latencyMs: Date.now() - started } as const;
  } catch (e: any) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: e?.message || "db_error",
    } as const;
  }
}

export async function GET() {
  const [ai, dbHealth] = await Promise.all([checkAI(), checkDB()]);

  let status: HealthStatus = "unhealthy";
  if (ai.ok && dbHealth.ok) status = "healthy";
  else if (ai.ok || dbHealth.ok) status = "degraded";

  const redisConfigured = Boolean(process.env.REDIS_URL);
  const body = {
    status,
    ai,
    db: dbHealth,
    redis: { configured: redisConfigured },
    timestamp: new Date().toISOString(),
  };

  const httpStatus =
    status === "healthy" ? 200 : status === "degraded" ? 200 : 503;
  return NextResponse.json(body, {
    status: httpStatus,
    headers: { "Cache-Control": "no-store" },
  });
}

// Exported for testing
export const __private__ = { checkAI, checkDB };
