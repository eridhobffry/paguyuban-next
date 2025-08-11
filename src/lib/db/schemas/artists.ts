import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Artists
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
