import { db } from "@/lib/db/drizzle";
import { aiQueryPerformance, telemetryDlq } from "@/lib/db/schema";
import { redactPII } from "@/lib/security/sanitize";
import { getCircuitBreakerStates } from "@/lib/ai/secure-fetch";
import { or, lte, isNull, eq } from "drizzle-orm";

export type TelemetryStatus =
  | "success"
  | "partial_success"
  | "degraded"
  | "failure";

export type TelemetryContext = {
  endpoint: string;
  intent?: string | null;
  queryType?: string; // e.g. "ai" | "knowledge" | "analytics"
  aiEndpoint?: string | null;
  model?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  correlationId?: string | null;
  synthetic?: boolean;
  metadata?: Record<string, unknown>;
};

const SUCCESS_SAMPLE_RATE = Number(
  process.env.AI_TELEMETRY_SUCCESS_RATE || 0.1
);
const AI_TELEMETRY_ENABLED = process.env.AI_TELEMETRY_ENABLED !== "false"; // default on
const REQUIRE_CONSENT = process.env.AI_TELEMETRY_REQUIRE_CONSENT === "true"; // default off
const REQUIRED_CONSENT_VERSION = process.env.AI_CONSENT_VERSION || "v1";
const INTENT_CATALOG_LIMIT = Number(
  process.env.AI_TELEMETRY_INTENT_LIMIT || 100
);

// In-memory intent catalog to cap cardinality
const intentCatalog = new Set<string>();

// Simple in-process dedup by correlation id
const recentIds = new Map<string, number>();
const DEDUP_TTL_MS = 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of recentIds)
    if (now - v > DEDUP_TTL_MS) recentIds.delete(k);
}, 30_000).unref?.();

export function getOrCreateCorrelationId(
  headers?: Headers | Record<string, string> | null
) {
  const h = headers instanceof Headers ? headers : new Headers(headers || {});
  let id = h.get("x-correlation-id");
  if (!id) id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  return id;
}

function hasTelemetryConsent(
  headers?: Headers | Record<string, string> | null
) {
  const h = headers instanceof Headers ? headers : new Headers(headers || {});
  const aiConsent = h.get("x-ai-consent");
  const telConsent = h.get("x-telemetry-consent");
  // Accept either explicit telemetry allow or matching AI consent version
  if (telConsent && telConsent.toLowerCase() === "allow") return true;
  if (aiConsent && aiConsent === REQUIRED_CONSENT_VERSION) return true;
  return false;
}

function normalizeIntent(intent?: string | null) {
  if (!intent) return null;
  const t = intent.toLowerCase().replace(/[^a-z0-9_:\-]/g, "_");
  if (intentCatalog.has(t)) return t;
  if (intentCatalog.size < INTENT_CATALOG_LIMIT) {
    intentCatalog.add(t);
    return t;
  }
  return "other_uncategorized";
}

function weightForSample(success: boolean) {
  if (!success) return 1;
  const r =
    SUCCESS_SAMPLE_RATE > 0 && SUCCESS_SAMPLE_RATE <= 1
      ? SUCCESS_SAMPLE_RATE
      : 0.1;
  return Math.round(1 / r);
}

export async function recordTelemetry(
  ctx: TelemetryContext & {
    status: TelemetryStatus;
    success: boolean;
    responseTime: number; // ms
    tokenPrompt?: number | null;
    tokenCompletion?: number | null;
    tokenTotal?: number | null;
    costUsd?: number | string | null;
    errorMessage?: string | null;
    breakerState?: string | null;
  }
) {
  try {
    if (!AI_TELEMETRY_ENABLED) return; // global gate
    const correlationId = ctx.correlationId || getOrCreateCorrelationId(null);
    if (recentIds.has(correlationId)) return; // dedup
    recentIds.set(correlationId, Date.now());

    const sampleWeight = weightForSample(ctx.success);
    const metadata = {
      ...(ctx.metadata || {}),
      sample_weight: sampleWeight,
      breaker_snapshot: getCircuitBreakerStates(),
      instance: {
        uptimeSec: Math.round(process.uptime()),
        rss: process.memoryUsage?.().rss ?? 0,
      },
      data_quality: ctx.responseTime < 0 ? "clock_skew" : "ok",
    };

    type AiPerfInsert = typeof aiQueryPerformance.$inferInsert;
    const row: AiPerfInsert = {
      queryType: ctx.queryType || "ai",
      endpoint: ctx.endpoint,
      intent: normalizeIntent(ctx.intent),
      status: ctx.status,
      success: ctx.success,
      responseTime: Math.max(
        0,
        Math.min(3600_000, Math.floor(ctx.responseTime))
      ),
      model: ctx.model || null,
      tokenPrompt: ctx.tokenPrompt ?? null,
      tokenCompletion: ctx.tokenCompletion ?? null,
      tokenTotal: ctx.tokenTotal ?? null,
      costUsd: ctx.costUsd == null ? null : String(ctx.costUsd),
      errorMessage: ctx.errorMessage
        ? redactPII(String(ctx.errorMessage)).slice(0, 1000)
        : null,
      correlationId,
      userId: ctx.userId || null,
      sessionId: (ctx as { sessionId?: string | null }).sessionId ?? null,
      aiEndpoint: ctx.aiEndpoint || null,
      breakerState: ctx.breakerState || null,
      synthetic: !!ctx.synthetic,
      metadata,
    } as const;

    try {
      await db.insert(aiQueryPerformance).values(row);
    } catch (e) {
      // On failure, enqueue to DLQ with initial backoff
      const now = new Date();
      const attempts = 1;
      const delayMs = backoffDelay(attempts);
      const next = new Date(now.getTime() + delayMs);
      const msg = e instanceof Error ? e.message : String(e);
      try {
        await db.insert(telemetryDlq).values({
          payload: row as unknown as Record<string, unknown>,
          errorMessage: redactPII(msg).slice(0, 1000),
          attempts,
          nextAttemptAt: next,
          lastErrorAt: now,
        });
      } catch {
        // swallow any DLQ enqueue errors
      }
    }
  } catch {
    // swallow outer telemetry errors
  }
}

