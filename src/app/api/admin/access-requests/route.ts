import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import {
  getAccessRequests,
  updateAccessRequestStatus,
  createUser,
  User,
} from "@/lib/sql";
import { sendEmailBrevo } from "@/lib/email";

export async function GET(request: NextRequest) {
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

    const requests = await getAccessRequests();

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error("Get access requests error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const { id, action } = await request.json();

    if (!id || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    const status = action === "approve" ? "approved" : "rejected";

    // Update the access request
    const updatedRequest = await updateAccessRequestStatus(
      id,
      status,
      decoded.email
    );

    // If approved, create the user account
    if (status === "approved") {
      try {
        await createUser(
          updatedRequest.email,
          updatedRequest.password_hash,
          "user"
        );
      } catch (error) {
        // User might already exist, that's okay
        if (
          error instanceof Error &&
          !error.message.includes("duplicate key")
        ) {
          console.error("Error creating user:", error);
        }
      }
    }

    // Notify requester about decision (best-effort)
    await sendEmailBrevo({
      to: updatedRequest.email,
      subject:
        status === "approved"
          ? "Your access request has been approved"
          : "Your access request has been rejected",
      html:
        status === "approved"
          ? `<p>Your access request has been approved. You can now log in using your email and the password you provided during the request.</p>`
          : `<p>Your access request has been rejected. If you believe this is an error, please reply to this email.</p>`,
      text:
        status === "approved"
          ? "Your access request has been approved. You can now log in."
          : "Your access request has been rejected.",
    });

    return NextResponse.json(
      {
        message: `Request ${status} successfully`,
        request: updatedRequest,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update access request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
