-- Migration: Add observability tables (ai_query_performance, alert_state, coordination_locks)
-- Date: 2025-08-29
-- Purpose: Foundation for Phase 6 Observability (telemetry, alerts, coordination)

-- Create enum ai_query_status if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'ai_query_status'
  ) THEN
    CREATE TYPE ai_query_status AS ENUM ('success','partial_success','degraded','failure');
  END IF;
END$$;

-- ai_query_performance stores operational telemetry for AI and data endpoints
CREATE TABLE IF NOT EXISTS ai_query_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_type varchar(50) NOT NULL,
  endpoint varchar(255),
  intent varchar(100),
  status ai_query_status NOT NULL,
  success boolean DEFAULT true,
  response_time integer NOT NULL,
  model varchar(100),
  token_prompt integer,
  token_completion integer,
  token_total integer,
  cost_usd numeric(10,5),
  error_message text,
  correlation_id varchar(100),
  user_id varchar(255),
  session_id uuid,
  ai_endpoint varchar(255),
  breaker_state varchar(50),
  synthetic boolean DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_aiqp_created_at ON ai_query_performance (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aiqp_intent ON ai_query_performance (intent);
CREATE INDEX IF NOT EXISTS idx_aiqp_status ON ai_query_performance (status);
CREATE INDEX IF NOT EXISTS idx_aiqp_success ON ai_query_performance (success);
CREATE INDEX IF NOT EXISTS idx_aiqp_endpoint_created_at ON ai_query_performance (endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aiqp_user ON ai_query_performance (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aiqp_session ON ai_query_performance (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aiqp_errors_created_at ON ai_query_performance (created_at DESC) WHERE success = false;
-- Optional: metadata jsonb GIN index (enable when needed)
-- CREATE INDEX IF NOT EXISTS idx_aiqp_metadata_gin ON ai_query_performance USING GIN (metadata);

-- alert_state stores DB-backed alert dedup/backoff state
CREATE TABLE IF NOT EXISTS alert_state (
  id varchar(100) PRIMARY KEY,
  alert_type varchar(100),
  dimension jsonb,
  firing_since timestamptz,
  last_notification_at timestamptz,
  notification_count integer DEFAULT 0,
  suppressed_until timestamptz,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alert_state_updated_at ON alert_state (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_state_type ON alert_state (alert_type);
CREATE INDEX IF NOT EXISTS idx_alert_state_dimension_gin ON alert_state USING GIN (dimension);

-- coordination_locks provides simple DB-based coordination (no Redis)
CREATE TABLE IF NOT EXISTS coordination_locks (
  lock_name varchar(100) PRIMARY KEY,
  acquired_by varchar(100),
  acquired_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_coordination_locks_expires_at ON coordination_locks (expires_at);

-- Retention helper: delete old telemetry based on success status
-- Default policy: keep successes 30 days, failures/degradations 90 days
CREATE OR REPLACE FUNCTION purge_ai_query_performance(success_days integer DEFAULT 30, error_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  -- Delete old success rows
  DELETE FROM ai_query_performance
  WHERE success = true
    AND created_at < (now() - make_interval(days => success_days));
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;

  -- Delete old failure/degraded/partial rows
  DELETE FROM ai_query_performance
  WHERE success = false
     OR status IN ('failure','degraded','partial_success')
    AND created_at < (now() - make_interval(days => error_days));
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- Note: Schedule purge via external cron (e.g., Vercel Cron) calling
-- SELECT purge_ai_query_performance();
