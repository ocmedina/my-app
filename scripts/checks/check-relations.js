const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('Checking expenses table...');
    const { data: expenses, error: expensesError } = await supabase.from('expenses').select('*').limit(1);

    if (expensesError) {
        console.error('❌ Expenses Error:', expensesError);
    } else {
        console.log('✅ Expenses table exists.');
    }

    console.log('Checking Orders->Items->Products relation...');
    // Simulated query from page.tsx
    const { data: sales, error: salesError } = await supabase
        .from("orders")
        .select(`
          id,
          order_items (
             id,
             product:products (
               id,
               cost_price
             )
          )
        `)
        .limit(1);

    if (salesError) {
        console.error('❌ Relation Error:', JSON.stringify(salesError, null, 2));
    } else {
        console.log('✅ Relation query works:', JSON.stringify(sales, null, 2));
    }
}

check();
