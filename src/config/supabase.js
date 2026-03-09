import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables are missing. Using default fallback if available.");
}

export const supabase = createClient(
    supabaseUrl || 'https://qezekvatrufxrxjpzdea.supabase.co',
    supabaseAnonKey || 'sb_publishable_JJVL0uWY-qiQ6Y0c0oec7A__ljh1VVm'
);
