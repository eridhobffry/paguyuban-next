import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { artists } from "@/lib/db/schema";
import { and, asc, eq, ilike, sql } from "drizzle-orm";

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url);
    const q = (searchParams.get("q") || "").trim();
    const tag = (searchParams.get("tag") || "").trim();
    const slug = (searchParams.get("slug") || "").trim();

    const filters = [
      q ? ilike(artists.name, `%${q}%`) : undefined,
      slug ? eq(artists.slug, slug) : undefined,
      tag ? sql`${artists.tags} @> ARRAY[${tag}]::text[]` : undefined,
    ].filter(Boolean) as any[];

    const items = await db
      .select()
      .from(artists)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(artists.sortOrder));
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
