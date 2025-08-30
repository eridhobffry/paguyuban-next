import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import type { User } from "@/lib/sql";
import { processTelemetryDlq } from "@/lib/telemetry";

function json(res: unknown, status = 200) {
  return NextResponse.json(res, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function hasCronHeaderAuth(request: NextRequest) {
  const headerSecret = request.headers.get("x-cron-secret");
  const envSecret = process.env.CRON_SECRET;
  return !!headerSecret && !!envSecret && headerSecret === envSecret;
}

export async function GET(request: NextRequest) {
  // Allow either: (1) admin cookie auth, or (2) trusted cron header
  let authorized = false;

  if (hasCronHeaderAuth(request)) {
    authorized = true;
  } else {
    const token = request.cookies.get("auth-token")?.value;
    if (token) {
      const decoded = verifyToken(token) as User | null;
      authorized = !!decoded && isAdmin(decoded);
    }
  }

  if (!authorized) return json({ error: "Unauthorized" }, 401);

  const { searchParams } = new URL(request.url);
  const limit = Math.max(
    1,
    Math.min(1000, Number(searchParams.get("limit")) || 100)
  );

  try {
    const started = Date.now();
    const result = await processTelemetryDlq(limit);
    return json({
      ok: true,
      ran: "processTelemetryDlq",
      durationMs: Date.now() - started,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("retry-telemetry error", msg);
    return json({ ok: false, error: msg }, 500);
  }
}
