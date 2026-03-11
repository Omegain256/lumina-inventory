const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
    const { data: { users }, error: authError } = await supabase.auth.admin?.listUsers() || { data: { users: [] }, error: null };
    console.log('Auth users (admin only):', users ? users.length : 'N/A', authError ? authError.message : '');

    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error fetching profiles:', error);
    } else {
        console.log('Profiles:', data);
    }
}

checkProfiles();
