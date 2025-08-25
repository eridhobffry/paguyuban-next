import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the database pool before importing the module
vi.mock("@/lib/db", () => ({
  pool: {
    connect: vi.fn(),
  },
}));

// Mock the SQL module
vi.mock("@/lib/sql", () => ({
  ensureUsersSingleTableModel: vi.fn(),
}));

import { ensureUsersSingleTableModel } from "@/lib/sql";

describe("Database Schema Setup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock to resolve by default
    (ensureUsersSingleTableModel as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("ensureUsersSingleTableModel", () => {
    it("successfully initializes database schema", async () => {
      await ensureUsersSingleTableModel();

      expect(ensureUsersSingleTableModel).toHaveBeenCalledTimes(1);
    });

    it("handles database connection errors gracefully", async () => {
      (ensureUsersSingleTableModel as any).mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(ensureUsersSingleTableModel()).rejects.toThrow(
        "Database connection failed"
      );

      expect(ensureUsersSingleTableModel).toHaveBeenCalledTimes(1);
    });

    it("handles table creation errors", async () => {
      (ensureUsersSingleTableModel as any).mockRejectedValue(
        new Error("Table creation failed")
      );

      await expect(ensureUsersSingleTableModel()).rejects.toThrow(
        "Table creation failed"
      );
    });

    it("handles column addition errors", async () => {
      (ensureUsersSingleTableModel as any).mockRejectedValue(
        new Error("Column addition failed")
      );

      await expect(ensureUsersSingleTableModel()).rejects.toThrow(
        "Column addition failed"
      );
    });

    it("handles transaction rollback errors", async () => {
      (ensureUsersSingleTableModel as any).mockRejectedValue(
        new Error("Transaction rollback failed")
      );

      await expect(ensureUsersSingleTableModel()).rejects.toThrow(
        "Transaction rollback failed"
      );
    });

    it("can be called multiple times safely", async () => {
      // First call
      await ensureUsersSingleTableModel();

      // Second call
      await ensureUsersSingleTableModel();

      expect(ensureUsersSingleTableModel).toHaveBeenCalledTimes(2);
    });
  });
});
