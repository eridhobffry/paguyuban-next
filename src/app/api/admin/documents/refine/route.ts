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
    };

    const refined = await documentAnalyzer.refineMetadata(body);
    return NextResponse.json({ refined }, { status: 200 });
  } catch (err) {
    console.error("/api/admin/documents/refine error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
