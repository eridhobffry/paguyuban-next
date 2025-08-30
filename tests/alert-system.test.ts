import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock database
const mockDb = {
  execute: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
};

// Mock the database module
vi.mock("@/lib/db/drizzle", () => ({
  db: mockDb,
}));

describe("Alert System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Alert Rule Evaluation", () => {
    it("should evaluate 'greater than' operator correctly", async () => {
      mockDb.execute.mockResolvedValue({
        rows: [{ error_rate: 0.15 }],
      });

      const { evaluateRule } = await import(
        "@/app/api/admin/alerts/evaluate/route"
      );

      const rule = {
        id: "test_rule",
        name: "Test Rule",
        description: "Test alert",
        query: "SELECT 1",
        threshold: 0.1,
        operator: "gt" as const,
        severity: "high" as const,
        cooldownMinutes: 5,
        enabled: true,
      };

      const result = await evaluateRule(rule);
      expect(result.triggered).toBe(true);
      expect(result.value).toBe(0.15);
    });

    it("should handle database errors gracefully", async () => {
      mockDb.execute.mockRejectedValue(new Error("DB connection failed"));

      const { evaluateRule } = await import(
        "@/app/api/admin/alerts/evaluate/route"
      );

      const rule = {
        id: "test_rule",
        name: "Test Rule",
        description: "Test alert",
        query: "SELECT 1",
        threshold: 0.1,
        operator: "gt" as const,
        severity: "high" as const,
        cooldownMinutes: 5,
        enabled: true,
      };

      const result = await evaluateRule(rule);
      expect(result.triggered).toBe(false);
      expect(result.value).toBe(0);
    });
  });

  describe("Cooldown Logic", () => {
    it("should respect cooldown period", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => [
              {
                id: "alert-1",
                lastNotificationAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
              },
            ]),
          })),
        })),
      });

      const { checkAlertCooldown } = await import(
        "@/app/api/admin/alerts/evaluate/route"
      );

      const inCooldown = await checkAlertCooldown("test-alert", 5); // 5 minute cooldown
      expect(inCooldown).toBe(true);
    });

    it("should allow alerts when cooldown expired", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => []), // No recent alerts
          })),
        })),
      });

      const { checkAlertCooldown } = await import(
        "@/app/api/admin/alerts/evaluate/route"
      );

      const inCooldown = await checkAlertCooldown("test-alert", 5);
      expect(inCooldown).toBe(false);
    });
  });
});
