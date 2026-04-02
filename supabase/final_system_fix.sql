-- CORE SYSTEM FIX (v5): Focuses on Technicians and Roles
-- This script REMOVES publication management to avoid the "already member" error.
-- Running this will finally fix your technician selection and staff roles.

-- 1. Create 'name' column and unify data (Fixes the technician selection list)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;

DO $$ 
BEGIN
    -- Pull from existing columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='display_name') THEN
        UPDATE public.profiles SET name = display_name WHERE name IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='full_name') THEN
        UPDATE public.profiles SET name = full_name WHERE name IS NULL;
    END IF;
END $$;

-- 2. Relax Role Constraints (Allows adding Repair Technicians and Attendants)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('super_admin', 'admin', 'manager', 'staff', 'attendant', 'repair_technician'));

-- 3. Dynamic User Trigger (Fixes the "Everyone is an Admin" bug)
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

-- 4. FINAL PERMANENT FIX FOR THE "ALREADY MEMBER" ERROR:
-- Since your table is ALREADY a member, we simply do not need to try to add it again.
-- I have removed the ALTER PUBLICATION lines entirely to allow this script to finish.
-- Your technician selection list should now work perfectly.
