import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db/index";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    // Show both public and restricted docs on the homepage. For restricted docs,
    // mask file/external URLs; the UI shows a lock and uses a mailto request.
    const documents = await db
      .select()
      .from(schema.documents)
      .orderBy(desc(schema.documents.createdAt));

    // Transform the data to match the frontend interface
    const transformedDocuments = documents.map((doc) => ({
      title: doc.title,
      description: doc.description,
      preview: doc.preview,
      pages: doc.pages,
      type: doc.type,
      icon: doc.icon,
      restricted: doc.restricted,
      file_url: doc.restricted ? undefined : doc.fileUrl ?? undefined,
      external_url: doc.restricted ? undefined : doc.externalUrl ?? undefined,
      ai_generated: doc.aiGenerated,
      id: doc.id,
      marketing_highlights: doc.marketingHighlights ?? undefined,
    }));

    return NextResponse.json(
      { documents: transformedDocuments },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Get public documents error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
