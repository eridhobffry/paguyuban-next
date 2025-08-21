import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  artists,
  speakers,
  documents,
  analyticsSessions,
  analyticsEvents,
  analyticsSectionDurations,
  chatbotLogs,
  chatbotSummaries,
  sponsorTiers,
  sponsors,
  sponsorLogos,
} from "@/lib/db/schema";

// Base schemas generated from Drizzle schema (single source of truth)
export const artistInsertBase = createInsertSchema(artists);
export const artistSelectBase = createSelectSchema(artists);
export const speakerInsertBase = createInsertSchema(speakers);
export const speakerSelectBase = createSelectSchema(speakers);

// Sponsors & Tiers: base schemas
export const sponsorTierInsertBase = createInsertSchema(sponsorTiers);
export const sponsorTierSelectBase = createSelectSchema(sponsorTiers);
export const sponsorInsertBase = createInsertSchema(sponsors);
export const sponsorSelectBase = createSelectSchema(sponsors);
export const sponsorLogoInsertBase = createInsertSchema(sponsorLogos);
export const sponsorLogoSelectBase = createSelectSchema(sponsorLogos);

// Admin-facing schemas (create/update) — refine required fields
// Artists: instagram and youtube required; slug optional (auto-generated if blank)
export const artistAdminCreateSchema = artistInsertBase
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    instagram: z.string().url({ message: "Instagram URL is required" }),
    youtube: z.string().url({ message: "YouTube URL is required" }),
    slug: z.string().optional().nullable(),
    sortOrder: z.coerce.number().optional().nullable(),
  });

export const artistAdminUpdateSchema = z.object({
  id: z.string().uuid(),
  artist: artistAdminCreateSchema.partial(),
});

// Speakers: speakerType optional enum; keep all optional by default for now
export const speakerAdminCreateSchema = speakerInsertBase
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    sortOrder: z.coerce.number().optional().nullable(),
  });

export const speakerAdminUpdateSchema = z.object({
  id: z.string().uuid(),
  speaker: speakerAdminCreateSchema.partial(),
});

// Sponsor tiers: refine numeric fields to coerce numbers; features as string[]
export const sponsorTierAdminCreateSchema = sponsorTierInsertBase
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    price: z.coerce.number().optional().nullable(),
    available: z.coerce.number().optional().nullable(),
    sold: z.coerce.number().optional().nullable(),
    sortOrder: z.coerce.number().optional().nullable(),
    features: z.array(z.string()).optional().nullable(),
  });

export const sponsorTierAdminUpdateSchema = z.object({
  id: z.string().uuid(),
  tier: sponsorTierAdminCreateSchema.partial(),
});

// Sponsors: keep optional by default; coerce sortOrder
export const sponsorAdminCreateSchema = sponsorInsertBase
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    sortOrder: z.coerce.number().optional().nullable(),
  });

export const sponsorAdminUpdateSchema = z.object({
  id: z.string().uuid(),
  sponsor: sponsorAdminCreateSchema.partial(),
});

// Documents: base schemas generated from Drizzle
export const documentInsertBase = createInsertSchema(documents);
export const documentSelectBase = createSelectSchema(documents);

// Admin update schema (snake_case to match current admin UI payload)
export const documentAdminUpdateSnakeSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  preview: z.string().optional(),
  pages: z.string().optional(),
  type: z.string().optional(),
  icon: z.string().optional(),
  slug: z.string().optional().nullable(),
  file_url: z.string().url().optional().nullable(),
  external_url: z.string().url().optional().nullable(),
  restricted: z.boolean().optional(),
  marketing_highlights: z.array(z.string()).optional().nullable(),
});

// Analytics: base schemas (not exposed to FE yet)
export const analyticsSessionInsertBase = createInsertSchema(analyticsSessions);
export const analyticsSessionSelectBase = createSelectSchema(analyticsSessions);
export const analyticsEventInsertBase = createInsertSchema(analyticsEvents);
export const analyticsEventSelectBase = createSelectSchema(analyticsEvents);
export const analyticsSectionDurationInsertBase = createInsertSchema(
  analyticsSectionDurations
);
export const analyticsSectionDurationSelectBase = createSelectSchema(
  analyticsSectionDurations
);
export const chatbotLogInsertBase = createInsertSchema(chatbotLogs);
export const chatbotLogSelectBase = createSelectSchema(chatbotLogs);
export const chatbotSummaryInsertBase = createInsertSchema(chatbotSummaries);
export const chatbotSummarySelectBase = createSelectSchema(chatbotSummaries);
