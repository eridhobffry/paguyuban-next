import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import type { User } from "@/lib/sql";
import { db, schema } from "@/lib/db";
import { isNull, eq } from "drizzle-orm";
import { TYPE_TO_KEY } from "@/lib/documents/constants";

function slugifyTitle(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as User | null;
    if (!decoded || !isAdmin(decoded))
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );

    const missing = await db
      .select()
      .from(schema.documents)
      .where(isNull(schema.documents.slug));

    if (missing.length === 0) {
      return NextResponse.json(
        { updated: 0, message: "No documents without slug" },
        { status: 200 }
      );
    }

    let updated = 0;
    const results: Array<{ id: string; assigned: string }> = [];

    for (const doc of missing) {
      const byType = TYPE_TO_KEY[doc.type];
      const candidate = byType || slugifyTitle(doc.title);
      const [res] = await db
        .update(schema.documents)
        .set({ slug: candidate, updatedAt: new Date() })
        .where(eq(schema.documents.id, doc.id))
        .returning({ id: schema.documents.id });
      if (res) {
        updated += 1;
        results.push({ id: res.id, assigned: candidate });
      }
    }

    return NextResponse.json({ updated, results }, { status: 200 });
  } catch (err) {
    console.error("backfill-slugs error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
