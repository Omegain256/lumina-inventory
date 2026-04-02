-- FINAL ALL-IN-ONE SYSTEM SYNCHRONIZATION
-- This script fixes missing columns, roles, and real-time publication errors permanently.

-- 1. FIX REPAIRS TABLE COLUMNS (Ensures "Create Repair Job" works)
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS repair_type TEXT;
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS service_category TEXT;
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS mobile_type TEXT;
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id);

-- 2. FIX PROFILES TABLE (Ensures Technician selection works)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'manager', 'staff', 'attendant', 'repair_technician'));

-- 3. ENSURE RLS POLICIES FOR REPAIRS
-- This allows any authenticated user to create and view repairs
DROP POLICY IF EXISTS "All authenticated users can manage everything repairs." ON repairs;
CREATE POLICY "All authenticated users can manage everything repairs." ON repairs FOR ALL USING (auth.role() = 'authenticated');

-- 4. PERMANENT REAL-TIME FIX (The "Already Member" Solver)
-- This command REPLACES the entire list of tables in the publication, 
-- avoiding the "already member" error completely.
ALTER PUBLICATION supabase_realtime SET TABLE sales, products, repairs, expenses, profiles;

-- 5. REFRESH TRIGGER FOR NEW USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'admin') -- Defaulting to admin for safety, can be changed in UI
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
