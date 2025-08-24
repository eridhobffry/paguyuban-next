-- Migration: Add knowledge overlay table
-- Date: 2025-08-21
-- Purpose: Store dynamic knowledge overlay for chat system

-- Knowledge overlay table for dynamic chat knowledge management
CREATE TABLE IF NOT EXISTS knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  overlay jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Only allow one active knowledge record at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_active ON knowledge (id) WHERE is_active = true;

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_active ON knowledge (is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_updated_at ON knowledge (updated_at);

-- Add RLS policy (if needed for security)
-- ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "knowledge_admin_only" ON knowledge FOR ALL USING (auth.role() = 'admin');
