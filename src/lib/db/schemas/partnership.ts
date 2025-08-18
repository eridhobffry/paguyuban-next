import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";

// Partnership applications (kept with snake_case keys to match existing raw SQL)
export const partnership_applications = pgTable(
  "partnership_applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    company: text("company"),
    phone: text("phone"),
    interest: text("interest"),
    budget: text("budget"),
    message: text("message"),
    source: text("source"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    emailIdx: index("idx_partnership_applications_email").on(t.email),
    createdAtIdx: index("idx_partnership_applications_created_at").on(
      t.created_at
    ),
  })
);

// Recommendations for partnership applications (snake_case keys for compatibility)
export const partnership_application_recommendations = pgTable(
  "partnership_application_recommendations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    application_id: uuid("application_id")
      .notNull()
      .references(() => partnership_applications.id, { onDelete: "cascade" }),
    sentiment: text("sentiment"),
    recommended_actions: jsonb("recommended_actions"),
    journey: jsonb("journey"),
    follow_ups: jsonb("follow_ups"),
    next_best_action: text("next_best_action"),
    prospect_summary: text("prospect_summary"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    appIdx: index("idx_par_app_rec_app").on(t.application_id),
    createdAtIdx: index("idx_par_app_rec_created_at").on(t.created_at),
  })
);
