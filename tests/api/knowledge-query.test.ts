import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "@/app/api/knowledge/query/route";
import { generateText } from "@/lib/ai/gemini-client";
import { db } from "@/lib/db";
import { knowledge } from "@/lib/db/schemas/knowledge";

// Mock dependencies
vi.mock("@/lib/ai/gemini-client", () => ({
  generateText: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    })),
  },
}));

vi.mock("@/lib/db/schemas/knowledge", () => ({
  knowledge: {
    isActive: "is_active",
    overlay: "overlay",
    updatedAt: "updated_at",
  },
}));

vi.mock("@/lib/knowledge/builder", () => ({
  dynamicKnowledgeBuilder: vi.fn(),
}));

describe("Knowledge Query API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/knowledge/query", () => {
    it("should return capabilities and examples", async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("capabilities");
      expect(data).toHaveProperty("examples");
      expect(data.capabilities).toHaveProperty("supportedQueryTypes");
      expect(data.capabilities).toHaveProperty("maxSources");
      expect(data.capabilities).toHaveProperty("features");
      expect(Array.isArray(data.examples)).toBe(true);
    });

    it("should include all required capability fields", async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.capabilities).toMatchObject({
        supportedQueryTypes: expect.any(Array),
        maxSources: expect.any(Number),
        confidenceThreshold: expect.any(Number),
        features: expect.any(Array),
      });
    });
  });

  describe("POST /api/knowledge/query", () => {
    const mockKnowledgeData = {
      event: {
        name: "Paguyuban Messe 2026",
        dates: "August 7-8, 2026",
        location: "Arena Berlin",
      },
      financials: {
        revenue: { total: "€1,018,660" },
        costs: { total: "€953,474" },
      },
    };

    beforeEach(() => {
      // Mock database response
      const mockDbResponse = [
        {
          overlay: mockKnowledgeData,
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve(mockDbResponse)),
            })),
          })),
        })),
      } as any);
    });

    it("should process valid query successfully", async () => {
      const mockAIResponse = `Based on the available knowledge about Paguyuban Messe 2026:

Answer: The event is scheduled for August 7-8, 2026 at Arena Berlin.

Sources:
- Paguyuban Messe 2026 Brochure (Event Overview)

Confidence: 95%

Follow-up questions:
- What are the expected attendance figures?
- What is the venue capacity?`;

      vi.mocked(generateText).mockResolvedValue(mockAIResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/knowledge/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: "When is Paguyuban Messe 2026 happening?",
            maxSources: 3,
            includeSources: true,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("answer");
      expect(data).toHaveProperty("sources");
      expect(data).toHaveProperty("confidence");
      expect(data).toHaveProperty("suggestedFollowUp");
      expect(data).toHaveProperty("timestamp");
    });

    it("should validate required fields", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/knowledge/query",
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
        "http://localhost:3000/api/knowledge/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: "",
            maxSources: 3,
            includeSources: true,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
    });

    it("should handle AI service errors gracefully", async () => {
      vi.mocked(generateText).mockRejectedValue(
        new Error("AI service unavailable")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/knowledge/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: "What is the event location?",
            maxSources: 3,
            includeSources: true,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty("error");
      expect(data.error).toContain("Failed to process knowledge query");
    });

    it("should respect maxSources parameter", async () => {
      const mockAIResponse = `Answer: The event is at Arena Berlin.

Sources:
- Source 1
- Source 2
- Source 3
- Source 4
- Source 5

Confidence: 90%`;

      vi.mocked(generateText).mockResolvedValue(mockAIResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/knowledge/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: "Where is the event?",
            maxSources: 2,
            includeSources: true,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sources).toHaveLength(2);
    });

    it("should include source citations when requested", async () => {
      const mockAIResponse = `Answer: The event takes place at Arena Berlin.

Sources:
- Paguyuban Messe 2026 Brochure (Event Overview)

Confidence: 85%`;

      vi.mocked(generateText).mockResolvedValue(mockAIResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/knowledge/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: "Where is Paguyuban Messe 2026?",
            maxSources: 3,
            includeSources: true,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sources).toBeDefined();
      expect(data.sources.length).toBeGreaterThan(0);
      expect(data.sources[0]).toHaveProperty("document");
      expect(data.sources[0]).toHaveProperty("section");
      expect(data.sources[0]).toHaveProperty("relevance");
    });

    it("should provide confidence scoring", async () => {
      const mockAIResponse = `Answer: The event is scheduled for August 7-8, 2026.

Confidence: 92%

Sources:
- Event brochure`;

      vi.mocked(generateText).mockResolvedValue(mockAIResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/knowledge/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: "When is the event?",
            maxSources: 3,
            includeSources: true,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("confidence");
      expect(typeof data.confidence).toBe("number");
      expect(data.confidence).toBeGreaterThan(0);
      expect(data.confidence).toBeLessThanOrEqual(1);
    });

    it("should generate follow-up questions", async () => {
      const mockAIResponse = `Answer: The event features multiple venues including the main hall, beach club, and club area.

Follow-up questions:
- What is the capacity of each venue?
- Are there any special features in the beach club?
- What entertainment is scheduled for the club area?

Confidence: 88%`;

      vi.mocked(generateText).mockResolvedValue(mockAIResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/knowledge/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: "What venues are available at Paguyuban Messe 2026?",
            maxSources: 3,
            includeSources: true,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("suggestedFollowUp");
      expect(Array.isArray(data.suggestedFollowUp)).toBe(true);
      expect(data.suggestedFollowUp.length).toBeGreaterThan(0);
    });

    it("should handle malformed AI responses gracefully", async () => {
      const malformedResponse = "This is not a properly formatted response";
      vi.mocked(generateText).mockResolvedValue(malformedResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/knowledge/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: "What is the event about?",
            maxSources: 3,
            includeSources: true,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("answer");
      expect(data.answer).toBe(malformedResponse);
      expect(data).toHaveProperty("sources");
      expect(data).toHaveProperty("confidence");
      expect(data).toHaveProperty("timestamp");
    });

    it("should handle very long queries", async () => {
      const longQuery = "a".repeat(1000);
      const mockAIResponse = `Answer: This is a response to a very long query.

Confidence: 75%`;

      vi.mocked(generateText).mockResolvedValue(mockAIResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/knowledge/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: longQuery,
            maxSources: 3,
            includeSources: true,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("answer");
    });

    it("should reject queries that are too long", async () => {
      const tooLongQuery = "a".repeat(1001);

      const request = new NextRequest(
        "http://localhost:3000/api/knowledge/query",
        {
          method: "POST",
          body: JSON.stringify({
            query: tooLongQuery,
            maxSources: 3,
            includeSources: true,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
      expect(data.error).toContain("Query too long");
    });
  });
});
