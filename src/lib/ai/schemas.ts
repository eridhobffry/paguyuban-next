import { z } from "zod";

// Shared AI schemas and types
export const AiSummarySchema = z.object({
  summary: z.string().min(1),
  topics: z.array(z.string()).min(1),
  sentiment: z.enum(["positive", "neutral", "negative"]),
});

export type SummaryData = z.infer<typeof AiSummarySchema>;
