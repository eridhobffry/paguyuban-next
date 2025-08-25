import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock all dependencies
vi.mock("@/lib/auth", () => ({
  hashPassword: vi.fn(async (p: string) => `hashed:${p}`),
  authenticateUser: vi.fn(),
  createToken: vi.fn(() => "mock-jwt-token"),
}));

vi.mock("@/lib/jwt", () => ({
  verifyTokenMiddleware: vi.fn(),
  isAdminFromToken: vi.fn(),
}));

vi.mock("@/lib/sql", () => ({
  upsertPendingUser: vi.fn(),
  ensureUsersSingleTableModel: vi.fn(),
  getUserByEmail: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  notifyAdminNewAccessRequest: vi.fn(),
}));

import { middleware } from "@/middleware";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as requestAccessHandler } from "@/app/api/auth/request-access/route";
import { authenticateUser, createToken } from "@/lib/auth";
import { verifyTokenMiddleware, isAdminFromToken } from "@/lib/jwt";
import {
  upsertPendingUser,
  ensureUsersSingleTableModel,
  getUserByEmail,
} from "@/lib/sql";
import { notifyAdminNewAccessRequest } from "@/lib/email";

const mockAuthenticateUser = authenticateUser as any;
const mockCreateToken = createToken as any;
const mockVerifyToken = verifyTokenMiddleware as any;
const mockIsAdminFromToken = isAdminFromToken as any;
const mockUpsertPendingUser = upsertPendingUser as any;
const mockEnsureUsersSingleTableModel = ensureUsersSingleTableModel as any;
const mockGetUserByEmail = getUserByEmail as any;
const mockNotifyAdminNewAccessRequest = notifyAdminNewAccessRequest as any;

