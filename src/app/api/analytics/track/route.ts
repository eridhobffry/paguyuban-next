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

    if (payload.type === "session_start") {
      // Try to attach authenticated user id if present; otherwise null
      let userId: string | null = null;
      try {
        const user = await stackServerApp.getUser();
        userId = user?.id ?? null;
      } catch {
        userId = null;
      }

      const [inserted] = await db
        .insert(analyticsSessions)
        .values({
          userId: userId ?? undefined,
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
    const rows = batch.events.map((e) => ({
      sessionId: batch.sessionId,
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
