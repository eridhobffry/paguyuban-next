import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "@/app/api/analytics/query/route";
import { generateText } from "@/lib/ai/gemini-client";
import { db } from "@/lib/db";
import {
  analyticsSessions,
  analyticsEvents,
  analyticsSectionDurations,
  chatbotLogs,
} from "@/lib/db/schema";

// Mock dependencies
vi.mock("@/lib/ai/gemini-client", () => ({
  generateText: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          groupBy: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([])),
            })),
          })),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    })),
  },
}));

vi.mock("@/lib/db/schemas/analytics", () => ({
  analyticsSessions: {
    id: "id",
    userId: "user_id",
    startedAt: "started_at",
    endedAt: "ended_at",
    device: "device",
    country: "country",
  },
  analyticsEvents: {
    id: "id",
    sessionId: "session_id",
    type: "type",
    route: "route",
    element: "element",
    createdAt: "created_at",
  },
  analyticsSectionDurations: {
    section: "section",
    dwellMs: "dwell_ms",
    createdAt: "created_at",
  },
  chatbotLogs: {
    id: "id",
    sessionId: "session_id",
    message: "message",
    tokens: "tokens",
    createdAt: "created_at",
  },
}));

describe("Analytics Query API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/analytics/query", () => {
    it("should return capabilities and examples", async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("capabilities");
      expect(data).toHaveProperty("examples");
      expect(data.capabilities).toHaveProperty("supportedQueryTypes");
      expect(data.capabilities).toHaveProperty("availableMetrics");
      expect(data.capabilities).toHaveProperty("availableDimensions");
      expect(data.capabilities).toHaveProperty("features");
      expect(Array.isArray(data.examples)).toBe(true);
    });

    it("should include data sources information", async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.capabilities).toHaveProperty("dataSources");
      expect(Array.isArray(data.capabilities.dataSources)).toBe(true);
      expect(data.capabilities.dataSources.length).toBeGreaterThan(0);

      const dataSource = data.capabilities.dataSources[0];
      expect(dataSource).toHaveProperty("name");
      expect(dataSource).toHaveProperty("description");
      expect(dataSource).toHaveProperty("fields");
    });
  });

  describe("POST /api/analytics/query", () => {
    const mockAnalyticsData = {
      sessionMetrics: {
        totalSessions: 1250,
        uniqueUsers: 890,
        avgSessionDuration: 245.5,
        bounceRate: 35.2,
      },
      eventMetrics: {
        totalEvents: 8750,
        uniqueEventTypes: 25,
        avgEventsPerSession: 7.0,
      },
      sectionMetrics: {
        avgSectionDwellTime: 45000,
        totalSectionViews: 3200,
        mostViewedSection: "hero",
      },
      topRoutes: [
        { route: "/home", count: 450 },
        { route: "/speakers", count: 320 },
        { route: "/sponsors", count: 280 },
      ],
      topSections: [
        { section: "hero", avgDwellTime: 45000, totalViews: 1200 },
        { section: "speakers", avgDwellTime: 38000, totalViews: 890 },
      ],
      deviceBreakdown: [
        { device: "mobile", count: 680 },
        { device: "desktop", count: 520 },
        { device: "tablet", count: 50 },
      ],
    };

    beforeEach(() => {
      // Mock database responses for analytics data
      const mockSessionMetrics = [mockAnalyticsData.sessionMetrics];
      const mockEventMetrics = [mockAnalyticsData.eventMetrics];
      const mockSectionMetrics = [mockAnalyticsData.sectionMetrics];

      // Mock session metrics query
      vi.mocked(db.select).mockImplementationOnce(
        () =>
          ({
            from: vi.fn(() => ({
              where: vi.fn(() => ({
                orderBy: vi.fn(() => ({
                  limit: vi.fn(() => Promise.resolve([])),
                })),
              })),
            })),
          } as any)
      );

      vi.mocked(db.select).mockImplementationOnce(
        () =>
          ({
            from: vi.fn(() => ({
              where: vi.fn(() => ({
                orderBy: vi.fn(() => ({
                  limit: vi.fn(() => Promise.resolve([])),
                })),
              })),
            })),
          } as any)
      );

      vi.mocked(db.select).mockImplementationOnce(
        () =>
          ({
            from: vi.fn(() => ({
              where: vi.fn(() => ({
                orderBy: vi.fn(() => ({
                  limit: vi.fn(() => Promise.resolve([])),
                })),
              })),
            })),
          } as any)
      );

      vi.mocked(db.select).mockImplementationOnce(
        () =>
          ({
            from: vi.fn(() => ({
              where: vi.fn(() => ({
                orderBy: vi.fn(() => ({
                  limit: vi.fn(() => Promise.resolve([])),
                })),
              })),
            })),
          } as any)
      );

      vi.mocked(db.select).mockImplementationOnce(
        () =>
          ({
            from: vi.fn(() => ({
              where: vi.fn(() => ({
                groupBy: vi.fn(() => ({
                  orderBy: vi.fn(() => ({
                    limit: vi.fn(() =>
                      Promise.resolve(mockAnalyticsData.topRoutes)
                    ),
                  })),
                })),
              })),
            })),
          } as any)
      );

      vi.mocked(db.select).mockImplementationOnce(
        () =>
          ({
            from: vi.fn(() => ({
              where: vi.fn(() => ({
                groupBy: vi.fn(() => ({
                  orderBy: vi.fn(() => ({
                    limit: vi.fn(() =>
                      Promise.resolve(mockAnalyticsData.topSections)
                    ),
                  })),
                })),
              })),
            })),
          } as any)
      );

      vi.mocked(db.select).mockImplementationOnce(
        () =>
          ({
            from: vi.fn(() => ({
              where: vi.fn(() => ({
                groupBy: vi.fn(() => ({
                  orderBy: vi.fn(() =>
                    Promise.resolve(mockAnalyticsData.deviceBreakdown)
                  ),
                })),
              })),
            })),
          } as any)
      );
    });

    it("should process valid analytics query successfully", async () => {
      const mockAIResponse = `Based on the analytics data, I can provide insights about user behavior and engagement:

Insights: User engagement shows healthy patterns with 1,250 total sessions and 890 unique users. The average session duration of 4 minutes indicates good content engagement.

Metrics:
- Sessions: 1,250
- Users: 890
- Bounce Rate: 35%
- Avg Session Duration: 4 minutes

Recommendations:
1. Focus on reducing bounce rate through improved landing page optimization
2. Consider A/B testing for the hero section which receives the most attention
3. Mobile optimization could improve engagement given the high mobile traffic percentage`;

      vi.mocked(generateText).mockResolvedValue(mockAIResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: "What are the main user engagement trends?",
            timeRange: {
              start: "2024-01-01",
              end: "2024-01-31",
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("insights");
      expect(data).toHaveProperty("metrics");
      expect(data).toHaveProperty("dimensions");
      expect(data).toHaveProperty("trends");
      expect(data).toHaveProperty("recommendations");
      expect(data).toHaveProperty("dataQuality");
      expect(data).toHaveProperty("timestamp");
    });

    it("should validate required fields", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/query",
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
      expect(data.error).toContain("Invalid request data");
    });

    it("should reject empty queries", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: "",
            timeRange: {
              start: "2024-01-01",
              end: "2024-01-31",
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
    });

    it("should handle time range filtering", async () => {
      const mockAIResponse = `Insights: Data shows consistent performance within the specified date range.`;

      vi.mocked(generateText).mockResolvedValue(mockAIResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: "How has user engagement changed?",
            timeRange: {
              start: "2024-01-01T00:00:00Z",
              end: "2024-01-31T23:59:59Z",
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("insights");
    });

    it("should handle AI service errors gracefully", async () => {
      vi.mocked(generateText).mockRejectedValue(
        new Error("AI service unavailable")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: "What are the engagement metrics?",
            timeRange: {
              start: "2024-01-01",
              end: "2024-01-31",
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty("error");
      expect(data.error).toContain("Failed to process analytics query");
    });

    it("should generate comprehensive metrics", async () => {
      const mockAIResponse = `Insights: Strong user engagement with high session quality metrics.

Key Metrics:
- Total Sessions: 1,250
- Unique Users: 890
- Bounce Rate: 35%
- Average Session Duration: 4 minutes
- Events per Session: 7.0
- Average Section Dwell Time: 45 seconds`;

      vi.mocked(generateText).mockResolvedValue(mockAIResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: "Show me key engagement metrics",
            timeRange: {
              start: "2024-01-01",
              end: "2024-01-31",
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("metrics");
      expect(Array.isArray(data.metrics)).toBe(true);
      expect(data.metrics.length).toBeGreaterThan(0);
    });

    it("should provide dimension breakdowns", async () => {
      const mockAIResponse = `Insights: Clear device preferences with mobile leading.

Top Routes:
- /home: 450 visits
- /speakers: 320 visits
- /sponsors: 280 visits

Device Breakdown:
- Mobile: 680 sessions (54%)
- Desktop: 520 sessions (42%)
- Tablet: 50 sessions (4%)`;

      vi.mocked(generateText).mockResolvedValue(mockAIResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: "What are the top pages and device usage?",
            timeRange: {
              start: "2024-01-01",
              end: "2024-01-31",
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("dimensions");
      expect(Array.isArray(data.dimensions)).toBe(true);
    });

    it("should generate actionable recommendations", async () => {
      const mockAIResponse = `Insights: Several opportunities for optimization identified.

Recommendations:
1. Optimize mobile experience given high mobile traffic
2. Improve content engagement on /speakers page
3. Reduce bounce rate through better landing page design
4. Implement A/B testing for hero section
5. Enhance chatbot integration for better user guidance`;

      vi.mocked(generateText).mockResolvedValue(mockAIResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/query",
        {
          method: "POST",
          body: JSON.stringify({
            query:
              "What recommendations can you provide for improving user engagement?",
            timeRange: {
              start: "2024-01-01",
              end: "2024-01-31",
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("recommendations");
      expect(Array.isArray(data.recommendations)).toBe(true);
      expect(data.recommendations.length).toBeGreaterThan(0);
    });

    it("should assess data quality", async () => {
      const mockAIResponse = `Insights: Data quality is generally good with some areas for improvement.

Data Quality Score: 85%

Issues:
- Some sessions missing device information
- Incomplete referrer data for external traffic

Suggestions:
- Implement better device detection
- Enhance UTM parameter tracking
- Add more comprehensive event tracking`;

      vi.mocked(generateText).mockResolvedValue(mockAIResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: "How good is our data quality?",
            timeRange: {
              start: "2024-01-01",
              end: "2024-01-31",
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("dataQuality");
      expect(data.dataQuality).toHaveProperty("score");
      expect(data.dataQuality).toHaveProperty("issues");
      expect(data.dataQuality).toHaveProperty("suggestions");
    });

    it("should handle malformed AI responses gracefully", async () => {
      const malformedResponse =
        "This is not a properly formatted analytics response";
      vi.mocked(generateText).mockResolvedValue(malformedResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: "What are the analytics?",
            timeRange: {
              start: "2024-01-01",
              end: "2024-01-31",
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("insights");
      expect(data.insights).toBe(malformedResponse);
      expect(data).toHaveProperty("metrics");
      expect(data).toHaveProperty("timestamp");
    });

    it("should handle very long queries", async () => {
      const longQuery = "a".repeat(1000);
      const mockAIResponse = `Insights: This is a response to a very long query about analytics data.

Key Metrics:
- Sessions: 1,250
- Users: 890`;

      vi.mocked(generateText).mockResolvedValue(mockAIResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: longQuery,
            timeRange: {
              start: "2024-01-01",
              end: "2024-01-31",
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("insights");
    });

    it("should reject queries that are too long", async () => {
      const tooLongQuery = "a".repeat(1001);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: tooLongQuery,
            timeRange: {
              start: "2024-01-01",
              end: "2024-01-31",
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
      expect(data.error).toContain("Query too long");
    });

    it("should handle filters parameter", async () => {
      const mockAIResponse = `Insights: Filtered data shows specific user segment behavior.`;

      vi.mocked(generateText).mockResolvedValue(mockAIResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: "How do mobile users behave?",
            timeRange: {
              start: "2024-01-01",
              end: "2024-01-31",
            },
            filters: {
              device: "mobile",
              country: "DE",
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("insights");
    });
  });
});
