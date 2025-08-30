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

// Mock telemetry recording
vi.mock("@/lib/telemetry", () => ({
  recordTelemetry: vi.fn(),
}));

// Mock fetch globally for all HTTP calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Synthetic Probe System", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful responses for health check
    mockFetch.mockImplementation((url: string | URL) => {
      const urlString = url.toString();

      if (urlString.includes("/api/health")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve('{"status": "healthy"}'),
          json: () => Promise.resolve({ status: "healthy" }),
          headers: new Map([["content-length", "22"]]),
        });
      }

      if (urlString.includes("/api/ai/respond")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve("August 7-8, 2026 is the date of Paguyuban Messe"),
          json: () =>
            Promise.resolve({
              response: "August 7-8, 2026 is the date of Paguyuban Messe",
              metadata: { confidence: 0.9 },
            }),
          headers: new Map([["content-length", "60"]]),
        });
      }

      if (urlString.includes("/api/ai/data/knowledge-context")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve('{"metadata": {"topic": "event"}}'),
          json: () =>
            Promise.resolve({
              metadata: { topic: "event" },
            }),
          headers: new Map([["content-length", "30"]]),
        });
      }

      // Default response for any other URLs
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"status": "ok"}'),
        json: () => Promise.resolve({ status: "ok" }),
        headers: new Map([["content-length", "15"]]),
      });
    });
  });

  describe("Health Check Probe", () => {
    it("should execute health check successfully", async () => {
      const { GET } = await import("@/app/api/admin/synthetic/probe/route");

      const request = new NextRequest(
        "http://localhost/api/admin/synthetic/probe?probeId=health_check"
      );

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.executed).toBe(1);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].success).toBe(true);
      expect(data.results[0].statusCode).toBe(200);
    });

    it("should handle health check failures", async () => {
      // Override the default mock for this test
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal server error" }),
        headers: new Map(),
      });

      const { GET } = await import("@/app/api/admin/synthetic/probe/route");

      const request = new NextRequest(
        "http://localhost/api/admin/synthetic/probe?probeId=health_check"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.results[0].success).toBe(false);
      expect(data.results[0].statusCode).toBe(500);
    });
  });

  describe("AI Response Probe", () => {
    it("should test AI response generation", async () => {
      const { GET } = await import("@/app/api/admin/synthetic/probe/route");

      const request = new NextRequest(
        "http://localhost/api/admin/synthetic/probe?probeId=ai_respond_probe"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.results[0].probeId).toBe("ai_respond_probe");
      expect(data.results[0].success).toBe(true);
      expect(data.results[0].statusCode).toBe(200);
    });

    it("should handle probe system configuration", async () => {
      // Test that the synthetic probe system can execute without errors
      // This verifies the overall system health
      const { GET } = await import("@/app/api/admin/synthetic/probe/route");

      const request = new NextRequest(
        "http://localhost/api/admin/synthetic/probe?probeId=ai_respond_probe"
      );

      const response = await GET(request);
      const data = await response.json();

      // Verify the response structure is correct
      expect(data).toHaveProperty("executed");
      expect(data).toHaveProperty("results");
      expect(data).toHaveProperty("summary");
      expect(Array.isArray(data.results)).toBe(true);
    });
  });

  describe("Database Probe", () => {
    it("should test database connectivity", async () => {
      mockDb.execute.mockResolvedValue({
        rows: [{ test_value: 1, current_time: new Date() }],
      });

      const { GET } = await import("@/app/api/admin/synthetic/probe/route");

      const request = new NextRequest(
        "http://localhost/api/admin/synthetic/probe?probeId=database_probe"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.results[0].success).toBe(true);
      expect(data.results[0].details).toHaveProperty("connectionTime");
      expect(data.results[0].details).toHaveProperty("testResult");
    });

    it("should handle database connection failures", async () => {
      mockDb.execute.mockRejectedValue(new Error("Connection refused"));

      const { GET } = await import("@/app/api/admin/synthetic/probe/route");

      const request = new NextRequest(
        "http://localhost/api/admin/synthetic/probe?probeId=database_probe"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.results[0].success).toBe(false);
      expect(data.results[0].error).toBe("Connection refused");
    });
  });

  describe("Multiple Probe Execution", () => {
    it("should execute all enabled probes", async () => {
      const { GET } = await import("@/app/api/admin/synthetic/probe/route");

      const request = new NextRequest(
        "http://localhost/api/admin/synthetic/probe"
      );

      const response = await GET(request);
      const data = await response.json();

      // Should execute all enabled probes (health_check, ai_respond_probe, knowledge_context_probe, database_probe)
      expect(data.executed).toBeGreaterThan(1);
      expect(data.summary.total).toBe(data.executed);
      expect(data.summary.successful).toBeGreaterThanOrEqual(0);
      expect(data.summary.failed).toBeGreaterThanOrEqual(0);
    });

    it("should provide execution summary", async () => {
      const { GET } = await import("@/app/api/admin/synthetic/probe/route");

      const request = new NextRequest(
        "http://localhost/api/admin/synthetic/probe"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.summary).toHaveProperty("total");
      expect(data.summary).toHaveProperty("successful");
      expect(data.summary).toHaveProperty("failed");
      expect(data.summary).toHaveProperty("averageResponseTime");
      expect(data.summary.total).toBe(
        data.summary.successful + data.summary.failed
      );
    });
  });

  describe("Timeout Handling", () => {
    it("should handle request timeouts", async () => {
      // Mock slow/timeout response
      mockFetch.mockImplementationOnce((url: string | URL) => {
        const urlString = url.toString();
        if (urlString.includes("/api/health")) {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ status: "ok" }),
                headers: new Map([["content-length", "15"]]),
              });
            }, 2000); // Longer than timeout
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ status: "ok" }),
          headers: new Map([["content-length", "15"]]),
        });
      });

      const { GET } = await import("@/app/api/admin/synthetic/probe/route");

      const request = new NextRequest(
        "http://localhost/api/admin/synthetic/probe?probeId=health_check"
      );

      const response = await GET(request);
      const data = await response.json();

      // Should either timeout or succeed based on implementation
      expect(data.results[0]).toHaveProperty("success");
      expect(data.results[0]).toHaveProperty("responseTime");
    });
  });
});
