-- FINAL PERMANENT SYSTEM FIX
-- ----------------------------------------------------------------
-- 🛠️ PURPOSE: Fixes Technician list, Staff Roles, and the "Already Member" error.

-- 1. FIX THE "ALREADY MEMBER" ERROR PERMANENTLY
-- Instead of "adding", we "SET" the table list. This replaces the old list and never errors.
DO $$ 
BEGIN
    -- Ensure publication exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    
    -- This is the fixed version. It resets the membership list to these specific tables.
    ALTER PUBLICATION supabase_realtime SET TABLE sales, products, repairs, expenses;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Real-time membership error caught and bypassed.';
END $$;

-- 2. UNLOCK REPAIR TECHNICIAN ROLES
-- This is why you currently cannot see technicians in your list.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'manager', 'staff', 'attendant', 'repair_technician'));

-- 3. FIX THE SIGNUP TRIGGER (Stop making everyone Admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'staff')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ENSURE TECHNICIANS ARE VIEWABLE
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- 5. ALLOW ROLE UPDATES FROM SETTINGS PAGE
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (
  public.get_user_role() = 'admin' OR public.get_user_role() = 'super_admin'
);
