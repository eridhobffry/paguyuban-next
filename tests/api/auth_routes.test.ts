import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock NextResponse
vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn(),
  },
}));

// Mock the database and auth functions
vi.mock("@/lib/auth", () => ({
  hashPassword: vi.fn(async (p: string) => `hashed:${p}`),
  authenticateUser: vi.fn(),
  createToken: vi.fn(() => "mock-jwt-token"),
}));

vi.mock("@/lib/sql", () => ({
  upsertPendingUser: vi.fn(),
  ensureUsersSingleTableModel: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  notifyAdminNewAccessRequest: vi.fn(),
}));

import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as requestAccessHandler } from "@/app/api/auth/request-access/route";
import { hashPassword, authenticateUser, createToken } from "@/lib/auth";
import { upsertPendingUser, ensureUsersSingleTableModel } from "@/lib/sql";
import { notifyAdminNewAccessRequest } from "@/lib/email";

const mockHashPassword = hashPassword as any;
const mockAuthenticateUser = authenticateUser as any;
const mockCreateToken = createToken as any;
const mockUpsertPendingUser = upsertPendingUser as any;
const mockEnsureUsersSingleTableModel = ensureUsersSingleTableModel as any;
const mockNotifyAdminNewAccessRequest = notifyAdminNewAccessRequest as any;

