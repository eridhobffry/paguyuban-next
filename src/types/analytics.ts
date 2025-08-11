import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  analyticsSessions,
  analyticsEvents,
  analyticsSectionDurations,
  chatbotLogs,
  chatbotSummaries,
} from "@/lib/db/schema";

export type AnalyticsSession = InferSelectModel<typeof analyticsSessions>;
export type NewAnalyticsSession = InferInsertModel<typeof analyticsSessions>;

export type AnalyticsEvent = InferSelectModel<typeof analyticsEvents>;
export type NewAnalyticsEvent = InferInsertModel<typeof analyticsEvents>;

export type AnalyticsSectionDuration = InferSelectModel<
  typeof analyticsSectionDurations
>;
export type NewAnalyticsSectionDuration = InferInsertModel<
  typeof analyticsSectionDurations
>;

export type ChatbotLog = InferSelectModel<typeof chatbotLogs>;
export type NewChatbotLog = InferInsertModel<typeof chatbotLogs>;

export type ChatbotSummary = InferSelectModel<typeof chatbotSummaries>;
export type NewChatbotSummary = InferInsertModel<typeof chatbotSummaries>;
