-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."ai_query_status" AS ENUM('success', 'partial_success', 'degraded', 'failure');--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"user_type" text DEFAULT 'user',
	"role" text DEFAULT 'user',
	"status" text DEFAULT 'active',
	"is_super_admin" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"requested_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"approved_by" text,
	"rejected_at" timestamp with time zone,
	"rejected_by" text,
	"disabled_at" timestamp with time zone,
	"disabled_by" text,
	CONSTRAINT "users_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "ai_query_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query_type" varchar(50) NOT NULL,
	"endpoint" varchar(255),
	"intent" varchar(100),
	"status" "ai_query_status" NOT NULL,
	"success" boolean DEFAULT true,
	"response_time" integer NOT NULL,
	"model" varchar(100),
	"token_prompt" integer,
	"token_completion" integer,
	"token_total" integer,
	"cost_usd" numeric(10, 5),
	"error_message" text,
	"correlation_id" varchar(100),
	"user_id" varchar(255),
	"session_id" uuid,
	"ai_endpoint" varchar(255),
	"breaker_state" varchar(50),
	"synthetic" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"preview" text NOT NULL,
	"pages" varchar(50) NOT NULL,
	"type" varchar(100) NOT NULL,
	"icon" varchar(50) NOT NULL,
	"file_url" text,
	"external_url" text,
	"restricted" boolean DEFAULT true NOT NULL,
	"file_size" bigint,
	"mime_type" varchar(100),
	"ai_generated" boolean DEFAULT false NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"marketing_highlights" jsonb,
	"slug" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "alert_state" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"alert_type" varchar(100),
	"dimension" jsonb,
	"firing_since" timestamp with time zone,
	"last_notification_at" timestamp with time zone,
	"notification_count" integer DEFAULT 0,
	"suppressed_until" timestamp with time zone,
	"resolved" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coordination_locks" (
	"lock_name" varchar(100) PRIMARY KEY NOT NULL,
	"acquired_by" varchar(100),
	"acquired_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "telemetry_dlq" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payload" jsonb NOT NULL,
	"error_message" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"last_error_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_revenue_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(255) NOT NULL,
	"amount" bigint NOT NULL,
	"notes" text,
	"sort_order" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"evidence_url" text
);
--> statement-breakpoint
CREATE TABLE "financial_cost_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(255) NOT NULL,
	"amount" bigint NOT NULL,
	"notes" text,
	"sort_order" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"evidence_url" text
);
--> statement-breakpoint
CREATE TABLE "speakers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(255),
	"company" varchar(255),
	"image_url" text,
	"bio" text,
	"tags" text[],
	"slug" varchar(255),
	"twitter" text,
	"linkedin" text,
	"website" text,
	"speaker_type" varchar(50),
	"sort_order" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(255),
	"company" varchar(255),
	"image_url" text,
	"bio" text,
	"tags" text[],
	"slug" varchar(255),
	"twitter" text,
	"linkedin" text,
	"website" text,
	"sort_order" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"instagram" text,
	"youtube" text
);
--> statement-breakpoint
CREATE TABLE "analytics_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255),
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"route_first" text,
	"referrer" text,
	"utm" jsonb,
	"device" varchar(255),
	"country" varchar(100),
	"engagement_score" integer
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" varchar(255),
	"route" text,
	"type" varchar(100) NOT NULL,
	"section" varchar(255),
	"element" varchar(512),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_section_durations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"section" varchar(255) NOT NULL,
	"dwell_ms" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatbot_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" varchar(255),
	"role" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"tokens" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatbot_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"summary" text NOT NULL,
	"topics" jsonb,
	"sentiment" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partnership_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"phone" text,
	"interest" text,
	"budget" text,
	"message" text,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partnership_application_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"sentiment" text,
	"recommended_actions" jsonb,
	"journey" jsonb,
	"follow_ups" jsonb,
	"next_best_action" text,
	"prospect_summary" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsor_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255),
	"description" text,
	"price" bigint,
	"available" integer,
	"sold" integer,
	"color" varchar(100),
	"features" jsonb,
	"sort_order" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" text,
	"logo_url" text,
	"slug" varchar(255),
	"tier_id" uuid,
	"tags" text[],
	"sort_order" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsor_logos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"label" varchar(50),
	"url" text NOT NULL,
	"width" integer,
	"height" integer,
	"sort_order" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"overlay" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "analytics_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255),
	"session_id" uuid,
	"query" text NOT NULL,
	"insights" text NOT NULL,
	"metrics" jsonb,
	"dimensions" jsonb,
	"trends" jsonb,
	"recommendations" jsonb,
	"time_range" jsonb,
	"filters" jsonb,
	"data_quality" jsonb,
	"is_saved" boolean DEFAULT false,
	"tags" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255),
	"session_id" uuid,
	"query" text NOT NULL,
	"answer" text NOT NULL,
	"confidence" integer,
	"sources" jsonb,
	"suggested_follow_up" jsonb,
	"reasoning" text,
	"is_saved" boolean DEFAULT false,
	"tags" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_name" varchar(500) NOT NULL,
	"section_name" varchar(255),
	"content" text NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"url" text,
	"file_path" text,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true,
	"indexed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "query_bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"query_id" uuid NOT NULL,
	"query_type" varchar(50) NOT NULL,
	"bookmark_name" varchar(255),
	"folder" varchar(255),
	"notes" text,
	"tags" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "query_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query_hash" varchar(64) NOT NULL,
	"query_type" varchar(50) NOT NULL,
	"result" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"hit_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "query_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query_type" varchar(50) NOT NULL,
	"query_id" uuid,
	"user_id" varchar(255),
	"session_id" uuid,
	"response_time" integer NOT NULL,
	"token_count" integer,
	"cost_estimate" integer,
	"success" boolean DEFAULT true,
	"error_message" text,
	"user_rating" integer,
	"user_feedback" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "query_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"query" text NOT NULL,
	"parameters" jsonb,
	"is_public" boolean DEFAULT true,
	"usage_count" integer DEFAULT 0,
	"created_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shared_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query_id" uuid NOT NULL,
	"query_type" varchar(50) NOT NULL,
	"shared_by" varchar(255) NOT NULL,
	"shared_with" varchar(255),
	"permission" varchar(50) DEFAULT 'view',
	"share_url" varchar(500),
	"expires_at" timestamp with time zone,
	"view_count" integer DEFAULT 0,
	"last_viewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_query_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"default_time_range" jsonb,
	"preferred_metrics" jsonb,
	"preferred_dimensions" jsonb,
	"saved_queries_limit" integer DEFAULT 50,
	"auto_save_queries" boolean DEFAULT false,
	"enable_notifications" boolean DEFAULT true,
	"theme" varchar(50) DEFAULT 'light',
	"language" varchar(10) DEFAULT 'en',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "partnership_application_recommendations" ADD CONSTRAINT "partnership_application_recommendations_application_id_partners" FOREIGN KEY ("application_id") REFERENCES "public"."partnership_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_tier_id_sponsor_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."sponsor_tiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor_logos" ADD CONSTRAINT "sponsor_logos_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_aiqp_created_at" ON "ai_query_performance" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_aiqp_endpoint_created_at" ON "ai_query_performance" USING btree ("endpoint" timestamptz_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_aiqp_errors_created_at" ON "ai_query_performance" USING btree ("created_at" timestamptz_ops) WHERE (success = false);--> statement-breakpoint
CREATE INDEX "idx_aiqp_intent" ON "ai_query_performance" USING btree ("intent" text_ops);--> statement-breakpoint
CREATE INDEX "idx_aiqp_session" ON "ai_query_performance" USING btree ("session_id" timestamptz_ops,"created_at" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_aiqp_status" ON "ai_query_performance" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_aiqp_success" ON "ai_query_performance" USING btree ("success" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_aiqp_user" ON "ai_query_performance" USING btree ("user_id" timestamptz_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_alert_state_dimension_gin" ON "alert_state" USING gin ("dimension" jsonb_ops);--> statement-breakpoint
CREATE INDEX "idx_alert_state_type" ON "alert_state" USING btree ("alert_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_alert_state_updated_at" ON "alert_state" USING btree ("updated_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_coordination_locks_expires_at" ON "coordination_locks" USING btree ("expires_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_telemetry_dlq_created_at" ON "telemetry_dlq" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_telemetry_dlq_next_attempt_at" ON "telemetry_dlq" USING btree ("next_attempt_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_financial_revenue_sort_order" ON "financial_revenue_items" USING btree ("sort_order" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_financial_cost_sort_order" ON "financial_cost_items" USING btree ("sort_order" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_partnership_applications_created_at" ON "partnership_applications" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_partnership_applications_email" ON "partnership_applications" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "idx_par_app_rec_app" ON "partnership_application_recommendations" USING btree ("application_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_par_app_rec_created_at" ON "partnership_application_recommendations" USING btree ("created_at" timestamptz_ops);
*/