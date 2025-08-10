import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Speakers (public site domain)
export const speakers = pgTable("speakers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }),
  company: varchar("company", { length: 255 }),
  imageUrl: text("image_url"),
  bio: text("bio"),
  tags: text("tags").array(),
  slug: varchar("slug", { length: 255 }),
  // summit | main_stage (aligns with domain). Stored as varchar to match Neon; enforce via zod in API.
  speakerType: varchar("speaker_type", { length: 50 }),
  twitter: text("twitter"),
  linkedin: text("linkedin"),
  website: text("website"),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
