import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyTokenMiddleware, isAdminFromToken } from "./lib/jwt";

// Public routes that don't require authentication
const publicRoutes = [
  "/login",
  "/request-access",
  "/api/auth/login",
  "/api/auth/request-access",
];

// Admin-only routes
const adminRoutes = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify token
  const decoded = verifyTokenMiddleware(token);
  if (!decoded) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check admin routes
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAdminFromToken(decoded)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Check admin API routes
  if (pathname.startsWith("/api/admin/")) {
    if (!isAdminFromToken(decoded)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
  }

  // Allow authenticated users to access content
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|request-access).*)",
  ],
};
