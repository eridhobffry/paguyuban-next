import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import { isSuperAdminFromToken } from "@/lib/jwt";
import {
  getAllUsers,
  revokeUserAccess,
  restoreUserAccess,
  deleteUser,
  promoteUserToAdmin,
  demoteUserToMember,
  User,
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

    const users = await getAllUsers();

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
      !["revoke", "restore", "delete", "promote", "demote"].includes(action)
    ) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    // Prevent modifying Super Admin account by anyone
    if (email && isSuperAdminFromToken(decoded)) {
      // Super Admin may modify others, but prevent self-delete/revoke via this endpoint
      if (decoded.email === email && action !== "restore") {
        return NextResponse.json(
          { error: "Cannot modify Super Admin account via this endpoint" },
          { status: 403 }
        );
      }
    }

    let success = false;
    if (action === "revoke") {
      success = await revokeUserAccess(email);
    } else if (action === "restore") {
      success = await restoreUserAccess(email);
    } else if (action === "promote") {
      success = await promoteUserToAdmin(email);
    } else if (action === "demote") {
      // Prevent demoting Super Admin or demoting self if Super Admin
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
    if (action === "revoke") {
      message = "User access revoked successfully";
    } else if (action === "restore") {
      message = "User access restored successfully";
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
