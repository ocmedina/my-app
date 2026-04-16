const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
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

const TABLES = [
  'settings',
  'profiles',
  'brands',
  'categories',
  'suppliers',
  'customers',
  'products',
  'purchase_orders',
  'purchase_order_items',
  'purchases',
  'purchase_items',
  'supplier_payments',
  'orders',
  'order_items',
  'sales',
  'sale_items',
  'payments',
  'stock_movements',
  'expenses',
  'cash_movements',
  'daily_reports',
  'invoices',
  'budgets',
  'budget_items',
];

const IMPORT_ORDER = [
  // 1. Sin dependencias
  'settings',
  'brands',
  'categories',
  // 2. Entidades principales
  'customers',
  'suppliers',
  // 3. Depende de brands/categories
  'products',
  // 4. Profiles (depende de auth.users - deben existir primero)
  'profiles',
  // 5. Transacciones principales
  'sales',
  'orders',
  'purchases',
  'purchase_orders',
  'budgets',
  // 6. Items de transacciones
  'sale_items',
  'order_items',
  'purchase_items',
  'purchase_order_items',
  'budget_items',
  // 7. Pagos y referencias
  'payments',
  'supplier_payments',
  'invoices',
  // 8. Registros independientes
  'stock_movements',
  'expenses',
  'cash_movements',
  'daily_reports',
];

function toTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const asString = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (asString.includes('"') || asString.includes(',') || asString.includes('\n')) {
    return `"${asString.replace(/"/g, '""')}"`;
  }
  return asString;
}

function toCSV(rows) {
  if (!rows || rows.length === 0) return '';

  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const header = keys.map(csvEscape).join(',');
  const lines = rows.map((row) => keys.map((key) => csvEscape(row[key])).join(','));

  return [header, ...lines].join('\n');
}

async function fetchAllRows(table, pageSize = 1000) {
  let from = 0;
  let done = false;
  const allRows = [];

  while (!done) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase.from(table).select('*').range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const rows = data || [];
    allRows.push(...rows);

    if (rows.length < pageSize) {
      done = true;
    } else {
      from += pageSize;
    }
  }

  return allRows;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function buildIntegritySummary(exportedData) {
  const customers = exportedData.customers || [];
  const products = exportedData.products || [];
  const sales = exportedData.sales || [];
  const orders = exportedData.orders || [];
  const payments = exportedData.payments || [];

  const totalCustomerDebt = customers.reduce((acc, row) => acc + toNumber(row.debt), 0);
  const totalStockUnits = products.reduce((acc, row) => acc + toNumber(row.stock), 0);
  const totalSalesAmount = sales.reduce((acc, row) => acc + toNumber(row.total_amount), 0);
  const totalOrdersAmount = orders.reduce((acc, row) => acc + toNumber(row.total_amount), 0);
  const totalPaymentsAmount = payments.reduce((acc, row) => acc + toNumber(row.amount), 0);

  return {
    generated_at: new Date().toISOString(),
    control_totals: {
      total_customer_debt: Number(totalCustomerDebt.toFixed(2)),
      total_stock_units: totalStockUnits,
      total_sales_amount: Number(totalSalesAmount.toFixed(2)),
      total_orders_amount: Number(totalOrdersAmount.toFixed(2)),
      total_payments_amount: Number(totalPaymentsAmount.toFixed(2)),
    },
    notes: [
      'Usar estos valores para validar la migración en el sistema destino.',
      'Comparar también cantidad de registros por tabla.',
    ],
  };
}

function buildMappingTemplate() {
  const rows = [
    {
      source_table: 'customers',
      source_field: 'id',
      target_table: 'clients',
      target_field: 'legacy_customer_id',
      transform: 'direct',
      required: 'yes',
      notes: 'Guardar ID original para trazabilidad',
      example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    },
    {
      source_table: 'customers',
      source_field: 'name',
      target_table: 'clients',
      target_field: 'full_name',
      transform: 'trim',
      required: 'yes',
      notes: 'Nombre del cliente',
      example: 'Juan Pérez',
    },
    {
      source_table: 'customers',
      source_field: 'debt',
      target_table: 'clients',
      target_field: 'current_balance',
      transform: 'decimal(12,2)',
      required: 'no',
      notes: 'Deuda actual',
      example: '12500.50',
    },
    {
      source_table: 'products',
      source_field: 'id',
      target_table: 'items',
      target_field: 'legacy_product_id',
      transform: 'direct',
      required: 'yes',
      notes: 'ID legado del producto',
      example: '4f43d5f5-9876-4fe5-9239-c2b7d7cb519f',
    },
    {
      source_table: 'products',
      source_field: 'name',
      target_table: 'items',
      target_field: 'name',
      transform: 'trim',
      required: 'yes',
      notes: 'Descripción del producto',
      example: 'Harina 000 x 1kg',
    },
    {
      source_table: 'products',
      source_field: 'stock',
      target_table: 'items',
      target_field: 'on_hand_qty',
      transform: 'integer',
      required: 'yes',
      notes: 'Stock actual',
      example: '84',
    },
    {
      source_table: 'sales',
      source_field: 'created_at',
      target_table: 'invoices',
      target_field: 'issued_at',
      transform: 'datetime_timezone',
      required: 'yes',
      notes: 'Mantener zona horaria',
      example: '2026-02-20T18:45:10.123Z',
    },
    {
      source_table: 'payments',
      source_field: 'amount',
      target_table: 'receipts',
      target_field: 'amount',
      transform: 'decimal(12,2)',
      required: 'yes',
      notes: 'Monto de pago',
      example: '3500.00',
    },
  ];

  return rows;
}

