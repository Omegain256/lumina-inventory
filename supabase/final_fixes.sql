-- SQL Fixes: Expenses Module and User Management (Profiles Deletion)
-- Run this in the Supabase SQL Editor

DO $$ 
BEGIN

    -- 1. Create Expenses Table
    CREATE TABLE IF NOT EXISTS public.expenses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        amount DECIMAL(12, 2) NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        expense_date DATE DEFAULT CURRENT_DATE,
        created_by TEXT, -- Stores email or name of who logged it
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Enable RLS on expenses
    ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

    -- Drop existing expenses policies if they exist (for idempotency)
    DROP POLICY IF EXISTS "All authenticated users can manage expenses." ON expenses;
    
    -- Create policy for expenses
    CREATE POLICY "All authenticated users can manage expenses." ON expenses FOR ALL USING (auth.role() = 'authenticated');

    -- 2. Fix User Management (Allow Admins to DELETE profiles)
    -- Drop it first in case it exists to avoid errors
    DROP POLICY IF EXISTS "Admins can delete profiles." ON profiles;
    
    -- Create the explicitly missing DELETE policy using the secure function
    CREATE POLICY "Admins can delete profiles." ON profiles FOR DELETE USING (
        public.get_user_role() = 'admin' OR public.get_user_role() = 'super_admin'
    );

    -- Ensure admins have INSERT rights if needed by custom insert workflows (though the trigger usually handles it)
    DROP POLICY IF EXISTS "Admins can insert profiles." ON profiles;
    CREATE POLICY "Admins can insert profiles." ON profiles FOR INSERT WITH CHECK (
        public.get_user_role() = 'admin' OR public.get_user_role() = 'super_admin'
    );

END $$;
