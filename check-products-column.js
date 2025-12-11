
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.local')));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProductsColumns() {
    console.log('Fetching one PRODUCT to inspect columns...');

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found in products table:', Object.keys(data[0]));
        if (Object.keys(data[0]).includes('cost_price')) {
            console.log('SUCCESS: cost_price column exists.');
        } else {
            console.log('WARNING: cost_price column is MISSING.');
        }
    } else {
        console.log('No products found to inspect columns, but table exists.');
    }
}

checkProductsColumns();
