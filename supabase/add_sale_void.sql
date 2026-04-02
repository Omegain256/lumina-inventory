-- Migration: Add void support to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS is_voided BOOLEAN DEFAULT FALSE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS voided_by UUID REFERENCES profiles(id);

-- Index for faster queries on non-voided sales
CREATE INDEX IF NOT EXISTS idx_sales_not_voided ON sales(is_voided) WHERE is_voided = FALSE;
