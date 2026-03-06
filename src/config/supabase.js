import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qezekvatrufxrxjpdea.supabase.co';
const supabaseAnonKey = 'sb_publishable_JJVL0uWY-qiQ6Y0c0oec7A__ljh1VVm';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
