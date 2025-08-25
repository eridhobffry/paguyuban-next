import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock all dependencies
const mockClient = {
  query: vi.fn(),
  release: vi.fn(),
};

const mockPool = {
  connect: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  pool: mockPool,
}));

vi.mock("@/lib/constants", () => ({
  SUPER_ADMIN_EMAIL: "admin@example.com",
}));

import {
  initializeAdmin,
  hashPassword,
  verifyPassword,
  createToken,
  isAdmin,
  isSuperAdmin,
} from "@/lib/auth";
import { ensureUsersSingleTableModel } from "@/lib/sql";

vi.mock("@/lib/sql", () => ({
  ensureUsersSingleTableModel: vi.fn(),
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
}));

import { getUserByEmail, createUser } from "@/lib/sql";

const mockGetUserByEmail = getUserByEmail as any;
const mockCreateUser = createUser as any;
const mockEnsureUsersSingleTableModel = ensureUsersSingleTableModel as any;

describe("Authentication Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.query.mockResolvedValue({ rows: [] });
    mockClient.release.mockImplementation(() => {});
    mockEnsureUsersSingleTableModel.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initializeAdmin", () => {
    it("creates admin user when none exists", async () => {
      const mockAdminUser = {
        id: "admin-123",
        email: "admin@example.com",
        role: "admin",
        status: "active",
      };

      mockGetUserByEmail.mockResolvedValue(null); // No existing admin
      mockCreateUser.mockResolvedValue(mockAdminUser);

      await initializeAdmin();

      // Verify database setup was called first
      expect(mockEnsureUsersSingleTableModel).toHaveBeenCalled();

      // Verify admin lookup was attempted
      expect(mockGetUserByEmail).toHaveBeenCalledWith("admin@example.com");

      // Verify admin was created with correct parameters
      expect(mockCreateUser).toHaveBeenCalledWith(
        "admin@example.com",
        expect.any(String),
        "admin"
      );
    });

    it("does not create admin when one already exists", async () => {
      const existingAdmin = {
        id: "admin-123",
        email: "admin@example.com",
        role: "admin",
        status: "active",
      };

      mockGetUserByEmail.mockResolvedValue(existingAdmin);

      await initializeAdmin();

      // Verify database setup was still called
      expect(mockEnsureUsersSingleTableModel).toHaveBeenCalled();

      // Verify admin lookup was attempted
      expect(mockGetUserByEmail).toHaveBeenCalledWith("admin@example.com");

      // Verify createUser was NOT called
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("handles database setup errors", async () => {
      mockEnsureUsersSingleTableModel.mockRejectedValue(
        new Error("Database setup failed")
      );

      await expect(initializeAdmin()).rejects.toThrow("Database setup failed");

      // Verify createUser was not called after database failure
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("handles user lookup errors", async () => {
      mockGetUserByEmail.mockRejectedValue(new Error("Database query failed"));

      await expect(initializeAdmin()).rejects.toThrow("Database query failed");

      // Verify createUser was not called after lookup failure
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("handles user creation errors", async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      mockCreateUser.mockRejectedValue(new Error("User creation failed"));

      await expect(initializeAdmin()).rejects.toThrow("User creation failed");
    });
  });

  describe("Password functions", () => {
    it("hashes password securely", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it("verifies correct password", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("rejects incorrect password", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword("wrongPassword", hash);
      expect(isValid).toBe(false);
    });

    it("handles empty passwords", async () => {
      const hash = await hashPassword("");
      const isValid = await verifyPassword("", hash);
      expect(isValid).toBe(true);
    });
  });

  describe("JWT Token functions", () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      role: "member",
      status: "active",
    };

    it("creates valid JWT token", () => {
      const token = createToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("creates different tokens for same user", () => {
      const token1 = createToken(mockUser);
      const token2 = createToken(mockUser);

      // Tokens should be different due to timestamp
      expect(token1).not.toBe(token2);
    });
  });

  describe("Role checking functions", () => {
    it("identifies admin users correctly", () => {
      const adminUser = { role: "admin", status: "active" };
      const superAdminUser = { role: "super_admin", status: "active" };
      const regularUser = { role: "member", status: "active" };

      expect(isAdmin(adminUser)).toBe(true);
      expect(isAdmin(superAdminUser)).toBe(true);
      expect(isAdmin(regularUser)).toBe(false);
    });

    it("identifies super admin users correctly", () => {
      const superAdminUser = { is_super_admin: true, status: "active" };
      const regularAdminUser = { role: "admin", status: "active" };
      const regularUser = { role: "member", status: "active" };

      expect(isSuperAdmin(superAdminUser)).toBe(true);
      expect(isSuperAdmin(regularAdminUser)).toBe(false);
      expect(isSuperAdmin(regularUser)).toBe(false);
    });

    it("handles null/undefined users", () => {
      expect(isAdmin(null as any)).toBe(false);
      expect(isAdmin(undefined as any)).toBe(false);
      expect(isSuperAdmin(null as any)).toBe(false);
      expect(isSuperAdmin(undefined as any)).toBe(false);
    });
  });
});
