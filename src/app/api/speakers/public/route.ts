import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { speakers } from "@/lib/db/schema";
import { z } from "zod";
import { and, asc, eq, ilike, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const type = (searchParams.get("type") || "").trim();
    const tag = (searchParams.get("tag") || "").trim();
    const slug = (searchParams.get("slug") || "").trim();

    const filters = [
      q ? ilike(speakers.name, `%${q}%`) : undefined,
      type ? eq(speakers.speakerType, type) : undefined,
      slug ? eq(speakers.slug, slug) : undefined,
      // tags stored as text[]; simple contains match
      tag ? sql`${speakers.tags} @> ARRAY[${tag}]::text[]` : undefined,
    ].filter((c): c is SQL => Boolean(c));

    // Select only columns that exist in current DB and are safe
    const items = await db
      .select({
        id: speakers.id,
        name: speakers.name,
        role: speakers.role,
        company: speakers.company,
        bio: speakers.bio,
        // alias to keep public API field stable
        image_url: speakers.imageUrl,
        speakerType: speakers.speakerType,
        slug: speakers.slug,
        twitter: speakers.twitter,
        linkedin: speakers.linkedin,
        website: speakers.website,
      })
      .from(speakers)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(speakers.name));

    const SpeakerTypeEnum = z
      .enum(["summit", "main_stage"])
      .optional()
      .nullable();
    const SpeakerSchema = z.object({
      id: z.any(),
      name: z.string(),
      role: z.string().nullable().optional(),
      company: z.string().nullable().optional(),
      bio: z.string().nullable().optional(),
      image_url: z.string().nullable().optional(),
      speakerType: SpeakerTypeEnum,
      slug: z.string().nullable().optional(),
      twitter: z.string().nullable().optional(),
      linkedin: z.string().nullable().optional(),
      website: z.string().nullable().optional(),
    });
    const Parsed = z.array(SpeakerSchema);
    const parsed = Parsed.parse(items);

    return NextResponse.json(
      { speakers: parsed },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("/api/speakers/public GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
