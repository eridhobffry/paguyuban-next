import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const analyticsSessions = pgTable("analytics_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  startedAt: timestamp("started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  routeFirst: text("route_first"),
  referrer: text("referrer"),
  utm: jsonb("utm"),
  device: varchar("device", { length: 255 }),
  country: varchar("country", { length: 100 }),
  engagementScore: integer("engagement_score"),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull(),
  userId: varchar("user_id", { length: 255 }),
  route: text("route"),
  type: varchar("type", { length: 100 }).notNull(),
  section: varchar("section", { length: 255 }),
  element: varchar("element", { length: 512 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const analyticsSectionDurations = pgTable(
  "analytics_section_durations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").notNull(),
    section: varchar("section", { length: 255 }).notNull(),
    dwellMs: integer("dwell_ms").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
);

export const chatbotLogs = pgTable("chatbot_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull(),
  userId: varchar("user_id", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull(),
  message: text("message").notNull(),
  tokens: integer("tokens"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const chatbotSummaries = pgTable("chatbot_summaries", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull(),
  summary: text("summary").notNull(),
  topics: jsonb("topics"),
  sentiment: varchar("sentiment", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
