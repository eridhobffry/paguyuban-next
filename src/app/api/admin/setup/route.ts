import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import { initializeDocumentTable, User } from "@/lib/sql";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as User;
    if (!decoded || !isAdmin(decoded)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Initialize document table
    await initializeDocumentTable();

    return NextResponse.json(
      { message: "Database tables initialized successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database setup error:", error);
    return NextResponse.json(
      { error: "Failed to initialize database tables" },
      { status: 500 }
    );
  }
}
