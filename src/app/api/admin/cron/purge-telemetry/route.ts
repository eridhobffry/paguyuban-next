import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { sql as dsql } from "drizzle-orm";
import { verifyToken, isAdmin } from "@/lib/auth";
import type { User } from "@/lib/sql";

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

  try {
    const started = Date.now();
    // Use SELECT to invoke the retention function created in migration
    const result = await db.execute(dsql`select purge_ai_query_performance()`);

    return json({
      ok: true,
      ran: "purge_ai_query_performance",
      durationMs: Date.now() - started,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("purge-telemetry error", msg);
    return json({ ok: false, error: msg }, 500);
  }
}
