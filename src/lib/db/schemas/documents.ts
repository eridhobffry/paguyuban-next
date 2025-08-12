import {
  pgTable,
  uuid,
  varchar,
  bigint,
  text,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// Executive Documents — modeled to match existing Neon table used by admin/public APIs
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  preview: text("preview").notNull(),
  pages: varchar("pages", { length: 50 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  // Stable per-document key/slug to decouple from type-based matching
  slug: varchar("slug", { length: 255 }),
  fileUrl: text("file_url"),
  externalUrl: text("external_url"),
  restricted: boolean("restricted").notNull().default(true),
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: varchar("mime_type", { length: 100 }),
  aiGenerated: boolean("ai_generated").notNull().default(false),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  marketingHighlights: jsonb("marketing_highlights"),
});
