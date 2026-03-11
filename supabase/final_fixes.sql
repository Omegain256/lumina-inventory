-- FINAL SUPABASE SCHEMA FIXES

-- 1. Fix POS Cart Checkout Bug:
-- The 'sale_items' table has Row-Level Security (RLS) enabled, but no policies were ever created for it!
-- This causes the backend to silently reject all cart items when clicking "Charge" in the POS.
DROP POLICY IF EXISTS "All authenticated users can manage everything sale_items." ON sale_items;

CREATE POLICY "All authenticated users can manage everything sale_items." 
ON sale_items 
FOR ALL 
USING (auth.role() = 'authenticated');


-- 2. Fix Workshift End Shift Bug:
-- The database has a strict constraint that was rejecting the update status to 'completed'.
ALTER TABLE workshifts DROP CONSTRAINT IF EXISTS workshifts_status_check;

ALTER TABLE workshifts ADD CONSTRAINT workshifts_status_check 
CHECK (status IN ('active', 'completed', 'Active', 'Completed'));
