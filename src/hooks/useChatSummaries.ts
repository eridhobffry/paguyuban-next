"use client";

import { useEffect, useState } from "react";

export type ChatSummary = {
  id?: string;
  sessionId: string;
  summary: string;
  sentiment: string | null;
  createdAt: string;
};

export function useChatSummaries(range: "7d" | "30d" | "90d" = "30d") {
  const [summaries, setSummaries] = useState<ChatSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadPage(cursor?: string | null) {
      try {
        setLoading(true);
        const url = new URL(
          `/api/admin/analytics/summaries`,
          window.location.origin
        );
        url.searchParams.set("range", range);
        url.searchParams.set("limit", "10");
        if (cursor) url.searchParams.set("cursor", cursor);
        const res = await fetch(url.toString(), {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as {
          items: ChatSummary[];
          nextCursor: string | null;
        };
        if (cancelled) return;
        if (!cursor) setSummaries(json.items);
        else setSummaries((prev) => [...prev, ...json.items]);
        setNextCursor(json.nextCursor);
      } catch (e) {
        // keep silent on dashboard/analytics; no crash
        console.warn("Failed to load summaries", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadPage(null);
    return () => {
      cancelled = true;
    };
  }, [range]);

  async function loadMore() {
    if (!nextCursor || loading) return;
    const url = new URL(
      `/api/admin/analytics/summaries`,
      window.location.origin
    );
    url.searchParams.set("range", range);
    url.searchParams.set("limit", "10");
    url.searchParams.set("cursor", nextCursor);
    const res = await fetch(url.toString(), {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return;
    const json = (await res.json()) as {
      items: ChatSummary[];
      nextCursor: string | null;
    };
    setSummaries((prev) => [...prev, ...json.items]);
    setNextCursor(json.nextCursor);
  }

  async function deleteSummary(id?: string) {
    console.log("Deleting summary", id);
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/analytics/summaries`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSummaries((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Failed to delete summary");
    }
  }

  return {
    summaries,
    loading,
    hasMore: Boolean(nextCursor),
    loadMore,
    deleteSummary,
  };
}
