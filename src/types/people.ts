import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { artists, speakers } from "@/lib/db/schema";

// Speakers — mirror DB exactly
export type Speaker = InferSelectModel<typeof speakers>;
export type NewSpeaker = InferInsertModel<typeof speakers>;

// Analytics: local types (not exported elsewhere yet)
export type AnalyticsSession = InferSelectModel<
  typeof import("@/lib/db/schema").analyticsSessions
>;
export type AnalyticsEvent = InferSelectModel<
  typeof import("@/lib/db/schema").analyticsEvents
>;
export type AnalyticsSectionDuration = InferSelectModel<
  typeof import("@/lib/db/schema").analyticsSectionDurations
>;
export type ChatbotLog = InferSelectModel<
  typeof import("@/lib/db/schema").chatbotLogs
>;
export type ChatbotSummary = InferSelectModel<
  typeof import("@/lib/db/schema").chatbotSummaries
>;

// Artists — mirror DB exactly
export type Artist = InferSelectModel<typeof artists>;
export type NewArtist = InferInsertModel<typeof artists>;

// Public DTOs (optional): what our public endpoints commonly expose
export type PublicArtistDto = Pick<
  Artist,
  | "id"
  | "name"
  | "role"
  | "company"
  | "imageUrl"
  | "slug"
  | "instagram"
  | "youtube"
  | "twitter"
  | "linkedin"
  | "website"
>;
export type PublicSpeakerDto = {
  id: Speaker["id"];
  name: Speaker["name"];
  role?: Speaker["role"];
  company?: Speaker["company"];
  imageUrl?: string | null; // standardized to camelCase
  slug?: Speaker["slug"] | null;
  twitter?: Speaker["twitter"];
  linkedin?: Speaker["linkedin"];
  website?: Speaker["website"];
};
