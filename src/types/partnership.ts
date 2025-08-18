// Centralized partnership application types for use across SQL layer, API routes, and tests

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  partnership_applications,
  partnership_application_recommendations,
} from "@/lib/db/schema";

// DB row types derived from Drizzle schemas (snake_case keys match the database)
export type PartnershipApplication = InferSelectModel<
  typeof partnership_applications
>;

export interface PartnershipApplicationInput {
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  interest?: string | null;
  budget?: string | null;
  message?: string | null;
  source?: string | null;
}

export type PartnershipApplicationRecommendation = InferSelectModel<
  typeof partnership_application_recommendations
>;

export interface PartnershipApplicationRecommendationInput {
  applicationId: string;
  sentiment?: string | null;
  recommendedActions?: unknown;
  journey?: unknown;
  followUps?: unknown;
  nextBestAction?: string | null;
  prospectSummary?: string | null;
}

// Convenience insert types if needed elsewhere
export type NewPartnershipApplication = InferInsertModel<
  typeof partnership_applications
>;
export type NewPartnershipApplicationRecommendation = InferInsertModel<
  typeof partnership_application_recommendations
>;
