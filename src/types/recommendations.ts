// Shared recommendation-related types used by analytics and partnership modules

export type Priority = "high" | "medium" | "low";

export type RecommendedAction = {
  title: string;
  description: string;
  // Optional to accommodate AI outputs that may omit it
  priority?: Priority;
};

export type JourneyItem = {
  stage: string;
  insight: string;
  // Optional to align across modules
  risk?: string;
  recommendation?: string;
};

export type FollowUps = {
  emailPositive?: string;
  emailNeutral?: string;
  emailNegative?: string;
  whatsappPositive?: string;
  whatsappNeutral?: string;
  whatsappNegative?: string;
};

// Main recommendations data shape used for UI rendering and API responses
export type RecommendationsData = {
  nextBestAction: string;
  recommendedActions: RecommendedAction[];
  journey: JourneyItem[];
  prospectSummary?: string;
  // Optional sentiment to select appropriate follow-up templates
  sentiment?: string | null;
  followUps?: FollowUps;
};
