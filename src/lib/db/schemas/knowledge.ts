import { pgTable, uuid, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

// Knowledge overlay for dynamic chat knowledge management
export const knowledge = pgTable("knowledge", {
  id: uuid("id").defaultRandom().primaryKey(),
  overlay: jsonb("overlay").$type<Record<string, any>>().notNull().default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
