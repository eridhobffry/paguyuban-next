import { pgTable, unique, text, boolean, timestamp, index, uuid, varchar, integer, numeric, jsonb, bigint, foreignKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const aiQueryStatus = pgEnum("ai_query_status", ['success', 'partial_success', 'degraded', 'failure'])


export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash"),
	userType: text("user_type").default('user'),
	role: text().default('user'),
	status: text().default('active'),
	isSuperAdmin: boolean("is_super_admin").default(false),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	requestedAt: timestamp("requested_at", { withTimezone: true, mode: 'string' }),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	approvedBy: text("approved_by"),
	rejectedAt: timestamp("rejected_at", { withTimezone: true, mode: 'string' }),
	rejectedBy: text("rejected_by"),
	disabledAt: timestamp("disabled_at", { withTimezone: true, mode: 'string' }),
	disabledBy: text("disabled_by"),
}, (table) => [
	unique("users_email_key").on(table.email),
]);

export const aiQueryPerformance = pgTable("ai_query_performance", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	queryType: varchar("query_type", { length: 50 }).notNull(),
	endpoint: varchar({ length: 255 }),
	intent: varchar({ length: 100 }),
	status: aiQueryStatus().notNull(),
	success: boolean().default(true),
	responseTime: integer("response_time").notNull(),
	model: varchar({ length: 100 }),
	tokenPrompt: integer("token_prompt"),
	tokenCompletion: integer("token_completion"),
	tokenTotal: integer("token_total"),
	costUsd: numeric("cost_usd", { precision: 10, scale:  5 }),
	errorMessage: text("error_message"),
	correlationId: varchar("correlation_id", { length: 100 }),
	userId: varchar("user_id", { length: 255 }),
	sessionId: uuid("session_id"),
	aiEndpoint: varchar("ai_endpoint", { length: 255 }),
	breakerState: varchar("breaker_state", { length: 50 }),
	synthetic: boolean().default(false),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_aiqp_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_aiqp_endpoint_created_at").using("btree", table.endpoint.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_aiqp_errors_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")).where(sql`(success = false)`),
	index("idx_aiqp_intent").using("btree", table.intent.asc().nullsLast().op("text_ops")),
	index("idx_aiqp_session").using("btree", table.sessionId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	index("idx_aiqp_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_aiqp_success").using("btree", table.success.asc().nullsLast().op("bool_ops")),
	index("idx_aiqp_user").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
]);

export const documents = pgTable("documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	preview: text().notNull(),
	pages: varchar({ length: 50 }).notNull(),
	type: varchar({ length: 100 }).notNull(),
	icon: varchar({ length: 50 }).notNull(),
	fileUrl: text("file_url"),
	externalUrl: text("external_url"),
	restricted: boolean().default(true).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileSize: bigint("file_size", { mode: "number" }),
	mimeType: varchar("mime_type", { length: 100 }),
	aiGenerated: boolean("ai_generated").default(false).notNull(),
	createdBy: varchar("created_by", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	marketingHighlights: jsonb("marketing_highlights"),
	slug: varchar({ length: 255 }),
});

export const alertState = pgTable("alert_state", {
	id: varchar({ length: 100 }).primaryKey().notNull(),
	alertType: varchar("alert_type", { length: 100 }),
	dimension: jsonb(),
	firingSince: timestamp("firing_since", { withTimezone: true, mode: 'string' }),
	lastNotificationAt: timestamp("last_notification_at", { withTimezone: true, mode: 'string' }),
	notificationCount: integer("notification_count").default(0),
	suppressedUntil: timestamp("suppressed_until", { withTimezone: true, mode: 'string' }),
	resolved: boolean().default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_alert_state_dimension_gin").using("gin", table.dimension.asc().nullsLast().op("jsonb_ops")),
	index("idx_alert_state_type").using("btree", table.alertType.asc().nullsLast().op("text_ops")),
	index("idx_alert_state_updated_at").using("btree", table.updatedAt.desc().nullsFirst().op("timestamptz_ops")),
]);

