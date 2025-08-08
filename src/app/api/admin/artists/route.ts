import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db/drizzle";
import { artists } from "@/lib/db/schema";
import { z } from "zod";
import type { User } from "@/lib/db";
import { eq } from "drizzle-orm";

const ArtistBaseSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  bio: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  // slug optional; if missing or blank we auto-generate from name
  slug: z.string().optional().nullable(),
  instagram: z.string().url({ message: "Instagram URL is required" }),
  youtube: z.string().url({ message: "YouTube URL is required" }),
  twitter: z.string().url().optional().nullable(),
  linkedin: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  sortOrder: z.coerce.number().optional().nullable(),
});

const CreateSchema = z.object({ artist: ArtistBaseSchema });
const UpdateSchema = z.object({
  id: z.string().uuid(),
  artist: ArtistBaseSchema.partial(),
});
const DeleteSchema = z.object({ id: z.string().uuid() });

export async function GET(request: NextRequest) {
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

    const data = await db.select().from(artists).orderBy(artists.sortOrder);
    return NextResponse.json({ artists: data }, { status: 200 });
  } catch (error) {
    console.error("/api/admin/artists GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.format() },
        { status: 400 }
      );

    const nameForSlug = parsed.data.artist.name.trim();
    const slugInput = (parsed.data.artist.slug ?? "").trim();
    const finalSlug = slugInput.length
      ? slugInput
      : nameForSlug
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

    const [created] = await db
      .insert(artists)
      .values({
        name: parsed.data.artist.name,
        role: parsed.data.artist.role ?? null,
        company: parsed.data.artist.company ?? null,
        imageUrl: parsed.data.artist.imageUrl ?? null,
        bio: parsed.data.artist.bio ?? null,
        tags: parsed.data.artist.tags ?? null,
        slug: finalSlug || null,
        instagram: parsed.data.artist.instagram,
        youtube: parsed.data.artist.youtube,
        twitter: parsed.data.artist.twitter ?? null,
        linkedin: parsed.data.artist.linkedin ?? null,
        website: parsed.data.artist.website ?? null,
        sortOrder: parsed.data.artist.sortOrder ?? null,
      })
      .returning();

    return NextResponse.json({ artist: created }, { status: 201 });
  } catch (error) {
    console.error("/api/admin/artists POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.format() },
        { status: 400 }
      );

    const slugPatch = (() => {
      if (parsed.data.artist.slug === undefined)
        return {} as { slug?: string | null };
      const s = (parsed.data.artist.slug ?? "").trim();
      if (s.length === 0 && parsed.data.artist.name) {
        const base = parsed.data.artist.name
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        return { slug: base };
      }
      return { slug: s };
    })();

    const [updated] = await db
      .update(artists)
      .set({
        ...parsed.data.artist,
        ...slugPatch,
      })
      .where(eq(artists.id, parsed.data.id))
      .returning();

    return NextResponse.json({ artist: updated }, { status: 200 });
  } catch (error) {
    console.error("/api/admin/artists PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const parsed = DeleteSchema.safeParse({ id });
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.format() },
        { status: 400 }
      );

    const [deletedRow] = await db
      .delete(artists)
      .where(eq(artists.id, parsed.data.id))
      .returning();
    return NextResponse.json({ artist: deletedRow }, { status: 200 });
  } catch (error) {
    console.error("/api/admin/artists DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
