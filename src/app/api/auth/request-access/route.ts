import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { upsertPendingUser } from "@/lib/sql";
import { notifyAdminNewAccessRequest } from "@/lib/email";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    await upsertPendingUser(email, hashedPassword);
    // Best-effort notify admin about a new pending request
    try {
      await notifyAdminNewAccessRequest(email);
    } catch {}

    return NextResponse.json(
      { message: "Access request submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Access request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
