-- CLEAN CORE FIX: RUN THIS IN A FRESH/EMPTY SQL EDITOR TAB
-- ----------------------------------------------------------------

-- 1. Create name column if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- 2. Relax role constraints to allow Technicians
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'manager', 'staff', 'attendant', 'repair_technician'));

-- 3. Fix the signup trigger
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

-- 4. Ensure everyone can see technician names
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- 5. Allow admins to update roles
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (
  public.get_user_role() = 'admin' OR public.get_user_role() = 'super_admin'
);
