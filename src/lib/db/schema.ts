import {
  pgTable,
  uuid,
  varchar,
  bigint,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const financialRevenueItems = pgTable("financial_revenue_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: varchar("category", { length: 255 }).notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  notes: text("notes"),
  evidenceUrl: text("evidence_url"),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const financialCostItems = pgTable("financial_cost_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: varchar("category", { length: 255 }).notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  notes: text("notes"),
  evidenceUrl: text("evidence_url"),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Speakers (public site domain) — minimal fields first; expand later as needed
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

// Artists — richer fields for detail dialog and deep links
export const artists = pgTable("artists", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }), // genre or role
  company: varchar("company", { length: 255 }), // label or org (optional)
  imageUrl: text("image_url"),
  bio: text("bio"),
  tags: text("tags").array(),
  slug: varchar("slug", { length: 255 }),
  instagram: text("instagram"),
  youtube: text("youtube"),
  twitter: text("twitter"),
  linkedin: text("linkedin"),
  website: text("website"),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
