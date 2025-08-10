import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { artists, speakers, documents } from "@/lib/db/schema";

// Base schemas generated from Drizzle schema (single source of truth)
export const artistInsertBase = createInsertSchema(artists);
export const artistSelectBase = createSelectSchema(artists);
export const speakerInsertBase = createInsertSchema(speakers);
export const speakerSelectBase = createSelectSchema(speakers);

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
  file_url: z.string().url().optional().nullable(),
  external_url: z.string().url().optional().nullable(),
  restricted: z.boolean().optional(),
});
