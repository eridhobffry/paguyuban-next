import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db/drizzle";
import { speakers } from "@/lib/db/schema";
import { z } from "zod";
import {
  speakerAdminCreateSchema,
  speakerAdminUpdateSchema,
} from "@/types/validation";
import type { User } from "@/lib/db";
import { asc, eq } from "drizzle-orm";

const CreateSchema = z.object({ speaker: speakerAdminCreateSchema });
const UpdateSchema = speakerAdminUpdateSchema;
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

    const data = await db.select().from(speakers).orderBy(asc(speakers.name));
    return NextResponse.json({ speakers: data }, { status: 200 });
  } catch (error) {
    console.error("/api/admin/speakers GET error:", error);
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

    const [created] = await db
      .insert(speakers)
      .values({
        name: parsed.data.speaker.name,
        role: parsed.data.speaker.role ?? null,
        company: parsed.data.speaker.company ?? null,
        imageUrl: parsed.data.speaker.imageUrl ?? null,
        bio: parsed.data.speaker.bio ?? null,
        tags: parsed.data.speaker.tags ?? null,
        slug: parsed.data.speaker.slug ?? null,
        twitter: parsed.data.speaker.twitter ?? null,
        linkedin: parsed.data.speaker.linkedin ?? null,
        website: parsed.data.speaker.website ?? null,
        speakerType: parsed.data.speaker.speakerType ?? null,
        sortOrder: parsed.data.speaker.sortOrder ?? null,
      })
      .returning();

    return NextResponse.json({ speaker: created }, { status: 201 });
  } catch (error) {
    console.error("/api/admin/speakers POST error:", error);
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

    const [updated] = await db
      .update(speakers)
      .set({
        ...parsed.data.speaker,
      })
      .where(eq(speakers.id, parsed.data.id))
      .returning();

    return NextResponse.json({ speaker: updated }, { status: 200 });
  } catch (error) {
    console.error("/api/admin/speakers PUT error:", error);
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
      .delete(speakers)
      .where(eq(speakers.id, parsed.data.id))
      .returning();
    return NextResponse.json({ speaker: deletedRow }, { status: 200 });
  } catch (error) {
    console.error("/api/admin/speakers DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
