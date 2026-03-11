import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    // We need to login first or use service role key
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'admin@lumina.com',
        password: 'password123'
    });
    
    if (authErr) {
        console.log("Auth error:", authErr.message);
        // Let's try demo account
        const { data: auth2, error: authErr2 } = await supabase.auth.signInWithPassword({
            email: 'admin@akisalimited.com',
            password: 'password123'
        });
        if (authErr2) console.log("Auth error 2:", authErr2.message);
    }
    
    const { data, error } = await supabase.from('products').insert({
        name: "Test Add Product",
        sku: "TEST-" + Math.floor(Math.random() * 10000),
        price: 1000,
        cost: 500,
        stock_quantity: 10
    }).select();
    
    if (error) {
        console.error("Insert error:", error);
    } else {
        console.log("Insert success:", data);
        
        // Clean up
        await supabase.from('products').delete().eq('id', data[0].id);
    }
}

testInsert();
