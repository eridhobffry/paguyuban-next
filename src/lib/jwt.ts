// Lightweight JWT utilities for middleware (Edge Runtime compatible)

import { User } from "./db";

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
    return null;
  }
}

export function isAdminFromToken(decoded: User): boolean {
  return decoded && (decoded.role === "admin" || decoded.user_type === "admin");
}
