import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { createAccessRequest, getAccessRequestByEmail } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if email already has a pending request
    const existingRequest = await getAccessRequestByEmail(email);
    if (existingRequest && existingRequest.status === "pending") {
      return NextResponse.json(
        {
          error:
            "A pending access request already exists for this email. Please wait for admin approval.",
        },
        { status: 409 }
      );
    }

    // If there's an old request (approved/rejected), update it with new password
    if (existingRequest) {
      const hashedPassword = await hashPassword(password);
      const client = await (await import("@/lib/db")).pool.connect();
      try {
        await client.query(
          "UPDATE access_requests SET password_hash = $1, status = 'pending', requested_at = CURRENT_TIMESTAMP WHERE email = $2",
          [hashedPassword, email]
        );
        return NextResponse.json(
          { message: "Access request updated and submitted for approval" },
          { status: 201 }
        );
      } finally {
        client.release();
      }
    }

    const hashedPassword = await hashPassword(password);
    await createAccessRequest(email, hashedPassword);

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
