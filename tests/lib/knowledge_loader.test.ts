import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadKnowledgeOverlay, deepMerge } from "@/lib/knowledge/loader";

// Mock the database module
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  },
}));

// Mock the knowledge schema
vi.mock("@/lib/db/schemas/knowledge", () => ({
  knowledge: {},
}));

// Mock drizzle-orm functions
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({})),
  desc: vi.fn(() => ({})),
}));

// Mock fs/promises
vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
}));

describe("Knowledge Loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("deepMerge", () => {
    it("should merge simple objects", () => {
      const base = { a: 1, b: 2 };
      const overlay = { b: 3, c: 4 };
      const result = deepMerge(base, overlay);

      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it("should deeply merge nested objects", () => {
      const base = { a: { x: 1, y: 2 } };
      const overlay = { a: { y: 3, z: 4 } };
      const result = deepMerge(base, overlay);

      expect(result).toEqual({ a: { x: 1, y: 3, z: 4 } });
    });

    it("should replace arrays and primitives", () => {
      const base = { a: [1, 2], b: "old" };
      const overlay = { a: [3, 4], b: "new" };
      const result = deepMerge(base, overlay);

      expect(result).toEqual({ a: [3, 4], b: "new" });
    });

    it("should handle null and undefined overlays", () => {
      const base = { a: 1 };
      const result1 = deepMerge(base, null as any);
      const result2 = deepMerge(base, undefined as any);

      expect(result1).toEqual({ a: 1 });
      expect(result2).toEqual({ a: 1 });
    });

    it("should handle empty objects", () => {
      const base = { a: 1 };
      const overlay = {};
      const result = deepMerge(base, overlay);

      expect(result).toEqual({ a: 1 });
    });
  });

  describe("loadKnowledgeOverlay", () => {
    it("should return null when no knowledge sources are available", async () => {
      // Mock fs to simulate no files
      const fs = await import("fs/promises");
      vi.mocked(fs.readFile).mockRejectedValue(new Error("File not found"));

      // Mock database to return no results
      const { db } = await import("@/lib/db");
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
      } as any);

      const result = await loadKnowledgeOverlay();
      expect(result).toBeNull();
    });

    it("should load from database when available", async () => {
      const dbKnowledge = { "db.key": "database_value" };

      // Mock database to return knowledge
      const { db } = await import("@/lib/db");
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() =>
                Promise.resolve([
                  {
                    overlay: dbKnowledge,
                    isActive: true,
                  },
                ])
              ),
            })),
          })),
        })),
      } as any);

      // Mock fs to simulate no files
      const fs = await import("fs/promises");
      vi.mocked(fs.readFile).mockRejectedValue(new Error("File not found"));

      const result = await loadKnowledgeOverlay();
      expect(result).toEqual(dbKnowledge);
    });

    it("should load from JSON file when available", async () => {
      const jsonKnowledge = { "json.key": "json_value" };

      // Mock database to return no results
      const { db } = await import("@/lib/db");
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
      } as any);

      // Mock fs to return JSON file
      const fs = await import("fs/promises");
      vi.mocked(fs.readFile).mockResolvedValueOnce(
        Buffer.from(JSON.stringify(jsonKnowledge))
      ); // JSON file
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error("CSV not found")); // CSV file

      const result = await loadKnowledgeOverlay();
      expect(result).toEqual(jsonKnowledge);
    });

    it("should load from CSV file when available", async () => {
      const csvContent = "path,value\ntest.key,test_value";

      // Mock database to return no results
      const { db } = await import("@/lib/db");
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
      } as any);

      // Mock fs
      const fs = await import("fs/promises");
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error("JSON not found")); // JSON file
      vi.mocked(fs.readFile).mockResolvedValueOnce(Buffer.from(csvContent)); // CSV file

      const result = await loadKnowledgeOverlay();
      expect(result).toEqual({ test: { key: "test_value" } });
    });

    it("should merge database, JSON, and CSV sources with priority", async () => {
      const dbKnowledge = { "db.key": "database_value" };
      const jsonKnowledge = { "json.key": "json_value" };
      const csvContent = "path,value\ncsv.key,csv_value\njson.key,csv_override";

      // Mock database to return knowledge
      const { db } = await import("@/lib/db");
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() =>
                Promise.resolve([
                  {
                    overlay: dbKnowledge,
                    isActive: true,
                  },
                ])
              ),
            })),
          })),
        })),
      } as any);

      // Mock fs
      const fs = await import("fs/promises");
      vi.mocked(fs.readFile).mockResolvedValueOnce(
        Buffer.from(JSON.stringify(jsonKnowledge))
      ); // JSON file
      vi.mocked(fs.readFile).mockResolvedValueOnce(Buffer.from(csvContent)); // CSV file

      const result = await loadKnowledgeOverlay();
      expect(result).toEqual({
        "db.key": "database_value",
        "json.key": "csv_override", // CSV overrides JSON
        "csv.key": "csv_value",
      });
    });

    it("should handle malformed JSON gracefully", async () => {
      // Mock database to return no results
      const { db } = await import("@/lib/db");
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
      } as any);

      // Mock fs with malformed JSON
      const fs = await import("fs/promises");
      vi.mocked(fs.readFile).mockResolvedValueOnce(Buffer.from("invalid json")); // JSON file
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error("CSV not found")); // CSV file

      const result = await loadKnowledgeOverlay();
      expect(result).toBeNull();
    });

    it("should handle malformed CSV gracefully", async () => {
      const malformedCsv = "invalid,csv,format\nno,headers";

      // Mock database to return no results
      const { db } = await import("@/lib/db");
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
      } as any);

      // Mock fs
      const fs = await import("fs/promises");
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error("JSON not found")); // JSON file
      vi.mocked(fs.readFile).mockResolvedValueOnce(Buffer.from(malformedCsv)); // CSV file

      const result = await loadKnowledgeOverlay();
      expect(result).toBeNull();
    });

    it("should parse CSV with quoted values correctly", async () => {
      const csvWithQuotes =
        'path,value\n"event.location","Arena Berlin, Germany"\n"event.name","Paguyuban Messe 2026"';

      // Mock database to return no results
      const { db } = await import("@/lib/db");
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
      } as any);

      // Mock fs
      const fs = await import("fs/promises");
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error("JSON not found")); // JSON file
      vi.mocked(fs.readFile).mockResolvedValueOnce(Buffer.from(csvWithQuotes)); // CSV file

      const result = await loadKnowledgeOverlay();
      expect(result).toEqual({
        event: {
          location: "Arena Berlin, Germany",
          name: "Paguyuban Messe 2026",
        },
      });
    });

    it("should parse various value types correctly", async () => {
      const csvWithTypes = `path,value
number,123
string,hello
boolean.true,true
boolean.false,false
null_value,null
empty_string,""
quoted.string,"with,comma"
json_value,{"nested":"object"}`;

      // Mock database to return no results
      const { db } = await import("@/lib/db");
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
      } as any);

      // Mock fs
      const fs = await import("fs/promises");
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error("JSON not found")); // JSON file
      vi.mocked(fs.readFile).mockResolvedValueOnce(Buffer.from(csvWithTypes)); // CSV file

      const result = await loadKnowledgeOverlay();
      expect(result).toEqual({
        number: 123,
        string: "hello",
        boolean: { true: true, false: false },
        null_value: null,
        empty_string: "",
        quoted: { string: "with,comma" },
        json_value: { nested: "object" },
      });
    });
  });
});
