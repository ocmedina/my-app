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

async function checkSales() {
    console.log('Fetching one SALE to inspect columns...');
    const { data: sales, error: salesError } = await supabase.from('sales').select('*').limit(1);

    if (salesError) {
        console.error('❌ Error Sales:', salesError.message);
    } else {
        if (sales && sales.length > 0) {
            console.log('✅ Sale Columns:', Object.keys(sales[0]));
        } else {
            console.log('⚠️ No sales found.');
        }
    }

    console.log('Fetching one SALE_ITEM to inspect columns...');
    const { data: items, error: itemsError } = await supabase.from('sale_items').select('*').limit(1);

    if (itemsError) {
        console.error('❌ Error Sale Items:', itemsError.message);
    } else {
        if (items && items.length > 0) {
            console.log('✅ Sale Item Columns:', Object.keys(items[0]));
        } else {
            console.log('⚠️ No sale items found.');
        }
    }
}

checkSales();
