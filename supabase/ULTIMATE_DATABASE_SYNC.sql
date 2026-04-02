-- ULTIMATE DATABASE SYNCHRONIZATION (REPAIR + TECH + REALTIME)
-- This script is designed to be run multiple times safely.

-- 1. REPAIRS TABLE: FORCE-ADD ALL POTENTIAL MISSING COLUMNS
-- This ensures that even if you have an old version of the repairs table, it will work with the new app.
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id);
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'customer_id column fix skipped';
    END;

    ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS device_name TEXT;
    ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS imei TEXT;
    ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS issue_description TEXT;
    ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
    ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS cost DECIMAL(12,2) DEFAULT 0;
    ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS technician TEXT;
    ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS repair_type TEXT;
    ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS service_category TEXT;
    ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS mobile_type TEXT;
    ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2) DEFAULT 0.00;
    ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id);
END $$;

-- 2. FORCE RE-ENABLE RLS AND OPEN ACCESS FOR REPAIRS
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All authenticated users can manage everything repairs." ON repairs;
CREATE POLICY "All authenticated users can manage everything repairs." ON repairs FOR ALL USING (auth.role() = 'authenticated');

-- 3. PROFILES TABLE: RE-VERIFY ROLE AND NAME
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'manager', 'staff', 'attendant', 'repair_technician'));

-- 4. REALTIME PUBLICATION: MASTER RESET
-- This ensures all tables (including repairs and expenses) are correctly streaming.
ALTER PUBLICATION supabase_realtime SET TABLE sales, products, repairs, expenses, profiles, customers;

-- 5. ENSURE CUSTOMER VIEWABILITY
-- If your customers dropdown is empty, this fix will reveal them.
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All authenticated users can manage everything customers." ON customers;
CREATE POLICY "All authenticated users can manage everything customers." ON customers FOR ALL USING (auth.role() = 'authenticated');

-- 6. FINAL NOTIFICATION FOR USER
-- IF THIS SCRIPT RUNS SUCCESSFULLY, RELOAD YOUR BROWSER TAB.
