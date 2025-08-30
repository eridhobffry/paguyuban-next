import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock database
const mockDb = {
  execute: vi.fn(),
};

// Mock the database module
vi.mock("@/lib/db/drizzle", () => ({
  db: mockDb,
}));

// Mock weightedPercentile
vi.mock("@/lib/telemetry", () => ({
  weightedPercentile: vi.fn((values, percentile) => {
    // Simple mock implementation
    if (values.length === 0) return 0;
    const sorted = values.sort((a, b) => a.value - b.value);
    const index = Math.floor(percentile * sorted.length);
    return sorted[Math.min(index, sorted.length - 1)]?.value || 0;
  }),
}));

// Mock auth functions
vi.mock("@/lib/auth", () => ({
  verifyToken: vi.fn(() => ({ id: "test-admin", role: "admin" })),
  isAdmin: vi.fn(() => true),
}));

describe("Metrics API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Summary Endpoint", () => {
    it("should return metrics structure for 7d range", async () => {
      mockDb.execute.mockResolvedValue({
        rows: [
          {
            response_time: 500,
            success: true,
            created_at: new Date(),
            sample_weight: 1,
          },
          {
            response_time: 300,
            success: true,
            created_at: new Date(),
            sample_weight: 2,
          },
        ],
      });

      const { GET } = await import("@/app/api/admin/metrics/summary/route");

      const request = new NextRequest(
        "http://localhost/api/admin/metrics/summary?range=7d",
        {
          headers: { cookie: "auth-token=test-token" },
        }
      );

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("window");
      expect(data).toHaveProperty("totals");
      expect(data).toHaveProperty("latencyMs");
      expect(data.window.range).toBe("7d");
    });

    it("should handle database errors gracefully", async () => {
      mockDb.execute.mockRejectedValue(new Error("Database connection failed"));

      const { GET } = await import("@/app/api/admin/metrics/summary/route");

      const request = new NextRequest(
        "http://localhost/api/admin/metrics/summary",
        {
          headers: { cookie: "auth-token=test-token" },
        }
      );

      const response = await GET(request);
      expect(response.status).toBe(200); // Should still return response with fallback
    });

    it("should calculate correct percentiles", async () => {
      const responseTimes = [100, 200, 300, 400, 500];
      mockDb.execute.mockResolvedValue({
        rows: responseTimes.map((rt, i) => ({
          response_time: rt,
          success: true,
          created_at: new Date(),
          sample_weight: i + 1,
        })),
      });

      const { GET } = await import("@/app/api/admin/metrics/summary/route");

      const request = new NextRequest(
        "http://localhost/api/admin/metrics/summary",
        {
          headers: { cookie: "auth-token=test-token" },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.latencyMs.p50).toBeGreaterThan(0);
      expect(data.latencyMs.p95).toBeGreaterThan(data.latencyMs.p50);
      expect(data.latencyMs.p99).toBeGreaterThanOrEqual(data.latencyMs.p95);
    });
  });

  describe("Timeseries Endpoint", () => {
    it("should return timeseries data structure", async () => {
      mockDb.execute.mockResolvedValue({
        rows: [
          {
            bucket: "2024-01-01T00:00:00.000Z",
            latency_avg: "450",
            error_weight: "2",
            total_weight: "10",
          },
        ],
      });

      const { GET } = await import("@/app/api/admin/metrics/timeseries/route");

      const request = new NextRequest(
        "http://localhost/api/admin/metrics/timeseries?range=7d",
        {
          headers: { cookie: "auth-token=test-token" },
        }
      );

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("window");
      expect(data).toHaveProperty("series");
      expect(Array.isArray(data.series)).toBe(true);
    });

    it("should handle different interval options", async () => {
      mockDb.execute.mockResolvedValue({
        rows: [
          {
            bucket: "2024-01-01T00:00:00.000Z",
            latency_avg: "300",
            error_weight: "1",
            total_weight: "5",
          },
        ],
      });

      const { GET } = await import("@/app/api/admin/metrics/timeseries/route");

      // Test 1h interval (default)
      const request1h = new NextRequest(
        "http://localhost/api/admin/metrics/timeseries?interval=1h",
        {
          headers: { cookie: "auth-token=test-token" },
        }
      );

      const response1h = await GET(request1h);
      const data1h = await response1h.json();
      expect(data1h.window.interval).toBe("1h");

      // Test 1d interval
      const request1d = new NextRequest(
        "http://localhost/api/admin/metrics/timeseries?interval=1d",
        {
          headers: { cookie: "auth-token=test-token" },
        }
      );

      const response1d = await GET(request1d);
      const data1d = await response1d.json();
      expect(data1d.window.interval).toBe("1d");
    });
  });
});
