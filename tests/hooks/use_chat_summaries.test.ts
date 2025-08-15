import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChatSummaries } from "@/hooks/useChatSummaries";

describe("useChatSummaries", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads first page and supports pagination and delete", async () => {
    const first = {
      items: Array.from({ length: 2 }).map((_, i) => ({
        id: `id-${i + 1}`,
        sessionId: `sess-${i + 1}`,
        summary: `sum ${i + 1}`,
        sentiment: i % 2 ? "positive" : null,
        createdAt: new Date().toISOString(),
      })),
      nextCursor: "cursor-1",
    };
    const second = {
      items: [
        {
          id: "id-3",
          sessionId: "sess-3",
          summary: "sum 3",
          sentiment: "neutral",
          createdAt: new Date().toISOString(),
        },
      ],
      nextCursor: null,
    };

    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockImplementation(async (url: any, init: any) => {
        const u = String(url);
        if (
          u.includes("/api/admin/analytics/summaries") &&
          !u.includes("cursor")
        ) {
          return { ok: true, json: async () => first } as any;
        }
        if (u.includes("cursor")) {
          return { ok: true, json: async () => second } as any;
        }
        if (init?.method === "DELETE") {
          return { ok: true, json: async () => ({ id: "id-1" }) } as any;
        }
        return { ok: true, json: async () => ({}) } as any;
      });

    const { result: hook } = renderHook(() => useChatSummaries("7d"));

    // Let initial load run
    await act(async () => {});
    expect(hook.current.summaries.length).toBe(2);
    expect(hook.current.hasMore).toBe(true);

    await act(async () => {
      await hook.current.loadMore();
    });
    expect(hook.current.summaries.length).toBe(3);

    await act(async () => {
      await hook.current.deleteSummary("id-1");
    });
    expect(hook.current.summaries.find((s) => s.id === "id-1")).toBeUndefined();

    fetchMock.mockRestore();
  });
});
