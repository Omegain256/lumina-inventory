import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qezekvatrufxrxjpzdea.supabase.co';
const supabaseKey = 'sb_publishable_JJVL0uWY-qiQ6Y0c0oec7A__ljh1VVm';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    // Generate fresh credentials
    const email = `test_${Date.now()}@test.com`;
    await supabase.auth.signUp({ email, password: 'password123' });

    // Attempt to insert with NULL SKU
    const { data: data1, error: err1 } = await supabase.from('products').insert({
        name: "Test Add Product RLS 1",
        sku: null,
        price: 1000,
        cost: 500,
        stock_quantity: 10
    }).select();

    console.log("Insert 1 error:", JSON.stringify(err1));

    const { data: data2, error: err2 } = await supabase.from('products').insert({
        name: "Test Add Product RLS 2",
        sku: null,
        price: 1000,
        cost: 500,
        stock_quantity: 10
    }).select();

    console.log("Insert 2 error:", JSON.stringify(err2));

    if (data1) await supabase.from('products').delete().eq('id', data1[0].id);
    if (data2) await supabase.from('products').delete().eq('id', data2[0].id);
}

testInsert();
