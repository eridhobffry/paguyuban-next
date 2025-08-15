import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import { User } from "@/lib/sql";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ requests: [] }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  try {
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
    // Deprecated endpoint
    return NextResponse.json({ error: "Endpoint deprecated" }, { status: 410 });
  } catch (error) {
    console.error("Update access request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
