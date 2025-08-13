import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import { isSuperAdminFromToken } from "@/lib/jwt";
import {
  getAllUsers,
  deleteUser,
  promoteUserToAdmin,
  demoteUserToMember,
  approveUser,
  rejectUser,
  disableUser,
  User,
  type UserStatus,
} from "@/lib/sql";

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

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const users = await getAllUsers(
      statusParam ? (statusParam as UserStatus) : undefined
    );

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Get users error:", error);
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

    const { email, action } = await request.json();

    if (
      !email ||
      !action ||
      ![
        "approve",
        "reject",
        "disable",
        "enable",
        "delete",
        "promote",
        "demote",
      ].includes(action)
    ) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    // Only Super Admin may change roles
    if (
      (action === "promote" || action === "demote") &&
      !isSuperAdminFromToken(decoded)
    ) {
      return NextResponse.json(
        { error: "Only Super Admin may change roles" },
        { status: 403 }
      );
    }

    // Prevent modifying Super Admin account by anyone
    if (
      email === decoded.email &&
      isSuperAdminFromToken(decoded) &&
      action !== "enable"
    ) {
      return NextResponse.json(
        { error: "Cannot modify Super Admin account via this endpoint" },
        { status: 403 }
      );
    }

    let success = false;
    if (action === "approve" || action === "enable") {
      success = await approveUser(email, decoded.email);
    } else if (action === "reject") {
      success = await rejectUser(email, decoded.email);
    } else if (action === "disable") {
      success = await disableUser(email, decoded.email);
    } else if (action === "promote") {
      success = await promoteUserToAdmin(email);
    } else if (action === "demote") {
      // Prevent demoting self
      if (email === decoded.email) {
        return NextResponse.json(
          { error: "Cannot demote yourself" },
          { status: 403 }
        );
      }
      success = await demoteUserToMember(email);
    } else {
      success = await deleteUser(email);
    }

    if (!success) {
      return NextResponse.json(
        { error: "User not found or operation failed" },
        { status: 404 }
      );
    }

    let message = "User updated successfully";
    if (action === "approve" || action === "enable") {
      message = "User approved/activated";
    } else if (action === "reject") {
      message = "User rejected";
    } else if (action === "disable") {
      message = "User disabled";
    } else if (action === "promote") {
      message = "User promoted to admin";
    } else if (action === "demote") {
      message = "User demoted to member";
    } else {
      message = "User deleted successfully";
    }

    return NextResponse.json({ message }, { status: 200 });
  } catch (error) {
    console.error("Update user access error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
