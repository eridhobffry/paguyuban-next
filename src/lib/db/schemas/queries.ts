import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

// Knowledge query history and saved queries
export const knowledgeQueries = pgTable("knowledge_queries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  sessionId: uuid("session_id"),
  query: text("query").notNull(),
  answer: text("answer").notNull(),
  confidence: integer("confidence"), // 0-100
  sources: jsonb("sources").$type<
    {
      document: string;
      section: string;
      content: string;
      relevance: number;
      url?: string;
    }[]
  >(),
  suggestedFollowUp: jsonb("suggested_follow_up").$type<string[]>(),
  reasoning: text("reasoning"),
  isSaved: boolean("is_saved").default(false),
  tags: jsonb("tags").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Analytics query history and saved queries
export const analyticsQueries = pgTable("analytics_queries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  sessionId: uuid("session_id"),
  query: text("query").notNull(),
  insights: text("insights").notNull(),
  metrics: jsonb("metrics").$type<
    {
      name: string;
      value: number;
      change?: number;
      trend?: "up" | "down" | "stable";
      description?: string;
    }[]
  >(),
  dimensions: jsonb("dimensions").$type<
    {
      name: string;
      data: {
        date?: string;
        value: number;
        label?: string;
        metadata?: Record<string, string | number | boolean>;
      }[];
      topValues?: { name: string; count: number; percentage: number }[];
    }[]
  >(),
  trends: jsonb("trends").$type<
    {
      direction: "increasing" | "decreasing" | "stable";
      magnitude: "strong" | "moderate" | "weak";
      description: string;
    }[]
  >(),
  recommendations: jsonb("recommendations").$type<string[]>(),
  timeRange: jsonb("time_range").$type<{ start: string; end: string }>(),
  filters: jsonb("filters"),
  dataQuality: jsonb("data_quality").$type<{
    score: number;
    issues: string[];
    suggestions: string[];
  }>(),
  isSaved: boolean("is_saved").default(false),
  tags: jsonb("tags").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Query templates for common queries
export const queryTemplates = pgTable("query_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // "knowledge" | "analytics"
  query: text("query").notNull(),
  parameters: jsonb("parameters").$type<
    {
      name: string;
      type: "string" | "number" | "date" | "boolean";
      required: boolean;
      defaultValue?: string | number | boolean | null;
      description?: string;
    }[]
  >(),
  isPublic: boolean("is_public").default(true),
  usageCount: integer("usage_count").default(0),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Source document tracking for knowledge queries
export const knowledgeSources = pgTable("knowledge_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentName: varchar("document_name", { length: 500 }).notNull(),
  sectionName: varchar("section_name", { length: 255 }),
  content: text("content").notNull(),
  contentHash: varchar("content_hash", { length: 64 }).notNull(), // For deduplication
  url: text("url"),
  filePath: text("file_path"),
  metadata: jsonb("metadata").$type<{
    fileType?: string;
    fileSize?: number;
    lastModified?: string;
    author?: string;
    version?: string;
    tags?: string[];
  }>(),
  isActive: boolean("is_active").default(true),
  indexedAt: timestamp("indexed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Query performance and analytics
export const queryPerformance = pgTable("query_performance", {
  id: uuid("id").defaultRandom().primaryKey(),
  queryType: varchar("query_type", { length: 50 }).notNull(), // "knowledge" | "analytics"
  queryId: uuid("query_id"), // Reference to knowledge_queries or analytics_queries
  userId: varchar("user_id", { length: 255 }),
  sessionId: uuid("session_id"),
  responseTime: integer("response_time").notNull(), // in milliseconds
  tokenCount: integer("token_count"), // AI tokens used
  costEstimate: integer("cost_estimate"), // in microcents
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  userRating: integer("user_rating"), // 1-5 stars
  userFeedback: text("user_feedback"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// User query preferences and settings
export const userQueryPreferences = pgTable("user_query_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  defaultTimeRange: jsonb("default_time_range").$type<{ days: number }>(),
  preferredMetrics: jsonb("preferred_metrics").$type<string[]>(),
  preferredDimensions: jsonb("preferred_dimensions").$type<string[]>(),
  savedQueriesLimit: integer("saved_queries_limit").default(50),
  autoSaveQueries: boolean("auto_save_queries").default(false),
  enableNotifications: boolean("enable_notifications").default(true),
  theme: varchar("theme", { length: 50 }).default("light"),
  language: varchar("language", { length: 10 }).default("en"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Query sharing and collaboration
export const sharedQueries = pgTable("shared_queries", {
  id: uuid("id").defaultRandom().primaryKey(),
  queryId: uuid("query_id").notNull(), // Reference to knowledge_queries or analytics_queries
  queryType: varchar("query_type", { length: 50 }).notNull(), // "knowledge" | "analytics"
  sharedBy: varchar("shared_by", { length: 255 }).notNull(),
  sharedWith: varchar("shared_with", { length: 255 }), // null means public
  permission: varchar("permission", { length: 50 }).default("view"), // "view" | "edit" | "execute"
  shareUrl: varchar("share_url", { length: 500 }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  viewCount: integer("view_count").default(0),
  lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Query bookmarks and favorites
export const queryBookmarks = pgTable("query_bookmarks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  queryId: uuid("query_id").notNull(), // Reference to knowledge_queries or analytics_queries
  queryType: varchar("query_type", { length: 50 }).notNull(), // "knowledge" | "analytics"
  bookmarkName: varchar("bookmark_name", { length: 255 }),
  folder: varchar("folder", { length: 255 }),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Query result caching
export const queryCache = pgTable("query_cache", {
  id: uuid("id").defaultRandom().primaryKey(),
  queryHash: varchar("query_hash", { length: 64 }).notNull(), // Hash of query + parameters
  queryType: varchar("query_type", { length: 50 }).notNull(), // "knowledge" | "analytics"
  result: jsonb("result").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  hitCount: integer("hit_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
