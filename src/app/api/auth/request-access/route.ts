import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { createAccessRequest, getAccessRequestByEmail } from "@/lib/sql";
import { sendEmailBrevo } from "@/lib/email";
import { SUPER_ADMIN_EMAIL } from "@/lib/constants";

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
      const client = await (await import("@/lib/sql")).pool.connect();
      try {
        await client.query(
          "UPDATE access_requests SET password_hash = $1, status = 'pending', requested_at = CURRENT_TIMESTAMP WHERE email = $2",
          [hashedPassword, email]
        );
        // Notify admin about updated access request (best-effort)
        await sendEmailBrevo({
          to: SUPER_ADMIN_EMAIL,
          subject: "Access request updated and re-submitted",
          html: `<p>An existing access request was updated and re-submitted.</p><p><strong>Email:</strong> ${email}</p>`,
          text: `Access request updated and re-submitted for ${email}`,
        });
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

    // Notify admin about new access request (best-effort)
    await sendEmailBrevo({
      to: SUPER_ADMIN_EMAIL,
      subject: "New access request submitted",
      html: `<p>A new access request was submitted.</p><p><strong>Email:</strong> ${email}</p>`,
      text: `New access request submitted for ${email}`,
    });

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
