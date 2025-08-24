 is-- Migration: Add financial tables
-- Date: 2025-08-24
-- Purpose: Store financial revenue and cost data for transparency section

-- Create financial revenue items table
CREATE TABLE IF NOT EXISTS financial_revenue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category varchar(255) NOT NULL,
  amount bigint NOT NULL,
  notes text,
  evidence_url text,
  sort_order integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create financial cost items table
CREATE TABLE IF NOT EXISTS financial_cost_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category varchar(255) NOT NULL,
  amount bigint NOT NULL,
  notes text,
  evidence_url text,
  sort_order integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_financial_revenue_sort_order ON financial_revenue_items (sort_order);
CREATE INDEX IF NOT EXISTS idx_financial_cost_sort_order ON financial_cost_items (sort_order);
