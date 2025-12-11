const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer .env.local manualmente
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('Iniciando migración de tabla expenses...');

    const sqlPath = path.join(__dirname, 'sql', 'create_expenses_table.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('Error: No se encuentra el archivo SQL:', sqlPath);
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Supabase JS client no permite correr SQL raw directamente fácilmente sin una función RPC específica
    // Sin embargo, si tenemos el service role key, podemos usar la API de dashboard si la tuviéramos, 
    // pero lo más standard con supabase-js es usar rpc() si existe una función `exec_sql`.
    // Si no existe, tendremos que pedir al usuario que lo haga manual o tratar de usar pg 'postgres' connect.

    // INTENTO 1: Usar una función RPC común 'exec_sql' o 'exec' si existe.
    // Si no, tendremos que pedir al usuario que corra el SQL.

    // Para no fallar, simplemente voy a IMPRIMIR las instrucciones claras,
    // ya que crear una funcion RPC "exec_sql" es un riesgo de seguridad si no se controla.

    // PERO: Estamos en un entorno de desarrollo 'pair programming'.
    // Voy a intentar leer si existe la tabla 'expenses' primero.

    const { error: checkError } = await supabase.from('expenses').select('id').limit(1);

    if (!checkError) {
        console.log('✅ La tabla "expenses" ya existe. Saltando creación.');
        return;
    }

    console.log('\n⚠️  ATENCIÓN REQUERIDA ⚠️');
    console.log('No puedo ejecutar DDL (Create Table) directamente desde este script sin una función RPC "exec_sql".');
    console.log('Por favor, ejecuta el siguiente SQL en el Editor SQL de Supabase Dashboard:');
    console.log('\n---------------------------------------------------');
    console.log(sql);
    console.log('---------------------------------------------------\n');
}

runMigration();