describe("Complete Authentication Flow Integration", () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      json: vi.fn(),
      cookies: {
        get: vi.fn(),
        set: vi.fn(),
      },
      nextUrl: { pathname: "/" },
      url: "http://localhost:3000/",
    };

    mockResponse = NextResponse.next();

    // Setup default mocks
    mockEnsureUsersSingleTableModel.mockResolvedValue(undefined);
    mockUpsertPendingUser.mockResolvedValue(undefined);
    mockNotifyAdminNewAccessRequest.mockResolvedValue(undefined);
    mockGetUserByEmail.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Complete User Registration and Login Flow", () => {
    it("handles the complete flow: register -> middleware blocks -> login -> middleware allows", async () => {
      const testUser = {
        email: "newuser@example.com",
        password: "securePassword123",
      };

      // Step 1: User tries to access protected page without authentication
      mockRequest.nextUrl.pathname = "/dashboard";
      mockRequest.cookies.get.mockReturnValue(null); // No auth token

      let result = middleware(mockRequest);
      expect(result.status).toBe(307);
      expect(result.headers.get("location")).toBe(
        "http://localhost:3000/login"
      );

      // Step 2: User registers for access
      mockRequest.json.mockResolvedValue(testUser);
      const registerResponse = await requestAccessHandler(mockRequest);
      expect(registerResponse.status).toBe(201);

      // Verify database setup was called during registration
      expect(mockEnsureUsersSingleTableModel).toHaveBeenCalled();

      // Step 3: User tries to login (but user is still pending, so login should fail)
      mockRequest.json.mockResolvedValue(testUser);
      mockAuthenticateUser.mockResolvedValue(null); // User not found or not active

      const loginResponse = await loginHandler(mockRequest);
      const loginResult = await loginResponse.json();

      expect(loginResponse.status).toBe(401);
      expect(loginResult.error).toBe("Invalid email or password");

      // Step 4: Admin approves user (simulate by making user active)
      const activeUser = {
        id: "user-123",
        email: testUser.email,
        role: "member",
        status: "active",
      };

      mockGetUserByEmail.mockResolvedValue(activeUser);
      mockAuthenticateUser.mockResolvedValue(activeUser);
      mockCreateToken.mockReturnValue("valid-jwt-token");

      // Step 5: User tries to login again with approved account
      mockRequest.json.mockResolvedValue(testUser);
      const successfulLoginResponse = await loginHandler(mockRequest);
      const successfulLoginResult = await successfulLoginResponse.json();

      expect(successfulLoginResponse.status).toBe(200);
      expect(successfulLoginResult.message).toBe("Login successful");

      // Verify JWT token was created
      expect(mockCreateToken).toHaveBeenCalledWith(activeUser);

      // Step 6: User tries to access protected page with valid token
      mockRequest.nextUrl.pathname = "/dashboard";
      mockRequest.cookies.get.mockReturnValue({ value: "valid-jwt-token" });
      mockVerifyToken.mockReturnValue(activeUser);

      result = middleware(mockRequest);
      expect(result).toEqual(mockResponse); // Should allow access

      // Step 7: User tries to access admin page (should be redirected)
      mockRequest.nextUrl.pathname = "/admin";
      mockIsAdminFromToken.mockReturnValue(false);

      result = middleware(mockRequest);
      expect(result.status).toBe(307);
      expect(result.headers.get("location")).toBe(
        "http://localhost:3000/dashboard"
      );
    });
  });

  describe("Admin User Flow", () => {
    it("handles admin user registration and admin access", async () => {
      const adminUser = {
        email: "admin@example.com",
        password: "adminPassword123",
      };

      // Step 1: Admin registers
      mockRequest.json.mockResolvedValue(adminUser);
      const registerResponse = await requestAccessHandler(mockRequest);
      expect(registerResponse.status).toBe(201);

      // Step 2: Admin is approved and becomes active admin
      const activeAdminUser = {
        id: "admin-123",
        email: adminUser.email,
        role: "admin",
        status: "active",
      };

      mockGetUserByEmail.mockResolvedValue(activeAdminUser);
      mockAuthenticateUser.mockResolvedValue(activeAdminUser);
      mockCreateToken.mockReturnValue("admin-jwt-token");

      // Step 3: Admin logs in
      mockRequest.json.mockResolvedValue(adminUser);
      const loginResponse = await loginHandler(mockRequest);
      const loginResult = await loginResponse.json();

      expect(loginResponse.status).toBe(200);
      expect(loginResult.message).toBe("Login successful");

      // Step 4: Admin accesses admin pages
      mockRequest.nextUrl.pathname = "/admin/users";
      mockRequest.cookies.get.mockReturnValue({ value: "admin-jwt-token" });
      mockVerifyToken.mockReturnValue(activeAdminUser);
      mockIsAdminFromToken.mockReturnValue(true);

      const result = middleware(mockRequest);
      expect(result).toEqual(mockResponse); // Should allow admin access

      // Step 5: Admin accesses admin API
      mockRequest.nextUrl.pathname = "/api/admin/users";

      const apiResult = middleware(mockRequest);
      expect(apiResult).toEqual(mockResponse); // Should allow admin API access
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("handles database setup failures gracefully", async () => {
      mockEnsureUsersSingleTableModel.mockRejectedValue(
        new Error("Database unavailable")
      );

      // Try to register
      mockRequest.json.mockResolvedValue({
        email: "test@example.com",
        password: "password123",
      });

      const response = await requestAccessHandler(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe("Internal server error");
    });

    it("handles expired tokens correctly", async () => {
      mockRequest.nextUrl.pathname = "/dashboard";
      mockRequest.cookies.get.mockReturnValue({ value: "expired-token" });
      mockVerifyToken.mockReturnValue(null); // Token verification fails

      const result = middleware(mockRequest);

      expect(result.status).toBe(307);
      expect(result.headers.get("location")).toBe(
        "http://localhost:3000/login"
      );
    });

    it("handles malformed requests", async () => {
      // Test login with malformed JSON
      mockRequest.json.mockRejectedValue(new Error("Invalid JSON"));

      const response = await loginHandler(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe("Internal server error");
    });

    it("prevents access to non-existent routes with authentication", async () => {
      const validUser = {
        id: "user-123",
        email: "user@example.com",
        role: "member",
        status: "active",
      };

      mockRequest.nextUrl.pathname = "/non-existent-page";
      mockRequest.cookies.get.mockReturnValue({ value: "valid-token" });
      mockVerifyToken.mockReturnValue(validUser);

      const result = middleware(mockRequest);
      expect(result).toEqual(mockResponse); // Should allow (middleware doesn't validate route existence)
    });
  });

  describe("Security Edge Cases", () => {
    it("blocks access with tampered cookies", async () => {
      mockRequest.nextUrl.pathname = "/dashboard";
      mockRequest.cookies.get.mockReturnValue({ value: "tampered-token" });
      mockVerifyToken.mockReturnValue(null); // Token verification fails

      const result = middleware(mockRequest);

      expect(result.status).toBe(307);
      expect(result.headers.get("location")).toBe(
        "http://localhost:3000/login"
      );
    });

    it("blocks admin access with regular user token", async () => {
      const regularUser = {
        id: "user-123",
        email: "user@example.com",
        role: "member",
        status: "active",
      };

      mockRequest.nextUrl.pathname = "/admin";
      mockRequest.cookies.get.mockReturnValue({ value: "regular-user-token" });
      mockVerifyToken.mockReturnValue(regularUser);
      mockIsAdminFromToken.mockReturnValue(false);

      const result = middleware(mockRequest);

      expect(result.status).toBe(307);
      expect(result.headers.get("location")).toBe(
        "http://localhost:3000/dashboard"
      );
    });

    it("handles multiple concurrent authentication attempts", async () => {
      // Simulate multiple concurrent requests
      const promises = [];

      for (let i = 0; i < 5; i++) {
        const request = {
          json: vi.fn().mockResolvedValue({
            email: `user${i}@example.com`,
            password: "password123",
          }),
          cookies: { get: vi.fn(), set: vi.fn() },
        };

        promises.push(requestAccessHandler(request));
      }

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => {
        expect(result.status).toBe(201);
      });

      // Database setup should be called for each request
      expect(mockEnsureUsersSingleTableModel).toHaveBeenCalledTimes(5);
    });
  });
});
