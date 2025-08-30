-- Migration: Add telemetry dead-letter queue table
-- Date: 2025-08-29

CREATE TABLE IF NOT EXISTS telemetry_dlq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload jsonb NOT NULL,
  error_message text,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz,
  last_error_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_telemetry_dlq_created_at ON telemetry_dlq (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_dlq_next_attempt_at ON telemetry_dlq (next_attempt_at NULLS FIRST);
