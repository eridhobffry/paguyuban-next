import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/index";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const documents = await db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.restricted, false))
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
      file_url: doc.fileUrl ?? undefined,
      external_url: doc.externalUrl ?? undefined,
      ai_generated: doc.aiGenerated,
      id: doc.id,
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
