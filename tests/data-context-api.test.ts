import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock database
const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => []),
        })),
      })),
    })),
  })),
  execute: vi.fn(),
};

// Mock the database module
vi.mock("@/lib/db/drizzle", () => ({
  db: mockDb,
}));

// Mock cache
vi.mock("@/lib/cache", () => ({
  getCached: vi.fn((key, ttl, fetcher) => fetcher()),
}));

describe("Data Context APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Chat Context API", () => {
    it("should return chat logs for session", async () => {
      const mockLogs = [
        {
          id: "msg-2",
          session_id: "123e4567-e89b-12d3-a456-426614174000", // Valid UUID
          role: "assistant",
          message: "Hi there!",
          user_id: null,
          created_at: new Date(Date.now() + 1000), // Newer timestamp
        },
        {
          id: "msg-1",
          session_id: "123e4567-e89b-12d3-a456-426614174000", // Valid UUID
          role: "user",
          message: "Hello",
          user_id: "user-123",
          created_at: new Date(Date.now()), // Older timestamp
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => mockLogs),
            })),
          })),
        })),
      });

      const { GET } = await import("@/app/api/ai/data/chat-context/route");

      const request = new NextRequest(
        "http://localhost/api/ai/data/chat-context?sessionId=123e4567-e89b-12d3-a456-426614174000"
      );

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.logs).toHaveLength(2);
      expect(data.logs[0].role).toBe("user");
      expect(data.logs[1].role).toBe("assistant");
      expect(data.metadata.session_id).toBe(
        "123e4567-e89b-12d3-a456-426614174000"
      );
    });

    it("should handle empty chat history", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => []),
            })),
          })),
        })),
      });

      const { GET } = await import("@/app/api/ai/data/chat-context/route");

      const request = new NextRequest(
        "http://localhost/api/ai/data/chat-context?sessionId=123e4567-e89b-12d3-a456-426614174001"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.logs).toHaveLength(0);
      expect(data.metadata.total_logs).toBe(0);
      expect(data.prospect).toBeNull();
    });

    it("should include sentiment analysis", async () => {
      const mockLogs = [
        {
          id: "msg-1",
          session_id: "123e4567-e89b-12d3-a456-426614174002",
          role: "user",
          message: "This is great! I love it!",
          user_id: "user-123",
          created_at: new Date(),
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => mockLogs),
            })),
          })),
        })),
      });

      const { GET } = await import("@/app/api/ai/data/chat-context/route");

      const request = new NextRequest(
        "http://localhost/api/ai/data/chat-context?sessionId=123e4567-e89b-12d3-a456-426614174002"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.sentiment).toBe("positive");
      expect(data.metadata.user_messages).toBe(1);
    });
  });

  describe("Event Context API", () => {
    it("should return sponsors data when requested", async () => {
      const mockSponsors = [
        {
          id: "sponsor-1",
          name: "Test Sponsor",
          logoUrl: "http://example.com/logo.png",
          url: "http://example.com",
          tags: ["premium"],
          sortOrder: 1,
          updatedAt: new Date(),
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => mockSponsors),
          })),
        })),
      });

      const { GET } = await import("@/app/api/ai/data/event-context/route");

      const request = new NextRequest(
        "http://localhost/api/ai/data/event-context?include=sponsors"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.sponsors).toHaveLength(1);
      expect(data.sponsors[0].name).toBe("Test Sponsor");
      expect(data.metadata.requested_data).toContain("sponsors");
    });

    it("should return tier availability information", async () => {
      const mockTiers = [
        {
          id: "tier-1",
          name: "Platinum",
          price: 50000,
          available: 10,
          sold: 3,
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => mockTiers),
          })),
        })),
      });

      const { GET } = await import("@/app/api/ai/data/event-context/route");

      const request = new NextRequest(
        "http://localhost/api/ai/data/event-context?include=tiers"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.tiers).toHaveLength(1);
      expect(data.tiers[0].remaining).toBe(7); // 10 - 3
      expect(data.availability.platinum).toBe(7);
    });
  });

  describe("Financial Context API", () => {
    it("should return revenue data when requested", async () => {
      const mockRevenue = [
        {
          id: "rev-1",
          amount: 50000,
          category: "Sponsorship",
          notes: "Platinum sponsor",
          evidence_url: "http://example.com/contract.pdf",
          sort_order: 1,
          created_at: new Date(),
        },
      ];

      // Mock telemetry to avoid actual telemetry recording
      vi.mock("@/lib/telemetry", () => ({
        withTelemetry: vi.fn((context, fn) => fn()),
        recordTelemetry: vi.fn(),
        getOrCreateCorrelationId: vi.fn(() => "test-correlation-id"),
      }));

      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          orderBy: vi.fn(() => mockRevenue),
        })),
      });

      const { GET } = await import("@/app/api/ai/data/financial-context/route");

      const request = new NextRequest(
        "http://localhost/api/ai/data/financial-context?include=revenue&intent=financial_analysis"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.revenue).toHaveLength(1);
      expect(data.revenue[0].amount).toBe(50000);
      expect(data.revenue_summary.total).toBe(50000);
    });

    it("should calculate financial projections", async () => {
      const mockRevenue = [{ amount: 100000 }];
      const mockCosts = [{ amount: 50000 }];

      // Mock telemetry to avoid actual telemetry recording
      vi.mock("@/lib/telemetry", () => ({
        withTelemetry: vi.fn((context, fn) => fn()),
        recordTelemetry: vi.fn(),
        getOrCreateCorrelationId: vi.fn(() => "test-correlation-id"),
      }));

      let callCount = 0;
      mockDb.select.mockImplementation(() => ({
        from: vi.fn(() => ({
          orderBy: vi.fn(() => {
            callCount++;
            return callCount === 1 ? mockRevenue : mockCosts;
          }),
        })),
      }));

      const { GET } = await import("@/app/api/ai/data/financial-context/route");

      const request = new NextRequest(
        "http://localhost/api/ai/data/financial-context?include=revenue,costs,projections&intent=financial_analysis"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.projections.net_profit).toBe(50000); // 100k - 50k
      expect(data.projections.profit_margin).toBeGreaterThan(0);
      expect(data.projections.break_even_achieved).toBe(true);
    });
  });

  describe("Knowledge Context API", () => {
    it("should return knowledge data for topics", async () => {
      const mockKnowledge = [
        {
          id: "knowledge-1",
          topic: "event",
          content: "Event information",
          overlay: { key: "value" },
          created_at: new Date(),
        },
      ];

      // Mock telemetry to avoid actual telemetry recording
      vi.mock("@/lib/telemetry", () => ({
        withTelemetry: vi.fn((context, fn) => fn()),
        recordTelemetry: vi.fn(),
        getOrCreateCorrelationId: vi.fn(() => "test-correlation-id"),
      }));

      // Mock the database query chain properly
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => mockKnowledge),
            })),
          })),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => mockKnowledge),
          })),
        })),
      }));

      mockDb.select = mockSelect;

      const { GET } = await import("@/app/api/ai/data/knowledge-context/route");

      const request = new NextRequest(
        "http://localhost/api/ai/data/knowledge-context?topic=event"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.knowledge).toHaveLength(1);
      expect(data.metadata.topic).toBe("event");
      expect(data.topic_context.primary_topic).toBe("event");
    });

    it("should return static knowledge as fallback", async () => {
      // Mock telemetry to avoid actual telemetry recording
      vi.mock("@/lib/telemetry", () => ({
        withTelemetry: vi.fn((context, fn) => fn()),
        recordTelemetry: vi.fn(),
        getOrCreateCorrelationId: vi.fn(() => "test-correlation-id"),
      }));

      // Mock empty database result
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => []),
            })),
          })),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => []),
          })),
        })),
      }));

      mockDb.select = mockSelect;

      const { GET } = await import("@/app/api/ai/data/knowledge-context/route");

      const request = new NextRequest(
        "http://localhost/api/ai/data/knowledge-context"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.static_knowledge).toHaveProperty("event_overview");
      expect(data.static_knowledge.event_overview.name).toContain(
        "Paguyuban Messe"
      );
    });
  });
});