export const coordinationLocks = pgTable("coordination_locks", {
	lockName: varchar("lock_name", { length: 100 }).primaryKey().notNull(),
	acquiredBy: varchar("acquired_by", { length: 100 }),
	acquiredAt: timestamp("acquired_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_coordination_locks_expires_at").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const telemetryDlq = pgTable("telemetry_dlq", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	payload: jsonb().notNull(),
	errorMessage: text("error_message"),
	attempts: integer().default(0).notNull(),
	nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true, mode: 'string' }),
	lastErrorAt: timestamp("last_error_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_telemetry_dlq_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_telemetry_dlq_next_attempt_at").using("btree", table.nextAttemptAt.asc().nullsFirst().op("timestamptz_ops")),
]);

export const financialRevenueItems = pgTable("financial_revenue_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	category: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	amount: bigint({ mode: "number" }).notNull(),
	notes: text(),
	sortOrder: integer("sort_order"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	evidenceUrl: text("evidence_url"),
}, (table) => [
	index("idx_financial_revenue_sort_order").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
]);

export const financialCostItems = pgTable("financial_cost_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	category: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	amount: bigint({ mode: "number" }).notNull(),
	notes: text(),
	sortOrder: integer("sort_order"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	evidenceUrl: text("evidence_url"),
}, (table) => [
	index("idx_financial_cost_sort_order").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
]);

export const speakers = pgTable("speakers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 255 }),
	company: varchar({ length: 255 }),
	imageUrl: text("image_url"),
	bio: text(),
	tags: text().array(),
	slug: varchar({ length: 255 }),
	twitter: text(),
	linkedin: text(),
	website: text(),
	speakerType: varchar("speaker_type", { length: 50 }),
	sortOrder: integer("sort_order"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const artists = pgTable("artists", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 255 }),
	company: varchar({ length: 255 }),
	imageUrl: text("image_url"),
	bio: text(),
	tags: text().array(),
	slug: varchar({ length: 255 }),
	twitter: text(),
	linkedin: text(),
	website: text(),
	sortOrder: integer("sort_order"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	instagram: text(),
	youtube: text(),
});

export const analyticsSessions = pgTable("analytics_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	endedAt: timestamp("ended_at", { withTimezone: true, mode: 'string' }),
	routeFirst: text("route_first"),
	referrer: text(),
	utm: jsonb(),
	device: varchar({ length: 255 }),
	country: varchar({ length: 100 }),
	engagementScore: integer("engagement_score"),
});

