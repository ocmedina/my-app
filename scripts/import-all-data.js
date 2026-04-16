/**
 * import-all-data.js
 * 
 * Importa datos desde un migration_bundle.json generado por export-all-data.js
 * a una nueva instancia de Supabase.
 * 
 * Uso:
 *   node scripts/import-all-data.js <ruta_al_migration_bundle.json>
 *   node scripts/import-all-data.js --dry-run <ruta_al_migration_bundle.json>
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables de entorno. Revisá NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Tablas con sus primary keys para upsert
const TABLE_PRIMARY_KEYS = {
  settings: 'key',
  brands: 'id',
  categories: 'id',
  customers: 'id',
  suppliers: 'id',
  products: 'id',
  profiles: 'id',
  sales: 'id',
  orders: 'id',
  purchases: 'id',
  purchase_orders: 'id',
  budgets: 'id',
  sale_items: 'id',
  order_items: 'id',
  purchase_items: 'id',
  purchase_order_items: 'id',
  budget_items: 'id',
  payments: 'id',
  supplier_payments: 'id',
  invoices: 'id',
  stock_movements: 'id',
  expenses: 'id',
  cash_movements: 'id',
  daily_reports: 'id',
};

// Batch size para inserción
const BATCH_SIZE = 500;

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function upsertBatch(table, rows, primaryKey) {
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: primaryKey, ignoreDuplicates: false });

  if (error) {
    throw new Error(`Error en ${table}: ${error.message}`);
  }
}

async function importTable(table, rows, primaryKey, dryRun) {
  if (!rows || rows.length === 0) {
    return { table, imported: 0, status: 'empty' };
  }

  if (dryRun) {
    return { table, imported: rows.length, status: 'dry-run' };
  }

  let imported = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await upsertBatch(table, batch, primaryKey);
    imported += batch.length;
  }

  return { table, imported, status: 'ok' };
}

function validateBundle(bundle) {
  const errors = [];

  if (!bundle.format || bundle.format !== 'frontstock-migration-bundle') {
    errors.push('Formato de archivo no reconocido. Se espera format: "frontstock-migration-bundle"');
  }

  if (!bundle.version) {
    errors.push('Falta campo version');
  }

  if (!bundle.table_order || !Array.isArray(bundle.table_order)) {
    errors.push('Falta campo table_order (array)');
  }

  if (!bundle.tables || typeof bundle.tables !== 'object') {
    errors.push('Falta campo tables (objeto)');
  }

  return errors;
}

function buildPostImportValidation(bundle, results) {
  const validation = {
    validated_at: new Date().toISOString(),
    tables: {},
    issues: [],
  };

  for (const table of bundle.table_order) {
    const expected = (bundle.record_counts || {})[table] || 0;
    const result = results.find((r) => r.table === table);
    const imported = result ? result.imported : 0;

    validation.tables[table] = {
      expected,
      imported,
      match: expected === imported,
    };

    if (expected !== imported) {
      validation.issues.push(
        `${table}: esperado ${expected} filas, importadas ${imported}`
      );
    }
  }

  // Validar integridad
  if (bundle.integrity && bundle.integrity.control_totals) {
    const totals = bundle.integrity.control_totals;
    validation.control_totals_from_source = totals;
    validation.notes = [
      'Comparar control_totals_from_source con los totales reales del sistema destino.',
      'Ejecutar queries de validación post-importación.',
    ];
  }

  return validation;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const filePath = args.filter((a) => a !== '--dry-run')[0];

  if (!filePath) {
    console.error('❌ Uso: node scripts/import-all-data.js [--dry-run] <ruta_al_migration_bundle.json>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Archivo no encontrado: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(`📂 Leyendo bundle: ${resolvedPath}`);
  const raw = fs.readFileSync(resolvedPath, 'utf8');
  const bundle = JSON.parse(raw);

  // Validar formato
  const validationErrors = validateBundle(bundle);
  if (validationErrors.length > 0) {
    console.error('❌ Errores de validación del bundle:');
    validationErrors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log(`\n📋 Resumen del bundle:`);
  console.log(`   Versión: ${bundle.version}`);
  console.log(`   Exportado: ${bundle.exported_at}`);
  console.log(`   Origen: ${bundle.source_url}`);
  console.log(`   Destino: ${SUPABASE_URL}`);
  console.log(`   Tablas: ${bundle.table_order.length}`);
  console.log(`   Total registros: ${Object.values(bundle.record_counts || {}).reduce((a, b) => a + b, 0)}`);

  if (bundle.source_url === SUPABASE_URL) {
    console.warn('\n⚠️  ADVERTENCIA: El origen y destino parecen ser la misma base de datos.');
    console.warn('   Si es intencional, los datos serán sobrescritos (upsert).');
  }

  if (dryRun) {
    console.log('\n🔍 MODO DRY-RUN: No se insertarán datos.\n');
  } else {
    console.log('\n🚀 Iniciando importación...\n');
  }

  const startedAt = Date.now();
  const results = [];
  const failedTables = [];

  for (const table of bundle.table_order) {
    const rows = bundle.tables[table] || [];
    const primaryKey = TABLE_PRIMARY_KEYS[table] || 'id';

    try {
      const result = await importTable(table, rows, primaryKey, dryRun);
      results.push(result);

      const statusIcon = result.status === 'empty' ? '⬜' : result.status === 'dry-run' ? '🔍' : '✅';
      console.log(`${statusIcon} ${table}: ${result.imported} filas ${result.status === 'dry-run' ? '(simulado)' : ''}`);
    } catch (error) {
      failedTables.push({ table, error: error.message });
      results.push({ table, imported: 0, status: 'error' });
      console.error(`❌ ${table}: ${error.message}`);
    }
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);

  // Validación post-importación
  const postValidation = buildPostImportValidation(bundle, results);

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 Resumen de importación:`);
  console.log(`   Modo: ${dryRun ? 'DRY-RUN (sin cambios)' : 'REAL'}`);
  console.log(`   Tiempo: ${elapsed}s`);
  console.log(`   Tablas procesadas: ${results.length}`);
  console.log(`   Exitosas: ${results.filter((r) => r.status === 'ok' || r.status === 'dry-run' || r.status === 'empty').length}`);
  console.log(`   Fallidas: ${failedTables.length}`);
  console.log(`   Total filas: ${results.reduce((acc, r) => acc + r.imported, 0)}`);

  if (postValidation.issues.length > 0) {
    console.log(`\n⚠️  Problemas de integridad:`);
    postValidation.issues.forEach((issue) => console.log(`   - ${issue}`));
  } else {
    console.log(`\n✅ Integridad OK: todos los conteos coinciden.`);
  }

  if (failedTables.length > 0) {
    console.log(`\n❌ Tablas con error:`);
    failedTables.forEach((t) => console.log(`   - ${t.table}: ${t.error}`));
  }

  // Guardar reporte
  const reportPath = resolvedPath.replace('.json', '_import_report.json');
  const report = {
    imported_at: new Date().toISOString(),
    dry_run: dryRun,
    target_url: SUPABASE_URL,
    elapsed_seconds: Number(elapsed),
    results,
    failed_tables: failedTables,
    validation: postValidation,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 Reporte guardado: ${reportPath}`);

  if (!dryRun && failedTables.length === 0) {
    console.log('\n🎉 ¡Importación completada exitosamente!');
  }
}

main().catch((error) => {
  console.error('❌ Error fatal en la importación:', error.message);
  process.exit(1);
});
