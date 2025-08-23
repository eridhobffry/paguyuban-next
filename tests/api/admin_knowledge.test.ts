import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, PUT, DELETE } from "@/app/api/admin/knowledge/route";
import {
  createAdminRequest,
  createUnauthenticatedRequest,
  createUserRequest,
  mockAdminUser,
  mockRegularUser,
  testKnowledgeData,
  expectSuccessResponse,
  expectErrorResponse,
} from "../helpers/test-utils";

// Mock database and auth modules
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    returning: vi.fn(),
  },
}));

vi.mock("@/lib/db/schemas/knowledge", () => ({
  knowledge: "knowledge_table",
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({})),
  desc: vi.fn(() => ({})),
}));

vi.mock("@/lib/auth", () => ({
  isAdminFromToken: vi.fn(),
}));

describe("Knowledge API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/admin/knowledge", () => {
    it("should return 401 for unauthenticated requests", async () => {
      // Mock unauthenticated request
      const { isAdminFromToken } = await import("@/lib/auth");
      vi.mocked(isAdminFromToken).mockResolvedValue(false);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge"
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 for non-admin users", async () => {
      // Mock non-admin user
      const { isAdminFromToken } = await import("@/lib/auth");
      vi.mocked(isAdminFromToken).mockResolvedValue(false);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge"
      );
      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Admin access required");
    });

    it("should return empty knowledge when no data exists", async () => {
      // Admin user authenticated - already mocked at top level
      const { db } = await import("@/lib/db");

      // Admin user authenticated

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.overlay).toEqual({});
      expect(data.isActive).toBe(true);
    });

    it("should return knowledge data when it exists", async () => {
      // Admin user authenticated - already mocked at top level
      const { db } = await import("@/lib/db");

      // Admin user authenticated

      const mockKnowledge = {
        id: "test-id",
        overlay: { "test.key": "test_value" },
        isActive: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([mockKnowledge])),
            })),
          })),
        })),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("test-id");
      expect(data.overlay).toEqual({ "test.key": "test_value" });
      expect(data.isActive).toBe(true);
      expect(data.createdAt).toBe("2024-01-01T00:00:00.000Z");
      expect(data.updatedAt).toBe("2024-01-02T00:00:00.000Z");
    });
  });

  describe("POST /api/admin/knowledge", () => {
    it("should return 401 for unauthenticated requests", async () => {
      // Admin user authenticated - already mocked at top level
      // No authentication

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge",
        {
          method: "POST",
          body: JSON.stringify({ overlay: {}, isActive: true }),
        }
      );
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should create new knowledge successfully", async () => {
      // Admin user authenticated - already mocked at top level
      const { db } = await import("@/lib/db");

      // Admin user authenticated

      const newKnowledge = {
        id: "new-id",
        overlay: { "new.key": "new_value" },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock deactivate existing
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      } as any);

      // Mock insert
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([newKnowledge])),
        })),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            overlay: { "new.key": "new_value" },
            isActive: true,
          }),
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBe("new-id");
      expect(data.overlay).toEqual({ "new.key": "new_value" });
    });

    it("should return 400 for invalid JSON", async () => {
      // Admin user authenticated - already mocked at top level
      // Admin user authenticated

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "invalid json",
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid data format");
    });
  });

  describe("PUT /api/admin/knowledge", () => {
    it("should update existing knowledge", async () => {
      // Admin user authenticated - already mocked at top level
      const { db } = await import("@/lib/db");

      // Admin user authenticated

      const existingKnowledge = {
        id: "existing-id",
        overlay: { "existing.key": "existing_value" },
        isActive: true,
      };

      const updatedKnowledge = {
        id: "existing-id",
        overlay: { "updated.key": "updated_value" },
        isActive: true,
        updatedAt: new Date(),
      };

      // Mock find existing
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([existingKnowledge])),
            })),
          })),
        })),
      } as any);

      // Mock update
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([updatedKnowledge])),
          })),
        })),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            overlay: { "updated.key": "updated_value" },
            isActive: true,
          }),
        }
      );

      const response = await PUT(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.overlay).toEqual({ "updated.key": "updated_value" });
    });

    it("should create new knowledge if none exists", async () => {
      // Admin user authenticated - already mocked at top level
      const { db } = await import("@/lib/db");

      // Admin user authenticated

      const newKnowledge = {
        id: "new-id",
        overlay: { "new.key": "new_value" },
        isActive: true,
      };

      // Mock no existing knowledge
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
      } as any);

      // Mock insert
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([newKnowledge])),
        })),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            overlay: { "new.key": "new_value" },
            isActive: true,
          }),
        }
      );

      const response = await PUT(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("new-id");
    });
  });

  describe("DELETE /api/admin/knowledge", () => {
    it("should deactivate knowledge", async () => {
      // Admin user authenticated - already mocked at top level
      const { db } = await import("@/lib/db");

      // Admin user authenticated

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Knowledge overlay deactivated");
    });
  });
});
