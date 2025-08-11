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
