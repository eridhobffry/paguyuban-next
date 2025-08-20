import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
  bigint,
  jsonb,
} from "drizzle-orm/pg-core";

// Sponsor tiers (e.g., Platinum, Gold, Silver)
export const sponsorTiers = pgTable("sponsor_tiers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }),
  description: text("description"),
  price: bigint("price", { mode: "number" }),
  available: integer("available"),
  sold: integer("sold"),
  color: varchar("color", { length: 100 }),
  features: jsonb("features"),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Sponsors (linked to tiers)
export const sponsors = pgTable("sponsors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url"),
  logoUrl: text("logo_url"),
  slug: varchar("slug", { length: 255 }),
  tierId: uuid("tier_id").references(() => sponsorTiers.id, {
    onDelete: "set null",
  }),
  tags: text("tags").array(),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Optional: multiple logos per sponsor (e.g., dark/light variants)
export const sponsorLogos = pgTable("sponsor_logos", {
  id: uuid("id").defaultRandom().primaryKey(),
  sponsorId: uuid("sponsor_id")
    .notNull()
    .references(() => sponsors.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 50 }),
  url: text("url").notNull(),
  width: integer("width"),
  height: integer("height"),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
