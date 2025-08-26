import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const result = await db.execute(sql`SELECT 1 as test`);

    return NextResponse.json({
      status: "ok",
      message: "API and database are working",
      timestamp: new Date().toISOString(),
      database_test: result,
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
