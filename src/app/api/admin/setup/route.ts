import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import { initializeDocumentTable, User, ensureSuperAdminFlag } from "@/lib/sql";
import { SUPER_ADMIN_EMAIL } from "@/lib/constants";

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

    // Ensure the configured super admin has elevated flag and admin role
    await ensureSuperAdminFlag(SUPER_ADMIN_EMAIL);

    return NextResponse.json(
      {
        message:
          "Database tables initialized successfully and super admin ensured",
      },
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
