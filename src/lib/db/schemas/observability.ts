import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  boolean,
  integer,
  numeric,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enum for detailed query status
export const aiQueryStatus = pgEnum("ai_query_status", [
  "success",
  "partial_success",
  "degraded",
  "failure",
]);

// Operational telemetry for AI and data endpoints
export const aiQueryPerformance = pgTable("ai_query_performance", {
  id: uuid("id").defaultRandom().primaryKey(),
  queryType: varchar("query_type", { length: 50 }).notNull(),
  endpoint: varchar("endpoint", { length: 255 }),
  intent: varchar("intent", { length: 100 }),
  status: aiQueryStatus("status").notNull(),
  success: boolean("success").default(true),
  responseTime: integer("response_time").notNull(), // ms
  model: varchar("model", { length: 100 }),
  tokenPrompt: integer("token_prompt"),
  tokenCompletion: integer("token_completion"),
  tokenTotal: integer("token_total"),
  costUsd: numeric("cost_usd", { precision: 10, scale: 5 }),
  errorMessage: text("error_message"),
  correlationId: varchar("correlation_id", { length: 100 }),
  userId: varchar("user_id", { length: 255 }),
  sessionId: uuid("session_id"),
  aiEndpoint: varchar("ai_endpoint", { length: 255 }),
  breakerState: varchar("breaker_state", { length: 50 }),
  synthetic: boolean("synthetic").default(false),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Alert state storage (DB-backed dedup/suppression)
export const alertState = pgTable("alert_state", {
  id: varchar("id", { length: 100 }).primaryKey(), // alert key/type+dimension
  alertType: varchar("alert_type", { length: 100 }),
  dimension: jsonb("dimension").$type<Record<string, unknown>>(),
  firingSince: timestamp("firing_since", { withTimezone: true }),
  lastNotificationAt: timestamp("last_notification_at", { withTimezone: true }),
  notificationCount: integer("notification_count").default(0),
  suppressedUntil: timestamp("suppressed_until", { withTimezone: true }),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Simple DB-based coordination locks (no Redis)
export const coordinationLocks = pgTable("coordination_locks", {
  lockName: varchar("lock_name", { length: 100 }).primaryKey(),
  acquiredBy: varchar("acquired_by", { length: 100 }),
  acquiredAt: timestamp("acquired_at", { withTimezone: true }).defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

// Dead-letter queue for failed telemetry writes
export const telemetryDlq = pgTable("telemetry_dlq", {
  id: uuid("id").defaultRandom().primaryKey(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  errorMessage: text("error_message"),
  attempts: integer("attempts").default(0).notNull(),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
  lastErrorAt: timestamp("last_error_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
