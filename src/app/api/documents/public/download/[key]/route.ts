import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db/index";
import { and, eq } from "drizzle-orm";
import {
  KEY_TO_TYPE,
  KEY_TO_FALLBACK_FILE,
  type DownloadKey,
} from "@/lib/documents/constants";

// Mapping moved to central constants to avoid duplication

function isDownloadKey(value: string): value is DownloadKey {
  return Object.prototype.hasOwnProperty.call(KEY_TO_TYPE, value);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const key = segments[segments.length - 1] ?? "";

    // First try exact slug match for newest non-restricted
    const bySlug = await db
      .select()
      .from(schema.documents)
      .where(
        and(
          eq(schema.documents.slug, key),
          eq(schema.documents.restricted, false)
        )
      )
      .orderBy(schema.documents.updatedAt);
    const newestBySlug = bySlug.at(-1);
    const slugUrl = newestBySlug?.fileUrl || newestBySlug?.externalUrl;
    if (slugUrl) {
      return NextResponse.redirect(slugUrl, 302);
    }

    // Fallback to legacy type mapping for backwards compatibility
    if (isDownloadKey(key)) {
      const type = KEY_TO_TYPE[key];
      const rows = await db
        .select()
        .from(schema.documents)
        .where(
          and(
            eq(schema.documents.type, type),
            eq(schema.documents.restricted, false)
          )
        )
        .orderBy(schema.documents.updatedAt);
      const doc = rows.at(-1);
      const url = doc?.fileUrl || doc?.externalUrl;
      if (url) return NextResponse.redirect(url, 302);
    }

    // Fallback to static placeholder in public/docs to avoid 404
    if (isDownloadKey(key)) {
      const fallback = KEY_TO_FALLBACK_FILE[key];
      if (fallback) {
        return NextResponse.redirect(fallback, 302);
      }
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("/api/documents/public/download GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
