import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db/drizzle";
import { sponsors } from "@/lib/db/schema";
import { z } from "zod";
import {
  sponsorAdminCreateSchema,
  sponsorAdminUpdateSchema,
} from "@/types/validation";
import type { User } from "@/lib/sql";
import { asc, eq } from "drizzle-orm";
import { deleteBlobIfUnreferenced } from "@/lib/blob-utils";

const CreateSchema = z.object({ sponsor: sponsorAdminCreateSchema });
const UpdateSchema = sponsorAdminUpdateSchema;
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

    const data = await db.select().from(sponsors).orderBy(asc(sponsors.name));
    return NextResponse.json({ sponsors: data }, { status: 200 });
  } catch (error) {
    console.error("/api/admin/sponsors GET error:", error);
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
      .insert(sponsors)
      .values({
        name: parsed.data.sponsor.name,
        url: parsed.data.sponsor.url ?? null,
        logoUrl: parsed.data.sponsor.logoUrl ?? null,
        slug: parsed.data.sponsor.slug ?? null,
        tierId: parsed.data.sponsor.tierId ?? null,
        tags: parsed.data.sponsor.tags ?? null,
        sortOrder: parsed.data.sponsor.sortOrder ?? null,
      })
      .returning();

    return NextResponse.json({ sponsor: created }, { status: 201 });
  } catch (error) {
    console.error("/api/admin/sponsors POST error:", error);
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

    // fetch old for potential cleanup
    const oldRow = await db
      .select()
      .from(sponsors)
      .where(eq(sponsors.id, parsed.data.id));
    const oldUrl = oldRow?.[0]?.logoUrl ?? null;

    const [updated] = await db
      .update(sponsors)
      .set({
        ...parsed.data.sponsor,
      })
      .where(eq(sponsors.id, parsed.data.id))
      .returning();

    const newUrl = updated?.logoUrl ?? null;
    if (oldUrl && oldUrl !== newUrl) {
      await deleteBlobIfUnreferenced(oldUrl);
    }

    return NextResponse.json({ sponsor: updated }, { status: 200 });
  } catch (error) {
    console.error("/api/admin/sponsors PUT error:", error);
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
      .delete(sponsors)
      .where(eq(sponsors.id, parsed.data.id))
      .returning();

    const logoUrl = deletedRow?.logoUrl as string | null | undefined;
    if (logoUrl) await deleteBlobIfUnreferenced(logoUrl);

    return NextResponse.json({ sponsor: deletedRow }, { status: 200 });
  } catch (error) {
    console.error("/api/admin/sponsors DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
