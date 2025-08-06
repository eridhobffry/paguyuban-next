import { NextRequest, NextResponse } from "next/server";
import { getAllDocuments } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get all documents for authenticated users (site users can see all documents)
    // but external access is still controlled by the document's restricted flag
    const documents = await getAllDocuments();

    // Transform the data to match the frontend interface
    const transformedDocuments = documents.map((doc) => ({
      title: doc.title,
      description: doc.description,
      preview: doc.preview,
      pages: doc.pages,
      type: doc.type,
      icon: doc.icon,
      restricted: doc.restricted,
      file_url: doc.file_url,
      external_url: doc.external_url,
      ai_generated: doc.ai_generated,
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
