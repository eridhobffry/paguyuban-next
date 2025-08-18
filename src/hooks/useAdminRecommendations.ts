"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatRecommendationsData } from "@/types/analytics";
import type { Priority } from "@/types/recommendations";

type CacheEntry = {
  data: ChatRecommendationsData;
  createdAt: number; // ms epoch
};

type RecommendCacheState = {
  entries: Record<string, CacheEntry>;
  ttlMs: number;
  get: (key: string) => ChatRecommendationsData | null;
  set: (key: string, data: ChatRecommendationsData) => void;
  clearExpired: () => void;
};

// Key builder ensures same prompt yields same cache key
export function buildRecommendKey(args: {
  sessionId: string;
  summary: string;
  sentiment: string | null;
  prospect?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    interest?: string | null;
    budget?: string | null;
  };
}) {
  // Keep it deterministic and compact
  const p = args.prospect || {};
  const base = `${args.sessionId}||${args.sentiment || ""}||${args.summary}||${
    p.name || ""
  }||${p.email || ""}||${p.phone || ""}||${p.company || ""}||${
    p.interest || ""
  }||${p.budget || ""}`;
  // Simple hash to avoid oversized localStorage keys
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const chr = base.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return `rec:${hash}`;
}

export const useRecommendCache = create<RecommendCacheState>()(
  persist(
    (set, get) => ({
      entries: {},
      // Default TTL 12 hours; override by calling set({ ttlMs }) if needed
      ttlMs: 12 * 60 * 60 * 1000,
      get: (key: string) => {
        const state = get();
        const entry = state.entries[key];
        if (!entry) return null;
        const isExpired = Date.now() - entry.createdAt > state.ttlMs;
        if (isExpired) {
          const rest = { ...state.entries };
          delete rest[key];
          set({ entries: rest });
          return null;
        }
        return entry.data;
      },
      set: (key: string, data: ChatRecommendationsData) => {
        set((s) => ({
          entries: {
            ...s.entries,
            [key]: { data, createdAt: Date.now() },
          },
        }));
      },
      clearExpired: () => {
        const state = get();
        const next: Record<string, CacheEntry> = {};
        const now = Date.now();
        for (const [k, v] of Object.entries(state.entries)) {
          if (now - v.createdAt <= state.ttlMs) next[k] = v;
        }
        set({ entries: next });
      },
    }),
    {
      name: "admin-recommend-cache-v1",
      version: 1,
      partialize: (state) => ({ entries: state.entries, ttlMs: state.ttlMs }),
    }
  )
);

// Helper to fetch with cache
export async function getRecommendationsWithCache(
  args: {
    sessionId: string;
    summary: string;
    sentiment: string | null;
    prospect?: {
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      company?: string | null;
      interest?: string | null;
      budget?: string | null;
    };
  },
  opts?: { force?: boolean }
): Promise<ChatRecommendationsData> {
  const cache = useRecommendCache.getState();
  const key = buildRecommendKey(args);
  const cached = opts?.force ? null : cache.get(key);
  if (cached) return cached;

  const res = await fetch("/api/admin/analytics/chat/recommend", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  const json = (await res.json()) as {
    recommendedActions: Array<{
      title: string;
      description: string;
      priority?: string;
    }>;
    journey: Array<{
      stage: string;
      insight: string;
      risk?: string;
      recommendation?: string;
    }>;
    nextBestAction: string;
    prospectSummary?: string;
    followUps?: {
      emailPositive?: string;
      emailNeutral?: string;
      emailNegative?: string;
      whatsappPositive?: string;
      whatsappNeutral?: string;
      whatsappNegative?: string;
    };
    sentiment?: string | null;
  };
  const toPriority = (p?: string): Priority | undefined =>
    p === "high" || p === "medium" || p === "low" ? p : undefined;

  const data: ChatRecommendationsData = {
    nextBestAction: json.nextBestAction,
    recommendedActions: json.recommendedActions.map((a) => ({
      title: a.title,
      description: a.description,
      priority: toPriority(a.priority),
    })),
    journey: json.journey,
    prospectSummary: json.prospectSummary,
    followUps: json.followUps,
    sentiment: json.sentiment ?? null,
  };
  cache.set(key, data);
  return data;
}