export async function withTelemetry<T>(
  base: TelemetryContext & {
    headers?: Headers | Record<string, string> | null;
  },
  fn: () => Promise<T>,
  opts?: {
    onSuccessStatus?: TelemetryStatus;
    onErrorStatus?: TelemetryStatus;
    successIf?: (result: T) => boolean;
  }
): Promise<T> {
  const start = Date.now();
  const correlationId =
    base.correlationId || getOrCreateCorrelationId(base.headers || null);
  let result!: T;
  try {
    result = await fn();
    const ok = opts?.successIf ? !!opts.successIf(result) : true;
    if (
      AI_TELEMETRY_ENABLED &&
      (!REQUIRE_CONSENT || hasTelemetryConsent(base.headers || null))
    ) {
      queueMicrotask(() =>
        recordTelemetry({
          ...base,
          correlationId,
          status: opts?.onSuccessStatus || "success",
          success: ok,
          responseTime: Date.now() - start,
        })
      );
    }
    return result;
  } catch (e) {
    if (
      AI_TELEMETRY_ENABLED &&
      (!REQUIRE_CONSENT || hasTelemetryConsent(base.headers || null))
    ) {
      queueMicrotask(() =>
        recordTelemetry({
          ...base,
          correlationId,
          status: opts?.onErrorStatus || "failure",
          success: false,
          responseTime: Date.now() - start,
          errorMessage: e instanceof Error ? e.message : String(e),
        })
      );
    }
    throw e;
  }
}

export function weightedPercentile(
  values: Array<{ value: number; weight?: number }>,
  p: number
) {
  if (!values.length) return 0;
  const list = values
    .map((v) => ({
      value: Math.max(0, v.value),
      weight: Math.max(0, v.weight ?? 1),
    }))
    .filter((v) => Number.isFinite(v.value) && Number.isFinite(v.weight))
    .sort((a, b) => a.value - b.value);
  const totalWeight = list.reduce((s, v) => s + v.weight, 0);
  if (totalWeight <= 0) return list[list.length - 1]!.value;
  const target = p * totalWeight;
  let cum = 0;
  for (const v of list) {
    cum += v.weight;
    if (cum >= target) return v.value;
  }
  return list[list.length - 1]!.value;
}

// ---- DLQ processing helpers ----
function backoffDelay(attempts: number) {
  const baseMs = 5 * 60_000; // 5 minutes
  const maxMs = 6 * 60 * 60_000; // 6 hours
  const jitter = Math.floor(Math.random() * 0.1 * baseMs); // ±10% jitter on base
  const exp = Math.min(baseMs * 2 ** Math.max(0, attempts - 1) + jitter, maxMs);
  return Math.floor(exp);
}

export async function processTelemetryDlq(limit = 100) {
  const now = new Date();
  const items = await db
    .select()
    .from(telemetryDlq)
    .where(
      or(
        isNull(telemetryDlq.nextAttemptAt),
        lte(telemetryDlq.nextAttemptAt, now)
      )
    )
    .orderBy(telemetryDlq.createdAt)
    .limit(limit);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const it of items) {
    processed++;
    try {
      await db
        .insert(aiQueryPerformance)
        .values(it.payload as typeof aiQueryPerformance.$inferInsert);
      await db.delete(telemetryDlq).where(eq(telemetryDlq.id, it.id));
      succeeded++;
    } catch (e) {
      const attempts = (it.attempts ?? 0) + 1;
      const delayMs = backoffDelay(attempts);
      const next = new Date(now.getTime() + delayMs);
      const msg = e instanceof Error ? e.message : String(e);
      await db
        .update(telemetryDlq)
        .set({
          attempts,
          lastErrorAt: new Date(),
          nextAttemptAt: next,
          errorMessage: redactPII(msg).slice(0, 1000),
          updatedAt: new Date(),
        })
        .where(eq(telemetryDlq.id, it.id));
      failed++;
    }
  }

  return { processed, succeeded, failed };
}
