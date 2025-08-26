import { NextRequest } from "next/server";
import { POST } from "@/app/api/chat/generate/route";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("/api/chat/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully call Python AI service with valid request", async () => {
    // Mock successful EventChatAgent response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result:
          "Paguyuban Messe 2026 is a business and entertainment event featuring 4 Indonesian artists. The event will be held on August 7-8, 2026 at Arena Berlin in 6,500m² exhibition space.",
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
      reply:
        "Paguyuban Messe 2026 is a business and entertainment event featuring 4 Indonesian artists. The event will be held on August 7-8, 2026 at Arena Berlin in 6,500m² exhibition space.",
      agent: "event_chat",
      fallback: false,
    });

    // Verify the EventChatAgent was called correctly
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8001/api/event/chat",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          query: "Hello, can you help me?",
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
    const mockGeminiChat = vi
      .fn()
      .mockResolvedValue("Fallback response from Gemini");
    vi.doMock("@/lib/gemini", () => ({
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
    const mockGeminiChat = vi
      .fn()
      .mockResolvedValue("Fallback response from Gemini");
    vi.doMock("@/lib/gemini", () => ({
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

  it("should use EventChatAgent for event-specific questions", async () => {
    // Mock successful EventChatAgent response
    mockFetch.mockImplementationOnce((url: string, options: any) => {
      if (url.includes("/api/event/chat")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            result: "Paguyuban Messe 2026 will be held on August 7-8, 2026.",
          }),
        });
      }
      return Promise.reject(new Error("Should not reach general chat"));
    });

    const request = new NextRequest("http://localhost:3000/api/chat/generate", {
      method: "POST",
      body: JSON.stringify({
        message: "When is the event?",
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
      reply: "Paguyuban Messe 2026 will be held on August 7-8, 2026.",
      agent: "event_chat",
      fallback: false,
    });

    // Verify EventChatAgent was called
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8001/api/event/chat",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          query: "When is the event?",
        }),
      })
    );
  });

  it("should fallback to Gemini when both EventChatAgent and conversational agent fail", async () => {
    // Mock EventChatAgent failure and conversational agent failure
    mockFetch.mockImplementationOnce((url: string, options: any) => {
      if (url.includes("/api/event/chat")) {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      // Mock conversational agent failure
      return Promise.resolve({
        ok: false,
        status: 500,
      });
    });

    const request = new NextRequest("http://localhost:3000/api/chat/generate", {
      method: "POST",
      body: JSON.stringify({
        message: "What can you tell me about the event?",
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
});