function writeTextFile(filePath, lines) {
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

async function main() {
  const startedAt = Date.now();
  const timestamp = toTimestamp();

  const rootExportDir = path.resolve(process.cwd(), 'exports', `system_export_${timestamp}`);
  const jsonDir = path.join(rootExportDir, 'json');
  const csvDir = path.join(rootExportDir, 'csv');

  ensureDir(rootExportDir);
  ensureDir(jsonDir);
  ensureDir(csvDir);

  const workbook = XLSX.utils.book_new();
  const exportedData = {};
  const tableSummary = [];
  const failedTables = [];

  console.log('🚀 Iniciando exportación completa...');
  console.log(`📁 Carpeta de salida: ${rootExportDir}`);

  for (const table of TABLES) {
    try {
      const rows = await fetchAllRows(table);
      exportedData[table] = rows;

      fs.writeFileSync(path.join(jsonDir, `${table}.json`), JSON.stringify(rows, null, 2), 'utf8');
      fs.writeFileSync(path.join(csvDir, `${table}.csv`), toCSV(rows), 'utf8');

      const safeSheetName = table.length <= 31 ? table : table.slice(0, 31);
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

      tableSummary.push({ table, rows: rows.length, status: 'ok' });
      console.log(`✅ ${table}: ${rows.length} filas`);
    } catch (error) {
      failedTables.push({ table, error: error.message });
      tableSummary.push({ table, rows: 0, status: 'error' });
      console.error(`⚠️ ${table}: ${error.message}`);
    }
  }

  XLSX.writeFile(workbook, path.join(rootExportDir, 'all_tables.xlsx'));

  const integritySummary = buildIntegritySummary(exportedData);
  fs.writeFileSync(path.join(rootExportDir, 'integrity_summary.json'), JSON.stringify(integritySummary, null, 2), 'utf8');

  const mappingTemplateRows = buildMappingTemplate();
  fs.writeFileSync(path.join(rootExportDir, 'mapping_template.csv'), toCSV(mappingTemplateRows), 'utf8');

  writeTextFile(path.join(rootExportDir, 'import_order.txt'), [
    'Orden sugerido de importación (evita romper relaciones):',
    ...IMPORT_ORDER.map((table, index) => `${index + 1}. ${table}`),
  ]);

  // ── Migration Bundle (archivo consolidado para importación directa) ──
  const migrationBundle = {
    version: '1.0.0',
    format: 'frontstock-migration-bundle',
    exported_at: new Date().toISOString(),
    source_url: SUPABASE_URL,
    table_order: IMPORT_ORDER,
    tables: {},
    integrity: integritySummary,
    record_counts: {},
  };

  for (const table of IMPORT_ORDER) {
    migrationBundle.tables[table] = exportedData[table] || [];
    migrationBundle.record_counts[table] = (exportedData[table] || []).length;
  }

  fs.writeFileSync(
    path.join(rootExportDir, 'migration_bundle.json'),
    JSON.stringify(migrationBundle, null, 2),
    'utf8'
  );
  console.log(`\n📦 migration_bundle.json generado (${IMPORT_ORDER.length} tablas)`);

  const exportReport = {
    generated_at: new Date().toISOString(),
    output_directory: rootExportDir,
    elapsed_seconds: Number(((Date.now() - startedAt) / 1000).toFixed(2)),
    table_summary: tableSummary,
    failed_tables: failedTables,
    totals: {
      total_tables: TABLES.length,
      successful_tables: tableSummary.filter((t) => t.status === 'ok').length,
      failed_tables: failedTables.length,
      total_rows: tableSummary.reduce((acc, t) => acc + t.rows, 0),
    },
  };

  fs.writeFileSync(path.join(rootExportDir, 'export_report.json'), JSON.stringify(exportReport, null, 2), 'utf8');

  if (failedTables.length > 0) {
    console.log('\n⚠️ Exportación completada con advertencias. Revisá export_report.json');
  } else {
    console.log('\n🎉 Exportación completada correctamente.');
  }

  console.log('\nArchivos clave generados:');
  console.log('- migration_bundle.json  ← USAR PARA IMPORTAR');
  console.log('- all_tables.xlsx');
  console.log('- csv/*.csv');
  console.log('- json/*.json');
  console.log('- mapping_template.csv');
  console.log('- integrity_summary.json');
  console.log('- export_report.json');
}

main().catch((error) => {
  console.error('❌ Error fatal en la exportación:', error.message);
  process.exit(1);
});
