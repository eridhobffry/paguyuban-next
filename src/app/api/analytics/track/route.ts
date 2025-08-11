import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/drizzle";
import { analyticsSessions, analyticsEvents } from "@/lib/db/schema";
import { stackServerApp } from "@/stack";

// CORS headers for public tracking endpoint
function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  };
}

// Simple in-memory token buckets (best-effort on serverless; sufficient to cap bursts)
type Bucket = { tokens: number; lastRefillMs: number };
const ipBuckets: Map<string, Bucket> = new Map();
const sessionBuckets: Map<string, Bucket> = new Map();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const real = req.headers.get("x-real-ip");
  return real || "unknown";
}

function allow(
  map: Map<string, Bucket>,
  key: string,
  capacity: number,
  refillPerSec: number,
  cost: number
): boolean {
  const now = Date.now();
  let bucket = map.get(key);
  if (!bucket) {
    bucket = { tokens: capacity, lastRefillMs: now };
    map.set(key, bucket);
  }
  const elapsedSec = Math.max(0, (now - bucket.lastRefillMs) / 1000);
  bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSec * refillPerSec);
  bucket.lastRefillMs = now;
  if (bucket.tokens >= cost) {
    bucket.tokens -= cost;
    return true;
  }
  return false;
}

function rateLimitFailedResponse(): NextResponse {
  return new NextResponse(JSON.stringify({ error: "rate_limited" }), {
    status: 429,
    headers: { ...corsHeaders(), "Retry-After": "5" },
  });
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

const SessionStartSchema = z.object({
  type: z.literal("session_start"),
  session: z.object({
    routeFirst: z.string().optional().nullable(),
    referrer: z.string().optional().nullable(),
    utm: z.record(z.string(), z.any()).optional().nullable(),
    device: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
  }),
});

const EventItemSchema = z.object({
  type: z.string().min(1),
  route: z.string().optional().nullable(),
  section: z.string().optional().nullable(),
  element: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
});

const EventsSchema = z.object({
  type: z.literal("events"),
  sessionId: z.string().uuid(),
  events: z.array(EventItemSchema).min(1),
});

const PayloadSchema = z.union([SessionStartSchema, EventsSchema]);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const json = await request.json();
    const payload = PayloadSchema.parse(json);
    const ip = getClientIp(request);
    // Resolve authenticated user once per request (if available)
    let authUserId: string | null = null;
    try {
      const user = await stackServerApp.getUser();
      authUserId = user?.id ?? null;
    } catch {
      authUserId = null;
    }

    if (payload.type === "session_start") {
      // Rate limit session starts per userId when logged-in; fallback to IP
      const sessKey = authUserId ? `sess-user:${authUserId}` : `sess-ip:${ip}`;
      // capacity 10, refill 0.2/s ≈ 12/min
      if (!allow(ipBuckets, sessKey, 10, 0.2, 1)) {
        return rateLimitFailedResponse();
      }

      const [inserted] = await db
        .insert(analyticsSessions)
        .values({
          userId: authUserId ?? undefined,
          routeFirst: payload.session.routeFirst ?? undefined,
          referrer: payload.session.referrer ?? undefined,
          utm: payload.session.utm ?? undefined,
          device: payload.session.device ?? undefined,
          country: payload.session.country ?? undefined,
        })
        .returning({ id: analyticsSessions.id });

      return NextResponse.json(
        { sessionId: inserted.id },
        { status: 201, headers: corsHeaders() }
      );
    }

    // Events batch
    const batch = payload;
    // Per-session + per-IP rate limit, cost proportional to number of events
    const cost = Math.max(1, Math.min(50, batch.events.length));
    // session bucket (capacity 60, refill 1/s ≈ 60/min)
    if (!allow(sessionBuckets, `evt-sess:${batch.sessionId}`, 60, 1, cost)) {
      return rateLimitFailedResponse();
    }
    // per-user or per-ip bucket (capacity 200, refill 2/s ≈ 120/min)
    const key = authUserId ? `evt-user:${authUserId}` : `evt-ip:${ip}`;
    if (!allow(ipBuckets, key, 200, 2, cost)) {
      return rateLimitFailedResponse();
    }
    const rows = batch.events.map((e) => ({
      sessionId: batch.sessionId,
      userId: authUserId ?? undefined,
      type: e.type,
      route: e.route ?? undefined,
      section: e.section ?? undefined,
      element: e.element ?? undefined,
      metadata: e.metadata ?? undefined,
      // createdAt is DB default if omitted
    }));

    if (rows.length > 0) {
      await db.insert(analyticsEvents).values(rows);
    }

    return NextResponse.json(
      { ok: true },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("/api/analytics/track POST error:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400, headers: corsHeaders() }
    );
  }
}
