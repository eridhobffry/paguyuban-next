import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  analyticsSessions,
  analyticsEvents,
  analyticsSectionDurations,
  chatbotLogs,
  chatbotSummaries,
} from "@/lib/db/schema";
import type {
  RecommendedAction as SharedRecommendedAction,
  JourneyItem as SharedJourneyItem,
  RecommendationsData,
} from "@/types/recommendations";

export type AnalyticsSession = InferSelectModel<typeof analyticsSessions>;
export type NewAnalyticsSession = InferInsertModel<typeof analyticsSessions>;

export type AnalyticsEvent = InferSelectModel<typeof analyticsEvents>;
export type NewAnalyticsEvent = InferInsertModel<typeof analyticsEvents>;

export type AnalyticsSectionDuration = InferSelectModel<typeof analyticsSectionDurations>;
export type NewAnalyticsSectionDuration = InferInsertModel<typeof analyticsSectionDurations>;

export type ChatbotLog = InferSelectModel<typeof chatbotLogs>;
export type NewChatbotLog = InferInsertModel<typeof chatbotLogs>;

export type ChatbotSummary = InferSelectModel<typeof chatbotSummaries>;
export type NewChatbotSummary = InferInsertModel<typeof chatbotSummaries>;

// Re-export/shared types for recommendations to dedupe across modules
export type RecommendedAction = SharedRecommendedAction;
export type JourneyItem = SharedJourneyItem;
// Backward-compatible alias for existing imports
export type ChatRecommendationsData = RecommendationsData;

// Shared list item used by summaries and follow-ups UIs
export type SummaryItem = {
  id?: string;
  sessionId: string;
  summary: string;
  sentiment: string | null;
  createdAt: string;
};

// Back-compat aliases for existing code
export type ChatSummaryItem = SummaryItem;
export type FollowUpItem = SummaryItem;
