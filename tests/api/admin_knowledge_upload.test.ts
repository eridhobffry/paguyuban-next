import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Mock next-auth (not used but imported in some places)
vi.mock("next-auth", () => ({}));

// Mock the database and auth
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    returning: vi.fn(),
  },
}));

vi.mock("@/lib/db/schemas/knowledge", () => ({
  knowledge: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({})),
  desc: vi.fn(() => ({})),
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Import handler after mocks
import { POST } from "@/app/api/admin/knowledge/upload/route";

describe("Knowledge CSV Upload API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("POST /api/admin/knowledge/upload", () => {
    it("should return 401 for unauthenticated requests", async () => {
      // Admin user authenticated - already mocked at top level
      // No authentication

      const formData = new FormData();
      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 when no file is provided", async () => {
      // Admin user authenticated - already mocked at top level
      // Admin user authenticated

      const formData = new FormData();
      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("No file provided");
    });

    it("should return 400 for non-CSV files", async () => {
      // Admin user authenticated - already mocked at top level
      // Admin user authenticated

      const formData = new FormData();
      const file = new File(["test content"], "test.txt", {
        type: "text/plain",
      });
      formData.append("file", file);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("File must be a CSV file");
    });

    it("should process valid CSV files", async () => {
      // Admin user authenticated - already mocked at top level
      const { db } = await import("@/lib/db");

      // Admin user authenticated

      const csvContent =
        "path,value\nfinancials.revenue.total,1018660\nevent.location,Arena Berlin";
      const file = new File([csvContent], "test.csv", { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", file);

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
      const newKnowledge = {
        id: "new-id",
        overlay: {
          financials: { revenue: { total: 1018660 } },
          event: { location: "Arena Berlin" },
        },
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([newKnowledge])),
        })),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.recordsProcessed).toBe(2);
      expect(data.overlay).toEqual({
        financials: { revenue: { total: 1018660 } },
        event: { location: "Arena Berlin" },
      });
    });

    it("should merge CSV data with existing knowledge", async () => {
      // Admin user authenticated - already mocked at top level
      const { db } = await import("@/lib/db");

      // Admin user authenticated

      const csvContent =
        "path,value\nexisting.key,new_value\nnew.key,added_value";
      const file = new File([csvContent], "test.csv", { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", file);

      const existingKnowledge = {
        id: "existing-id",
        overlay: { "existing.key": "old_value" },
        isActive: true,
      };

      // Mock existing knowledge
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
      const updatedKnowledge = {
        id: "existing-id",
        overlay: {
          "existing.key": "new_value", // Updated
          "new.key": "added_value", // Added
        },
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([updatedKnowledge])),
          })),
        })),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.recordsProcessed).toBe(2);
      expect(data.overlay).toEqual({
        "existing.key": "new_value",
        "new.key": "added_value",
      });
    });

    it("should handle CSV files with headers", async () => {
      // Admin user authenticated - already mocked at top level
      const { db } = await import("@/lib/db");

      // Admin user authenticated

      const csvContent =
        "path,value\nfinancials.revenue.total,1018660\nevent.location,Arena Berlin";
      const file = new File([csvContent], "test.csv", { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", file);

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
      const newKnowledge = {
        id: "new-id",
        overlay: {
          financials: { revenue: { total: 1018660 } },
          event: { location: "Arena Berlin" },
        },
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([newKnowledge])),
        })),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.recordsProcessed).toBe(2);
    });

    it("should handle CSV files without headers", async () => {
      // Admin user authenticated - already mocked at top level
      const { db } = await import("@/lib/db");

      // Admin user authenticated

      // CSV without headers - should be treated as data
      const csvContent =
        "financials.revenue.total,1018660\nevent.location,Arena Berlin";
      const file = new File([csvContent], "test.csv", { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", file);

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
      const newKnowledge = {
        id: "new-id",
        overlay: {
          financials: { revenue: { total: 1018660 } },
          event: { location: "Arena Berlin" },
        },
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([newKnowledge])),
        })),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.recordsProcessed).toBe(2);
    });

    it("should handle empty CSV files", async () => {
      // Admin user authenticated - already mocked at top level

      // Admin user authenticated

      const csvContent = "path,value\n"; // Only headers, no data
      const file = new File([csvContent], "empty.csv", { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", file);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("No valid data found in CSV");
    });

    it("should handle CSV files with quoted values containing commas", async () => {
      // Admin user authenticated - already mocked at top level
      const { db } = await import("@/lib/db");

      // Admin user authenticated

      const csvContent =
        'path,value\nevent.location,"Arena Berlin, Germany"\nevent.description,"A comprehensive business and cultural expo featuring Indonesian entrepreneurship"';
      const file = new File([csvContent], "test.csv", { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", file);

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
      const newKnowledge = {
        id: "new-id",
        overlay: {
          event: {
            location: "Arena Berlin, Germany",
            description:
              "A comprehensive business and cultural expo featuring Indonesian entrepreneurship",
          },
        },
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([newKnowledge])),
        })),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.recordsProcessed).toBe(2);
      expect(data.overlay.event.location).toBe("Arena Berlin, Germany");
      expect(data.overlay.event.description).toBe(
        "A comprehensive business and cultural expo featuring Indonesian entrepreneurship"
      );
    });

    it("should handle various data types in CSV", async () => {
      // Admin user authenticated - already mocked at top level
      const { db } = await import("@/lib/db");

      // Admin user authenticated

      const csvContent = `path,value
number,123
string,hello
boolean.true,true
boolean.false,false
null_value,null
empty_string,""
json_value,{"nested":"object"}`;

      const file = new File([csvContent], "test.csv", { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", file);

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
      const newKnowledge = {
        id: "new-id",
        overlay: {
          number: 123,
          string: "hello",
          boolean: { true: true, false: false },
          null_value: null,
          empty_string: "",
          json_value: { nested: "object" },
        },
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([newKnowledge])),
        })),
      } as any);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/knowledge/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.recordsProcessed).toBe(6);
      expect(data.overlay.number).toBe(123);
      expect(data.overlay.string).toBe("hello");
      expect(data.overlay.boolean.true).toBe(true);
      expect(data.overlay.boolean.false).toBe(false);
      expect(data.overlay.null_value).toBe(null);
      expect(data.overlay.empty_string).toBe("");
      expect(data.overlay.json_value).toEqual({ nested: "object" });
    });
  });
});
