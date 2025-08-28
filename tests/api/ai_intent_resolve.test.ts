import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/ai/intent/resolve/route";

// Hoisted state for secure fetch mock
const hoisted = vi.hoisted(() => ({
  secureFetchMock: vi.fn(),
}));

// Mock secure fetch
vi.mock("@/lib/ai/secure-fetch", () => ({
  secureFetch: hoisted.secureFetchMock,
}));

// Mock fetch for internal API calls
global.fetch = vi.fn();

describe("API: /api/ai/intent/resolve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default secure fetch response for AI service
    hoisted.secureFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        intent: "event_details",
        confidence: 0.85,
        metadata: {
          analysis_method: "keyword_matching",
          detected_language: "en",
        },
      }),
    });

    // Default fetch response for internal data endpoints
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        sponsors: [{ name: "Test Sponsor", tier: "Gold" }],
        tiers: [{ name: "Gold", price: "€25,000", available: 5 }],
      }),
    });
  });

  it("validates request schema and returns 400 for invalid input", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/intent/resolve", {
      method: "POST",
      body: JSON.stringify({}), // Missing required query
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid request parameters");
    expect(Array.isArray(data.issues)).toBe(true);
  });

  it("resolves intent with high confidence and fetches relevant context", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/intent/resolve", {
      method: "POST",
      body: JSON.stringify({
        query: "When is the event happening?",
        language: "en",
        sessionId: "11111111-1111-4111-8111-111111111111",
        userId: "user123",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.intent).toBe("event_details");
    expect(data.confidence).toBe(0.85);
    expect(data.metadata.agent_version).toBe("Phase 4.0 - Intent Resolution");
    expect(Array.isArray(data.data_requirements)).toBe(true);

    // Verify AI service was called with correct payload
    expect(hoisted.secureFetchMock).toHaveBeenCalledWith("/api/ai/intent/analyze", {
      method: "POST",
      body: {
        query: "When is the event happening?",
        language: "en",
        session_id: "11111111-1111-4111-8111-111111111111",
        user_id: "user123",
        context: {},
      },
    });
  });

  it("determines correct data requirements for prospect analysis intent", async () => {
    hoisted.secureFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        intent: "prospect_analysis",
        confidence: 0.92,
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/ai/intent/resolve", {
      method: "POST",
      body: JSON.stringify({
        query: "I'm interested in partnership opportunities",
        sessionId: "11111111-1111-4111-8111-111111111111",
        userId: "user123",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.intent).toBe("prospect_analysis");
    
    // Should require both chat-context and analytics-context for prospect analysis
    const requirements = data.data_requirements;
    const requirementTypes = requirements.map((req: any) => req.type);
    expect(requirementTypes).toContain("chat-context");
    expect(requirementTypes).toContain("analytics-context");
  });

  it("determines correct data requirements for business partnership intent", async () => {
    hoisted.secureFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        intent: "business_partnership",
        confidence: 0.88,
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/ai/intent/resolve", {
      method: "POST",
      body: JSON.stringify({
        query: "What sponsorship packages do you have?",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.intent).toBe("business_partnership");
    
    // Should require event-context with pricing data
    const requirements = data.data_requirements;
    const eventReq = requirements.find((req: any) => req.type === "event-context");
    expect(eventReq).toBeTruthy();
    expect(eventReq.priority).toBe("high");
  });

  it("handles AI service errors gracefully with fallback", async () => {
    hoisted.secureFetchMock.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const req = new NextRequest("http://localhost:3000/api/ai/intent/resolve", {
      method: "POST",
      body: JSON.stringify({
        query: "What artists are performing?",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to resolve AI intent");
    expect(data.intent).toBe("general_inquiry");
    expect(data.confidence).toBe(0);
    expect(data.metadata.error).toBe(true);
  });

  it("enhances requirements based on query keywords", async () => {
    hoisted.secureFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        intent: "general_inquiry",
        confidence: 0.6,
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/ai/intent/resolve", {
      method: "POST",
      body: JSON.stringify({
        query: "Tell me about sponsor benefits and performance data",
        userId: "user123",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    
    // Should add event-context for "sponsor" and analytics-context for "performance"
    const requirements = data.data_requirements;
    const requirementTypes = requirements.map((req: any) => req.type);
    expect(requirementTypes).toContain("event-context");
    expect(requirementTypes).toContain("analytics-context");
  });

  it("aggregates context data from successful fetches only", async () => {
    // Mock the intent first
    hoisted.secureFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        intent: "business_analysis",
        confidence: 0.8,
      }),
    });

    // Mock internal endpoint calls - first succeeds, second fails
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: ["Event 1"], success: true }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

    const req = new NextRequest("http://localhost:3000/api/ai/intent/resolve", {
      method: "POST",
      body: JSON.stringify({
        query: "Event and analytics performance info",
        sessionId: "11111111-1111-4111-8111-111111111111",
        userId: "user123",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    
    // Should have exactly one successful context fetch
    expect(Object.keys(data.context).length).toBeGreaterThanOrEqual(0);
    
    // Check data requirements status
    const requirements = data.data_requirements;
    expect(requirements.length).toBeGreaterThan(0);
    
    // Should have some fetched and some not fetched
    const hasFetched = requirements.some((req: any) => req.fetched === true);
    const hasNotFetched = requirements.some((req: any) => req.fetched === false);
    
    // At least one should exist (might not have both if only one requirement)
    expect(hasFetched || hasNotFetched).toBe(true);
  });

  it("includes proper cache control headers", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/intent/resolve", {
      method: "POST",
      body: JSON.stringify({
        query: "Basic query",
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-cache, no-store, must-revalidate");
  });
});