import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatAssistantSection from "@/components/sections/ChatAssistantSection";

// Mock dependencies
const mockFetch = vi.fn();
const mockDispatchEvent = vi.fn();

// Mock global fetch and window.dispatchEvent
global.fetch = mockFetch;
global.window.dispatchEvent = mockDispatchEvent;

// Mock the analytics client
vi.mock("@/lib/analytics/client", () => ({
  getCurrentAnalyticsSessionId: vi.fn(() => "test-session-id"),
}));

// Mock framer-motion to avoid animation complexities in tests
vi.mock("framer-motion", () => ({
  motion: {
    button: ({ children, onClick, whileHover, whileTap, ...props }: any) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    AnimatePresence: ({ children }: any) => <>{children}</>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("ChatAssistantSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();

    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        reply:
          "Halo! Saya Bang Ucup, siap membantu Anda dengan informasi tentang Nusantara Messe 2026.",
      }),
    });
    mockDispatchEvent.mockImplementation(() => true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render the floating chat button", () => {
      render(<ChatAssistantSection />);
      const chatButton = screen.getByRole("button", { name: "!" });
      expect(chatButton).toBeInTheDocument();
      expect(chatButton).toBeVisible();
    });

    it("should not show chat interface initially", () => {
      render(<ChatAssistantSection />);
      expect(screen.queryByText("Bang Ucup")).not.toBeInTheDocument();
      expect(screen.queryByText("Neng Rima")).not.toBeInTheDocument();
    });

    it("should show notification badge on chat button", () => {
      render(<ChatAssistantSection />);
      const badge = screen.getByText("!");
      expect(badge).toBeInTheDocument();
      // The badge is the span, the bg-red-500 class is on the parent div
      const badgeContainer = badge.parentElement;
      expect(badgeContainer).toHaveClass("bg-red-500");
    });
  });

  describe("Chat Opening", () => {
    it("should open chat interface when button is clicked", async () => {
      const user = userEvent.setup();
      render(<ChatAssistantSection />);

      const chatButton = screen.getByRole("button", { name: "!" });
      await user.click(chatButton);

      // Should show assistant selection
      await waitFor(() => {
        expect(screen.getByText("Bang Ucup")).toBeInTheDocument();
        expect(screen.getByText("Neng Rima")).toBeInTheDocument();
      });
    });

    it("should track chat opened analytics event", async () => {
      const user = userEvent.setup();
      render(<ChatAssistantSection />);

      const chatButton = screen.getByRole("button", { name: "!" });
      await user.click(chatButton);

      await waitFor(() => {
        expect(mockDispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: expect.objectContaining({
              type: "chat_opened",
              data: expect.objectContaining({
                source: "floating_button",
                timestamp: expect.any(String),
              }),
            }),
          })
        );
      });
    });
  });

  describe("Quick Actions", () => {
    it("should show quick actions after opening chat", async () => {
      const user = userEvent.setup();
      render(<ChatAssistantSection />);

      const chatButton = screen.getByRole("button", { name: "!" });
      await user.click(chatButton);

      await waitFor(() => {
        const ucupButton = screen.getByText("👨🏽‍💼 Bang Ucup");
        return user.click(ucupButton);
      });

      // Quick actions should be visible
      await waitFor(() => {
        expect(screen.getByText("Quick Actions:")).toBeInTheDocument();
        expect(screen.getByText("💼 Sponsorship Info")).toBeInTheDocument();
        expect(screen.getByText("📊 ROI Calculator")).toBeInTheDocument();
      });
    });

    it("should handle quick action clicks", async () => {
      const user = userEvent.setup();
      render(<ChatAssistantSection />);

      const chatButton = screen.getByRole("button", { name: "!" });
      await user.click(chatButton);

      await waitFor(() => {
        const ucupButton = screen.getByText("👨🏽‍💼 Bang Ucup");
        return user.click(ucupButton);
      });

      // Click sponsorship quick action
      await waitFor(() => {
        const sponsorshipButton = screen.getByText("💼 Sponsorship Info");
        return user.click(sponsorshipButton);
      });

      // Should send request to API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/chat/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: expect.stringContaining("sponsorship"),
        });
      });

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            type: "chat_quick_action",
            data: expect.objectContaining({
              action: "sponsorship",
            }),
          }),
        })
      );
    });
  });

  describe("Message Handling", () => {
    it("should send user messages and receive responses", async () => {
      const user = userEvent.setup();
      render(<ChatAssistantSection />);

      const chatButton = screen.getByRole("button", { name: "!" });
      await user.click(chatButton);

      await waitFor(() => {
        const ucupButton = screen.getByText("👨🏽‍💼 Bang Ucup");
        return user.click(ucupButton);
      });

      // Type and send message
      const input = screen.getByPlaceholderText("Ketik pertanyaan Anda...");
      const sendButton = screen.getByRole("button", { name: /send/i });

      await user.type(input, "Hello");
      await user.click(sendButton);

      // Should send request to API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/chat/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: expect.stringContaining("Hello"),
        });
      });

      // Should show assistant response
      await waitFor(() => {
        expect(
          screen.getByText(
            "Halo! Saya Bang Ucup, siap membantu Anda dengan informasi tentang Nusantara Messe 2026."
          )
        ).toBeInTheDocument();
      });
    });

    it("should show suggested questions initially", async () => {
      const user = userEvent.setup();
      render(<ChatAssistantSection />);

      const chatButton = screen.getByRole("button", { name: "!" });
      await user.click(chatButton);

      await waitFor(() => {
        const ucupButton = screen.getByText("👨🏽‍💼 Bang Ucup");
        return user.click(ucupButton);
      });

      // Should show suggested questions
      await waitFor(() => {
        expect(screen.getByText("Pertanyaan Umum:")).toBeInTheDocument();
        expect(
          screen.getByText("Kapan dan dimana acara Nusantara Messe 2026?")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Analytics Tracking", () => {
    it("should track chat messages", async () => {
      const user = userEvent.setup();
      render(<ChatAssistantSection />);

      const chatButton = screen.getByRole("button", { name: "!" });
      await user.click(chatButton);

      await waitFor(() => {
        const ucupButton = screen.getByText("👨🏽‍💼 Bang Ucup");
        return user.click(ucupButton);
      });

      // Send message
      const input = screen.getByPlaceholderText("Ketik pertanyaan Anda...");
      const sendButton = screen.getByRole("button", { name: /send/i });

      await user.type(input, "Analytics test");
      await user.click(sendButton);

      // Should track user message
      await waitFor(() => {
        expect(mockDispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: expect.objectContaining({
              type: "chat_message",
              data: expect.objectContaining({
                role: "user",
                content: "Analytics test",
              }),
            }),
          })
        );
      });

      // Should track assistant response
      await waitFor(() => {
        expect(mockDispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: expect.objectContaining({
              type: "chat_message",
              data: expect.objectContaining({
                role: "assistant",
              }),
            }),
          })
        );
      });
    });
  });
});
