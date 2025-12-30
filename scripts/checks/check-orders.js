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

async function checkOrders() {
    console.log('Fetching one order to inspect columns...');
    const { data, error } = await supabase.from('orders').select('*').limit(1);

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        if (data && data.length > 0) {
            console.log('✅ Order Columns:', Object.keys(data[0]));
            console.log('Sample Data:', data[0]);
        } else {
            console.log('⚠️ No orders found, cannot inspect columns easily without PG info.');
        }
    }
}

checkOrders();
