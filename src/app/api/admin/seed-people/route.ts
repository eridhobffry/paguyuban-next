import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import type { User } from "@/lib/db";
import { db } from "@/lib/db/drizzle";
import { artists } from "@/lib/db/schema";
import { eq, sql as dsql } from "drizzle-orm";

const featuredArtists = [
  {
    name: "Dewa 19",
    role: "Legendary Rock Band",
    company: "Grand Finale Performance",
    imageUrl: "/images/artists/dewa19.jpg",
  },
  {
    name: "Tulus",
    role: "Premier Vocalist",
    company: "Contemporary Indonesian Music",
    imageUrl: "/images/artists/tulus.jpg",
  },
  {
    name: "Efek Rumah Kaca",
    role: "Alternative Rock",
    company: "Environmental Music Advocates",
    imageUrl: "/images/artists/erk.jpg",
  },
  {
    name: "The Panturas",
    role: "Indie Rock",
    company: "Contemporary Youth Culture",
    imageUrl: "/images/artists/panturas.jpg",
  },
];

const businessSpeakers = [
  {
    name: "Gita Wirjawan",
    role: "Leadership Talk Moderator",
    company: "Former Minister & Investment Expert",
    image_url: "/images/speakers/gita-wirjawan.jpg",
    speaker_type: "summit",
  },
  {
    name: "Joko Anwar",
    role: "Film Director",
    company: "Digital Storytelling Summit",
    image_url: "/images/speakers/joko-anwar.jpg",
    speaker_type: "summit",
  },
  {
    name: "Rahayu Saraswati",
    role: "Policy Expert",
    company: "Creative Industry Diversity",
    image_url: "/images/speakers/rahayu-saraswati.jpg",
    speaker_type: "summit",
  },
  {
    name: "Iyas Lawrence",
    role: "Innovation Leader",
    company: "Sustainable Tech & AI",
    image_url: "/images/speakers/iyas-lawrence.jpg",
    speaker_type: "summit",
  },
];

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = verifyToken(token) as User;
    if (!decoded || !isAdmin(decoded))
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );

    // Seed artists (idempotent by name)
    for (const a of featuredArtists) {
      const existing = await db
        .select({ id: artists.id })
        .from(artists)
        .where(eq(artists.name, a.name));
      if (existing.length === 0) {
        await db.insert(artists).values({
          name: a.name,
          role: a.role,
          company: a.company,
          imageUrl: a.imageUrl,
          slug: a.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/gi, "-")
            .replace(/(^-|-$)/g, ""),
          instagram: "https://instagram.com/example",
          youtube: "https://youtube.com/@example",
          sortOrder: 100,
        });
      }
    }

    // Seed speakers using raw SQL against existing Neon schema (int id, varchar image_url)
    for (const s of businessSpeakers) {
      // Check existence by name
      const exists = await db.execute(
        dsql`SELECT 1 FROM public.speakers WHERE name = ${s.name} LIMIT 1;`
      );
      if ((exists as { rows: { length: number } }).rows?.length) continue;

      await db.execute(dsql`INSERT INTO public.speakers (name, role, company, image_url, speaker_type)
        VALUES (${s.name}, ${s.role}, ${s.company}, ${s.image_url}, ${s.speaker_type});`);
    }

    return NextResponse.json(
      { message: "Seeded artists and speakers" },
      { status: 200 }
    );
  } catch (error) {
    console.error("/api/admin/seed-people POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
