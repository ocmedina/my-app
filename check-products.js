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
    console.log('Verificando columna cost_price en products...');
    const { data, error } = await supabase.from('products').select('cost_price').limit(1);

    if (error) {
        console.error('❌ Error checking products:', error.message);
        if (error.message.includes('column') || error.message.includes('does not exist')) {
            console.log('CONCLUSION: La columna cost_price NO existe.');
        }
    } else {
        console.log('✅ La columna cost_price existe.');
    }
}

check();
