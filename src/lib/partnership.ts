// Client utility for Partnership Recommendation API
// POST /api/admin/partnership/recommend

import type { RecommendationsData } from "@/types/recommendations";
export type PartnershipRecommendationResponse = RecommendationsData;

export interface ProspectInput {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  interest?: string | null;
  budget?: string | null;
}

export interface RecommendOptions {
  sentiment?: string | null;
  prospect?: ProspectInput | null;
  summary?: string | null;
  signal?: AbortSignal;
}

export async function recommendPartnership(
  applicationId: string,
  opts: RecommendOptions = {}
): Promise<PartnershipRecommendationResponse> {
  if (!applicationId) throw new Error("applicationId is required");

  const res = await fetch("/api/admin/partnership/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      applicationId,
      sentiment: opts.sentiment ?? null,
      prospect: opts.prospect ?? null,
      summary: opts.summary ?? null,
    }),
    signal: opts.signal,
  });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) errMsg = `${errMsg}: ${body.error}`;
    } catch {}
    throw new Error(errMsg);
  }

  const data = (await res.json()) as PartnershipRecommendationResponse;
  // Minimal normalization to guarantee arrays/strings
  return {
    recommendedActions: Array.isArray(data.recommendedActions)
      ? data.recommendedActions
      : [],
    journey: Array.isArray(data.journey) ? data.journey : [],
    nextBestAction: data.nextBestAction || "",
    prospectSummary: data.prospectSummary || "",
    followUps: data.followUps,
    sentiment: data.sentiment ?? null,
  };
}
