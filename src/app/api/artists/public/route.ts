import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { artists } from "@/lib/db/schema";

export async function GET(_request: NextRequest) {
  try {
    const items = await db.select().from(artists).orderBy(artists.sortOrder);
    return NextResponse.json(
      { artists: items },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("/api/artists/public GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