describe("Authentication Routes", () => {
  let mockRequest: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      json: vi.fn(),
      cookies: {
        get: vi.fn(),
        set: vi.fn(),
      },
    };

    // Mock NextResponse response
    const { NextResponse } = require("next/server");
    (NextResponse.json as any).mockImplementation(
      (data: any, options: any) => ({
        status: options?.status || 200,
        json: async () => data,
        cookies: {
          set: vi.fn(),
        },
      })
    );

    // Setup default mocks
    mockEnsureUsersSingleTableModel.mockResolvedValue(undefined);
    mockHashPassword.mockResolvedValue("hashed:password123");
    mockUpsertPendingUser.mockResolvedValue(undefined);
    mockNotifyAdminNewAccessRequest.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("/api/auth/request-access", () => {
    it("returns 400 when email is missing", async () => {
      mockRequest.json.mockResolvedValue({ password: "password123" });

      const response = await requestAccessHandler(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe("Email and password are required");
    });

    it("returns 400 when password is missing", async () => {
      mockRequest.json.mockResolvedValue({ email: "test@example.com" });

      const response = await requestAccessHandler(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe("Email and password are required");
    });

    it("returns 400 when both email and password are missing", async () => {
      mockRequest.json.mockResolvedValue({});

      const response = await requestAccessHandler(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe("Email and password are required");
    });

    it("successfully creates access request with valid credentials", async () => {
      mockRequest.json.mockResolvedValue({
        email: "test@example.com",
        password: "password123",
      });

      const response = await requestAccessHandler(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.message).toBe("Access request submitted successfully");

      // Verify database setup was called
      expect(mockEnsureUsersSingleTableModel).toHaveBeenCalled();

      // Verify password was hashed
      expect(mockHashPassword).toHaveBeenCalledWith("password123");

      // Verify user was upserted
      expect(mockUpsertPendingUser).toHaveBeenCalledWith(
        "test@example.com",
        "hashed:password123"
      );

      // Verify admin notification was attempted
      expect(mockNotifyAdminNewAccessRequest).toHaveBeenCalledWith(
        "test@example.com"
      );
    });

    it("handles email notification failures gracefully", async () => {
      mockRequest.json.mockResolvedValue({
        email: "test@example.com",
        password: "password123",
      });
      mockNotifyAdminNewAccessRequest.mockRejectedValue(
        new Error("Email failed")
      );

      const response = await requestAccessHandler(mockRequest);
      const result = await response.json();

      // Should still succeed even if email fails
      expect(response.status).toBe(201);
      expect(result.message).toBe("Access request submitted successfully");
    });

    it("returns 500 when database setup fails", async () => {
      mockRequest.json.mockResolvedValue({
        email: "test@example.com",
        password: "password123",
      });
      mockEnsureUsersSingleTableModel.mockRejectedValue(
        new Error("Database error")
      );

      const response = await requestAccessHandler(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe("Internal server error");
    });

    it("returns 500 when user upsert fails", async () => {
      mockRequest.json.mockResolvedValue({
        email: "test@example.com",
        password: "password123",
      });
      mockUpsertPendingUser.mockRejectedValue(
        new Error("User creation failed")
      );

      const response = await requestAccessHandler(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe("Internal server error");
    });

    it("handles password hashing errors", async () => {
      mockRequest.json.mockResolvedValue({
        email: "test@example.com",
        password: "password123",
      });
      mockHashPassword.mockRejectedValue(new Error("Hashing failed"));

      const response = await requestAccessHandler(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe("Internal server error");
    });
  });

  describe("/api/auth/login", () => {
    it("returns 400 when email is missing", async () => {
      mockRequest.json.mockResolvedValue({ password: "password123" });

      const response = await loginHandler(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe("Email and password are required");
    });

    it("returns 400 when password is missing", async () => {
      mockRequest.json.mockResolvedValue({ email: "test@example.com" });

      const response = await loginHandler(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe("Email and password are required");
    });

    it("returns 401 for invalid credentials", async () => {
      mockRequest.json.mockResolvedValue({
        email: "test@example.com",
        password: "wrongpassword",
      });
      mockAuthenticateUser.mockResolvedValue(null);

      const response = await loginHandler(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe("Invalid email or password");

      // Verify database setup was called
      expect(mockEnsureUsersSingleTableModel).toHaveBeenCalled();
    });

    it("returns 401 for non-existent user", async () => {
      mockRequest.json.mockResolvedValue({
        email: "nonexistent@example.com",
        password: "password123",
      });
      mockAuthenticateUser.mockResolvedValue(null);

      const response = await loginHandler(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe("Invalid email or password");
    });

    it("successfully logs in valid user", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        role: "member",
        status: "active",
      };

      mockRequest.json.mockResolvedValue({
        email: "test@example.com",
        password: "password123",
      });
      mockAuthenticateUser.mockResolvedValue(mockUser);
      mockCreateToken.mockReturnValue("jwt-token-123");

      const response = await loginHandler(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.message).toBe("Login successful");
      expect(result.user).toEqual({
        id: "user-123",
        email: "test@example.com",
        role: "member",
      });

      // Verify JWT token was created
      expect(mockCreateToken).toHaveBeenCalledWith(mockUser);

      // Verify database setup was called
      expect(mockEnsureUsersSingleTableModel).toHaveBeenCalled();

      // Verify authentication was attempted
      expect(mockAuthenticateUser).toHaveBeenCalledWith(
        "test@example.com",
        "password123"
      );

      // Verify token creation
      expect(mockCreateToken).toHaveBeenCalledWith(mockUser);
    });

    it("returns 500 when database setup fails", async () => {
      mockRequest.json.mockResolvedValue({
        email: "test@example.com",
        password: "password123",
      });
      mockEnsureUsersSingleTableModel.mockRejectedValue(
        new Error("Database error")
      );

      const response = await loginHandler(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe("Internal server error");
    });

    it("returns 500 when authentication fails", async () => {
      mockRequest.json.mockResolvedValue({
        email: "test@example.com",
        password: "password123",
      });
      mockAuthenticateUser.mockRejectedValue(new Error("Auth error"));

      const response = await loginHandler(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe("Internal server error");
    });

    it("returns 500 when token creation fails", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        role: "member",
        status: "active",
      };

      mockRequest.json.mockResolvedValue({
        email: "test@example.com",
        password: "password123",
      });
      mockAuthenticateUser.mockResolvedValue(mockUser);
      mockCreateToken.mockImplementation(() => {
        throw new Error("Token creation failed");
      });

      const response = await loginHandler(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe("Internal server error");
    });
  });
});
