import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import type { User } from "@/lib/sql";
import { documentAnalyzer } from "@/lib/document-analyzer";

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

    const body = (await request.json()) as {
      title: string;
      description: string;
      preview: string;
      pages?: string;
      type?: string;
      icon?: string;
      fileUrl?: string | null;
    };

    // Try to include file text when the file is text/* for better refinement
    let refined = await documentAnalyzer.refineMetadata(body);
    if (body.fileUrl) {
      try {
        const res = await fetch(body.fileUrl);
        const ct = res.headers.get("content-type") || "";
        if (ct.startsWith("text/")) {
          const text = await res.text();
          refined = await documentAnalyzer.refineMetadata({
            ...body,
            // pack some of the content into preview field to give more context
            preview: `${body.preview}\n\nCONTENT:\n${text.substring(0, 4000)}`,
          });
        }
      } catch {}
    }
    return NextResponse.json({ refined }, { status: 200 });
  } catch (err) {
    console.error("/api/admin/documents/refine error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
