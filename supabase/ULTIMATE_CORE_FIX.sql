-- ULTIMATE CORE FIX: FIXES TECHNICIANS & ROLES
-- RUN THIS IN SUPABASE SQL EDITOR. IGNORE ALL PREVIOUS SCRIPTS.
-- This script contains NO publication code, so it CANNOT fail with the "already member" error.

-- 1. Create 'name' column (Required for technician list)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- 2. Relax Role Constraints (Allows adding Repair Technicians and Attendants)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('super_admin', 'admin', 'manager', 'staff', 'attendant', 'repair_technician'));

-- 3. Dynamic User Trigger (Ensures new staff get their assigned role immediately)
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

-- 4. Admin Permissions (Allows Admin to update other staff roles from the UI)
DROP POLICY IF EXISTS "Admins can update all profiles." ON public.profiles;
CREATE POLICY "Admins can update all profiles." ON public.profiles 
    FOR UPDATE USING (
        public.get_user_role() = 'admin' OR public.get_user_role() = 'super_admin'
    );

-- 5. Fix existing technicians (If any were accidentally set to 'admin' or 'staff')
-- Update 'staff' to 'repair_technician' ONLY if you want to convert them.
-- Otherwise, just re-add them in Settings after running this script.

-- VALIDATION:
-- After running this, go to Settings -> User Management.
-- You should be able to change someone's role to "Repair Technician".
-- Once you do, they will appear in the Repairs dropdown!
