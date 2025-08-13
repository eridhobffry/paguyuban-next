import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import {
  getAccessRequests,
  updateAccessRequestStatus,
  createOrEnsureUser,
  deleteAccessRequestById,
  User,
} from "@/lib/sql";
import { notifyRequesterDecision } from "@/lib/email";
export const runtime = "nodejs";

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

    if (!id || !action || !["approve", "reject", "delete"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    if (action === "delete") {
      const ok = await deleteAccessRequestById(id);
      if (!ok) {
        return NextResponse.json(
          { error: "Request not found or delete failed" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { message: "Request deleted successfully" },
        { status: 200 }
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
        await createOrEnsureUser(
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
    await notifyRequesterDecision(updatedRequest.email, status);

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
