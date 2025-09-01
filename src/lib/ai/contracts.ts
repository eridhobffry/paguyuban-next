import { z } from "zod";

// Phase 7 Output Contracts

export const EventPlanSchema = z.object({
  title: z.string(),
  date_range: z.string(),
  city: z.string(),
  personas: z.array(z.string()),
  goals: z.array(z.string()),
  budget_band: z.string(),
  risks: z.array(z.string()),
  sponsor_targets: z.array(z.string()),
  next_actions: z.array(z.string()),
});

export type EventPlan = z.infer<typeof EventPlanSchema>;

export const AnalyticsReportSchema = z.object({
  question: z.string(),
  data_sources: z.array(z.string()),
  method: z.string(),
  findings: z.array(z.string()),
  caveats: z.array(z.string()).default([]),
  decisions: z.array(z.string()).default([]),
  appendix: z.record(z.string(), z.any()).default({}),
});

export type AnalyticsReport = z.infer<typeof AnalyticsReportSchema>;

export const ContractReviewSchema = z.object({
  doc_title: z.string(),
  clauses_risky: z.array(z.string()).default([]),
  redlines: z.array(z.string()).default([]),
  negotiation_positions: z.array(z.string()).default([]),
  summary: z.string(),
});

export type ContractReview = z.infer<typeof ContractReviewSchema>;

