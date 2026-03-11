-- Please copy and run all of these statements in your Supabase SQL Editor.
-- They will add the missing tracking columns that we recently added to the application but were ignored by the `CREATE TABLE IF NOT EXISTS` command.

-- Fix Workshifts (Fixes attendants unable to start shifts)
ALTER TABLE public.workshifts ADD COLUMN IF NOT EXISTS total_sales DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE public.workshifts ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

-- Fix Repairs (Ensures commissions and mobile types can be saved without crashing)
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS repair_type TEXT;
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS service_category TEXT;
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS mobile_type TEXT;
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id);
