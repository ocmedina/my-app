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

async function checkPayments() {
    console.log('Fetching one PAYMENT to inspect columns...');
    const { data, error } = await supabase.from('payments').select('*').limit(1);

    if (error) {
        console.error('❌ Error checking payments table:', error.message);
    } else {
        if (data && data.length > 0) {
            console.log('✅ Payment Columns:', Object.keys(data[0]));
        } else {
            console.log('⚠️ No payments found. Cannot list columns easily via Select *. Attempting metadata check if possible or insert test.');
        }
    }
}

checkPayments();
