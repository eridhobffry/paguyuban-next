import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock the JWT utilities
vi.mock("@/lib/jwt", () => ({
  verifyTokenMiddleware: vi.fn(),
  isAdminFromToken: vi.fn(),
}));

import { middleware } from "@/middleware";
import { verifyTokenMiddleware, isAdminFromToken } from "@/lib/jwt";

const mockVerifyToken = verifyTokenMiddleware as any;
const mockIsAdminFromToken = isAdminFromToken as any;

describe("Middleware - Page Protection", () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockRequest = {
      nextUrl: { pathname: "/" },
      url: "http://localhost:3000/",
      cookies: { get: vi.fn() },
    };
    mockResponse = NextResponse.next();

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Public routes", () => {
    const publicRoutes = [
      "/login",
      "/request-access",
      "/api/auth/login",
      "/api/auth/request-access",
    ];

    it.each(publicRoutes)("allows access to public route: %s", (route) => {
      mockRequest.nextUrl.pathname = route;

      const result = middleware(mockRequest);

      expect(result).toEqual(mockResponse);
    });
  });

  describe("Protected routes - No token", () => {
    it("redirects to login when no auth token exists", () => {
      mockRequest.cookies.get.mockReturnValue(null);
      mockRequest.nextUrl.pathname = "/dashboard";

      const result = middleware(mockRequest);

      expect(result.status).toBe(307);
      expect(result.headers.get("location")).toBe(
        "http://localhost:3000/login"
      );
    });

    it("redirects to login for home page", () => {
      mockRequest.cookies.get.mockReturnValue(null);
      mockRequest.nextUrl.pathname = "/";

      const result = middleware(mockRequest);

      expect(result.status).toBe(307);
      expect(result.headers.get("location")).toBe(
        "http://localhost:3000/login"
      );
    });
  });

  describe("Protected routes - Invalid token", () => {
    it("redirects to login when token is invalid", () => {
      mockRequest.cookies.get.mockReturnValue({ value: "invalid-token" });
      mockVerifyToken.mockReturnValue(null);
      mockRequest.nextUrl.pathname = "/dashboard";

      const result = middleware(mockRequest);

      expect(result.status).toBe(307);
      expect(result.headers.get("location")).toBe(
        "http://localhost:3000/login"
      );
    });
  });

  describe("Protected routes - Valid token", () => {
    beforeEach(() => {
      mockRequest.cookies.get.mockReturnValue({ value: "valid-token" });
      mockVerifyToken.mockReturnValue({
        id: "user-123",
        email: "user@example.com",
        role: "member",
        status: "active",
      });
    });

    it("allows access to dashboard for authenticated user", () => {
      mockRequest.nextUrl.pathname = "/dashboard";

      const result = middleware(mockRequest);

      expect(result).toEqual(mockResponse);
    });

    it("allows access to speakers page for authenticated user", () => {
      mockRequest.nextUrl.pathname = "/speakers";

      const result = middleware(mockRequest);

      expect(result).toEqual(mockResponse);
    });

    it("allows access to artists page for authenticated user", () => {
      mockRequest.nextUrl.pathname = "/artists";

      const result = middleware(mockRequest);

      expect(result).toEqual(mockResponse);
    });
  });

  describe("Admin routes", () => {
    beforeEach(() => {
      mockRequest.cookies.get.mockReturnValue({ value: "valid-token" });
      mockVerifyToken.mockReturnValue({
        id: "user-123",
        email: "user@example.com",
        role: "member",
        status: "active",
      });
    });

    it("redirects non-admin users to dashboard", () => {
      mockRequest.nextUrl.pathname = "/admin";
      mockIsAdminFromToken.mockReturnValue(false);

      const result = middleware(mockRequest);

      expect(result.status).toBe(307);
      expect(result.headers.get("location")).toBe(
        "http://localhost:3000/dashboard"
      );
    });

    it("allows admin users to access admin routes", () => {
      mockRequest.nextUrl.pathname = "/admin";
      mockIsAdminFromToken.mockReturnValue(true);

      const result = middleware(mockRequest);

      expect(result).toEqual(mockResponse);
    });

    it("allows admin users to access admin sub-routes", () => {
      mockRequest.nextUrl.pathname = "/admin/users";
      mockIsAdminFromToken.mockReturnValue(true);

      const result = middleware(mockRequest);

      expect(result).toEqual(mockResponse);
    });
  });

  describe("Admin API routes", () => {
    beforeEach(() => {
      mockRequest.cookies.get.mockReturnValue({ value: "valid-token" });
      mockVerifyToken.mockReturnValue({
        id: "user-123",
        email: "user@example.com",
        role: "member",
        status: "active",
      });
    });

    it("returns 403 for non-admin API access", async () => {
      mockRequest.nextUrl.pathname = "/api/admin/users";
      mockIsAdminFromToken.mockReturnValue(false);

      const result = middleware(mockRequest);

      expect(result.status).toBe(403);
      const body = await result.json();
      expect(body.error).toBe("Admin access required");
    });

    it("allows admin users to access admin APIs", () => {
      mockRequest.nextUrl.pathname = "/api/admin/users";
      mockIsAdminFromToken.mockReturnValue(true);

      const result = middleware(mockRequest);

      expect(result).toEqual(mockResponse);
    });
  });

  describe("Static assets and Next.js internals", () => {
    // Note: These tests verify that the middleware correctly processes static assets
    // In the actual application, these paths are excluded by the middleware matcher,
    // but in tests we need to verify the middleware behavior when they are processed

    const staticPaths = [
      "/favicon.ico",
      "/images/logo.png",
      "/docs/brochure.pdf",
      "/videos/demo.mp4",
      "/calendar/event.ics",
    ];

    it.each(staticPaths)("processes static asset path: %s", (path) => {
      mockRequest.nextUrl.pathname = path;
      mockRequest.cookies.get.mockReturnValue(null); // No auth token

      const result = middleware(mockRequest);

      // Static assets without auth should redirect to login
      expect(result.status).toBe(307);
      expect(result.headers.get("location")).toBe(
        "http://localhost:3000/login"
      );
    });

    it("processes Next.js internal path", () => {
      mockRequest.nextUrl.pathname = "/_next/static/chunk.js";
      mockRequest.cookies.get.mockReturnValue(null); // No auth token

      const result = middleware(mockRequest);

      // Next.js internals without auth should redirect to login
      expect(result.status).toBe(307);
      expect(result.headers.get("location")).toBe(
        "http://localhost:3000/login"
      );
    });

    it("allows authenticated access to static assets", () => {
      const staticPaths = [
        "/favicon.ico",
        "/images/logo.png",
        "/docs/brochure.pdf",
        "/videos/demo.mp4",
        "/calendar/event.ics",
      ];

      staticPaths.forEach((path) => {
        mockRequest.nextUrl.pathname = path;
        mockRequest.cookies.get.mockReturnValue({ value: "valid-token" });
        mockVerifyToken.mockReturnValue({
          id: "user-123",
          email: "user@example.com",
          role: "member",
          status: "active",
        });

        const result = middleware(mockRequest);
        expect(result).toEqual(mockResponse);
      });
    });
  });
});
