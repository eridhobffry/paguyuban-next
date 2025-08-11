// Lightweight JWT utilities for middleware (Edge Runtime compatible)

import { User } from "./sql";

// Simple JWT decode without verification for middleware (Edge Runtime limitation)
export function verifyTokenMiddleware(token: string) {
  try {
    // Simply decode the JWT payload without verification for Edge Runtime
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));

    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}

export function isAdminFromToken(decoded: User): boolean {
  return decoded && (decoded.role === "admin" || decoded.user_type === "admin");
}

export function isSuperAdminFromToken(decoded: User): boolean {
  return (
    !!decoded &&
    typeof decoded.email === "string" &&
    decoded.email.length > 0 &&
    decoded.email ===
      (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "eridhobffry@gmail.com")
  );
}
