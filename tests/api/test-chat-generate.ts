import { NextRequest } from "next/server";
import { POST } from "@/app/api/chat/generate/route";

// Mock fetch for testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("/api/chat/generate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully call Python AI service with valid request", async () => {
    // Mock successful response from Python AI service
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: "Hello! I am Ucup, your AI assistant for Paguyuban Messe.",
      }),
    });

    const request = new NextRequest("http://localhost:3000/api/chat/generate", {
      method: "POST",
      body: JSON.stringify({
        message: "Hello, can you help me?",
        assistantType: "ucup",
        mode: "auto",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      reply: "Hello! I am Ucup, your AI assistant for Paguyuban Messe.",
    });

    // Verify the Python AI service was called correctly
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8001/api/chat/generate",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          query: "Hello, can you help me?",
          context: {
            assistant_type: "ucup",
            mode: "auto",
          },
        }),
      })
    );
  });

  it("should handle Python AI service errors gracefully", async () => {
    // Mock error response from Python AI service
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    // Mock fallback to Gemini
    const mockGeminiChat = jest
      .fn()
      .mockResolvedValue("Fallback response from Gemini");
    jest.doMock("@/lib/gemini", () => ({
      paguyubanChat: {
        chat: mockGeminiChat,
      },
    }));

    const request = new NextRequest("http://localhost:3000/api/chat/generate", {
      method: "POST",
      body: JSON.stringify({
        message: "Hello, can you help me?",
        assistantType: "ucup",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      reply: "Fallback response from Gemini",
      fallback: true,
    });
  });

  it("should handle network errors gracefully", async () => {
    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    // Mock fallback to Gemini
    const mockGeminiChat = jest
      .fn()
      .mockResolvedValue("Fallback response from Gemini");
    jest.doMock("@/lib/gemini", () => ({
      paguyubanChat: {
        chat: mockGeminiChat,
      },
    }));

    const request = new NextRequest("http://localhost:3000/api/chat/generate", {
      method: "POST",
      body: JSON.stringify({
        message: "Hello, can you help me?",
        assistantType: "ucup",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      reply: "Fallback response from Gemini",
      fallback: true,
    });
  });

  it("should validate request body", async () => {
    const request = new NextRequest("http://localhost:3000/api/chat/generate", {
      method: "POST",
      body: JSON.stringify({
        // Missing required 'message' field
        assistantType: "ucup",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should handle empty message", async () => {
    const request = new NextRequest("http://localhost:3000/api/chat/generate", {
      method: "POST",
      body: JSON.stringify({
        message: "",
        assistantType: "ucup",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should use environment variable for AI service URL", async () => {
    // Set environment variable
    process.env.AI_SERVICE_URL = "http://custom-ai-service:9000";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: "Response from custom service" }),
    });

    const request = new NextRequest("http://localhost:3000/api/chat/generate", {
      method: "POST",
      body: JSON.stringify({
        message: "Hello",
        assistantType: "ucup",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    await POST(request);

    // Verify the custom URL was used
    expect(mockFetch).toHaveBeenCalledWith(
      "http://custom-ai-service:9000/api/chat/generate",
      expect.any(Object)
    );

    // Clean up
    delete process.env.AI_SERVICE_URL;
  });
});