export const analyticsEvents = pgTable("analytics_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	userId: varchar("user_id", { length: 255 }),
	route: text(),
	type: varchar({ length: 100 }).notNull(),
	section: varchar({ length: 255 }),
	element: varchar({ length: 512 }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const analyticsSectionDurations = pgTable("analytics_section_durations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	section: varchar({ length: 255 }).notNull(),
	dwellMs: integer("dwell_ms").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const chatbotLogs = pgTable("chatbot_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	userId: varchar("user_id", { length: 255 }),
	role: varchar({ length: 50 }).notNull(),
	message: text().notNull(),
	tokens: integer(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const chatbotSummaries = pgTable("chatbot_summaries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	summary: text().notNull(),
	topics: jsonb(),
	sentiment: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const partnershipApplications = pgTable("partnership_applications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	company: text(),
	phone: text(),
	interest: text(),
	budget: text(),
	message: text(),
	source: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_partnership_applications_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_partnership_applications_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const partnershipApplicationRecommendations = pgTable("partnership_application_recommendations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	applicationId: uuid("application_id").notNull(),
	sentiment: text(),
	recommendedActions: jsonb("recommended_actions"),
	journey: jsonb(),
	followUps: jsonb("follow_ups"),
	nextBestAction: text("next_best_action"),
	prospectSummary: text("prospect_summary"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_par_app_rec_app").using("btree", table.applicationId.asc().nullsLast().op("uuid_ops")),
	index("idx_par_app_rec_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [partnershipApplications.id],
			name: "partnership_application_recommendations_application_id_partners"
		}).onDelete("cascade"),
]);

export const sponsorTiers = pgTable("sponsor_tiers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }),
	description: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	price: bigint({ mode: "number" }),
	available: integer(),
	sold: integer(),
	color: varchar({ length: 100 }),
	features: jsonb(),
	sortOrder: integer("sort_order"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const sponsors = pgTable("sponsors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	url: text(),
	logoUrl: text("logo_url"),
	slug: varchar({ length: 255 }),
	tierId: uuid("tier_id"),
	tags: text().array(),
	sortOrder: integer("sort_order"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tierId],
			foreignColumns: [sponsorTiers.id],
			name: "sponsors_tier_id_sponsor_tiers_id_fk"
		}).onDelete("set null"),
]);

export const sponsorLogos = pgTable("sponsor_logos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sponsorId: uuid("sponsor_id").notNull(),
	label: varchar({ length: 50 }),
	url: text().notNull(),
	width: integer(),
	height: integer(),
	sortOrder: integer("sort_order"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.sponsorId],
			foreignColumns: [sponsors.id],
			name: "sponsor_logos_sponsor_id_sponsors_id_fk"
		}).onDelete("cascade"),
]);

export const knowledge = pgTable("knowledge", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	overlay: jsonb().default({}).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const analyticsQueries = pgTable("analytics_queries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }),
	sessionId: uuid("session_id"),
	query: text().notNull(),
	insights: text().notNull(),
	metrics: jsonb(),
	dimensions: jsonb(),
	trends: jsonb(),
	recommendations: jsonb(),
	timeRange: jsonb("time_range"),
	filters: jsonb(),
	dataQuality: jsonb("data_quality"),
	isSaved: boolean("is_saved").default(false),
	tags: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const knowledgeQueries = pgTable("knowledge_queries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }),
	sessionId: uuid("session_id"),
	query: text().notNull(),
	answer: text().notNull(),
	confidence: integer(),
	sources: jsonb(),
	suggestedFollowUp: jsonb("suggested_follow_up"),
	reasoning: text(),
	isSaved: boolean("is_saved").default(false),
	tags: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const knowledgeSources = pgTable("knowledge_sources", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	documentName: varchar("document_name", { length: 500 }).notNull(),
	sectionName: varchar("section_name", { length: 255 }),
	content: text().notNull(),
	contentHash: varchar("content_hash", { length: 64 }).notNull(),
	url: text(),
	filePath: text("file_path"),
	metadata: jsonb(),
	isActive: boolean("is_active").default(true),
	indexedAt: timestamp("indexed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const queryBookmarks = pgTable("query_bookmarks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	queryId: uuid("query_id").notNull(),
	queryType: varchar("query_type", { length: 50 }).notNull(),
	bookmarkName: varchar("bookmark_name", { length: 255 }),
	folder: varchar({ length: 255 }),
	notes: text(),
	tags: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const queryCache = pgTable("query_cache", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	queryHash: varchar("query_hash", { length: 64 }).notNull(),
	queryType: varchar("query_type", { length: 50 }).notNull(),
	result: jsonb().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	hitCount: integer("hit_count").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const queryPerformance = pgTable("query_performance", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	queryType: varchar("query_type", { length: 50 }).notNull(),
	queryId: uuid("query_id"),
	userId: varchar("user_id", { length: 255 }),
	sessionId: uuid("session_id"),
	responseTime: integer("response_time").notNull(),
	tokenCount: integer("token_count"),
	costEstimate: integer("cost_estimate"),
	success: boolean().default(true),
	errorMessage: text("error_message"),
	userRating: integer("user_rating"),
	userFeedback: text("user_feedback"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const queryTemplates = pgTable("query_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }).notNull(),
	query: text().notNull(),
	parameters: jsonb(),
	isPublic: boolean("is_public").default(true),
	usageCount: integer("usage_count").default(0),
	createdBy: varchar("created_by", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const sharedQueries = pgTable("shared_queries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	queryId: uuid("query_id").notNull(),
	queryType: varchar("query_type", { length: 50 }).notNull(),
	sharedBy: varchar("shared_by", { length: 255 }).notNull(),
	sharedWith: varchar("shared_with", { length: 255 }),
	permission: varchar({ length: 50 }).default('view'),
	shareUrl: varchar("share_url", { length: 500 }),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	viewCount: integer("view_count").default(0),
	lastViewedAt: timestamp("last_viewed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const userQueryPreferences = pgTable("user_query_preferences", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	defaultTimeRange: jsonb("default_time_range"),
	preferredMetrics: jsonb("preferred_metrics"),
	preferredDimensions: jsonb("preferred_dimensions"),
	savedQueriesLimit: integer("saved_queries_limit").default(50),
	autoSaveQueries: boolean("auto_save_queries").default(false),
	enableNotifications: boolean("enable_notifications").default(true),
	theme: varchar({ length: 50 }).default('light'),
	language: varchar({ length: 10 }).default('en'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});
