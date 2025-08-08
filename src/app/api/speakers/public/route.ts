import { NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { speakers } from "@/lib/db/schema";
import { z } from "zod";
import { asc } from "drizzle-orm";

export async function GET(): Promise<NextResponse> {
  try {
    // Select only columns that exist in current DB and are safe
    const items = await db
      .select({
        id: speakers.id,
        name: speakers.name,
        role: speakers.role,
        company: speakers.company,
        bio: speakers.bio,
        imageUrl: speakers.imageUrl,
        speakerType: speakers.speakerType,
      })
      .from(speakers)
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
      imageUrl: z.string().nullable().optional(),
      speakerType: SpeakerTypeEnum,
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
