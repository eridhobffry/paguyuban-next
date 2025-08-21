-- Migration: Add sponsors tables
-- Date: 2025-08-20
-- Neon Migration ID: eb204d2d-6063-4731-b128-03675481e258

-- Ensure UUID generation is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Sponsor tiers
CREATE TABLE IF NOT EXISTS sponsor_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  slug varchar(255),
  description text,
  price bigint,
  available integer,
  sold integer,
  color varchar(100),
  features jsonb,
  sort_order integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sponsors
CREATE TABLE IF NOT EXISTS sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  url text,
  logo_url text,
  slug varchar(255),
  tier_id uuid REFERENCES sponsor_tiers(id) ON DELETE SET NULL,
  tags text[],
  sort_order integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sponsor logos (optional multiple logos per sponsor)
CREATE TABLE IF NOT EXISTS sponsor_logos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  label varchar(50),
  url text NOT NULL,
  width integer,
  height integer,
  sort_order integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_sponsor_tiers_slug ON sponsor_tiers (slug);
CREATE INDEX IF NOT EXISTS idx_sponsors_slug ON sponsors (slug);
CREATE INDEX IF NOT EXISTS idx_sponsors_tier_id ON sponsors (tier_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_sort_order ON sponsors (sort_order);
CREATE INDEX IF NOT EXISTS idx_sponsor_logos_sponsor_id ON sponsor_logos (sponsor_id);
