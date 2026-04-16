import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const IMPORT_ORDER = [
  'settings', 'brands', 'categories',
  'customers', 'suppliers', 'products', 'profiles',
  'sales', 'orders', 'purchases', 'purchase_orders', 'budgets',
  'sale_items', 'order_items', 'purchase_items', 'purchase_order_items', 'budget_items',
  'payments', 'supplier_payments', 'invoices',
  'stock_movements', 'expenses', 'cash_movements', 'daily_reports',
];

const TABLE_PRIMARY_KEYS: Record<string, string> = {
  settings: 'key',
  brands: 'id', categories: 'id', customers: 'id', suppliers: 'id',
  products: 'id', profiles: 'id', sales: 'id', orders: 'id',
  purchases: 'id', purchase_orders: 'id', budgets: 'id',
  sale_items: 'id', order_items: 'id', purchase_items: 'id',
  purchase_order_items: 'id', budget_items: 'id',
  payments: 'id', supplier_payments: 'id', invoices: 'id',
  stock_movements: 'id', expenses: 'id', cash_movements: 'id', daily_reports: 'id',
};

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verifyAdmin(supabase: any, request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).single();

  return (profile as any)?.role === 'administrador' ? user : null;
}

async function fetchAllRows(supabase: any, table: string) {
  let from = 0;
  const pageSize = 1000;
  const allRows: Record<string, unknown>[] = [];

  while (true) {
    const { data, error } = await (supabase as any)
      .from(table).select('*').range(from, from + pageSize - 1);
    if (error) throw new Error(`Error fetching ${table}: ${error.message}`);
    const rows = data || [];
    allRows.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return allRows;
}

// ─── GET: Export all data ───
export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const user = await verifyAdmin(supabase, request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const exportedData: Record<string, unknown[]> = {};
    const recordCounts: Record<string, number> = {};
    const errors: { table: string; error: string }[] = [];

    for (const table of IMPORT_ORDER) {
      try {
        const rows = await fetchAllRows(supabase, table);
        exportedData[table] = rows;
        recordCounts[table] = rows.length;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push({ table, error: msg });
        exportedData[table] = [];
        recordCounts[table] = 0;
      }
    }

    const bundle = {
      version: '1.0.0',
      format: 'frontstock-migration-bundle',
      exported_at: new Date().toISOString(),
      source_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      table_order: IMPORT_ORDER,
      tables: exportedData,
      record_counts: recordCounts,
      errors: errors.length > 0 ? errors : undefined,
    };

    return new NextResponse(JSON.stringify(bundle), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="migration_bundle_${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST: Import from bundle ───
export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const user = await verifyAdmin(supabase, request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const bundle = await request.json();

    if (bundle.format !== 'frontstock-migration-bundle') {
      return NextResponse.json(
        { error: 'Formato no reconocido. Se espera un migration_bundle.json válido.' },
        { status: 400 }
      );
    }

    const results: { table: string; imported: number; status: string; error?: string }[] = [];
    const importOrder = bundle.table_order || IMPORT_ORDER;

    for (const table of importOrder) {
      const rows = bundle.tables?.[table];
      if (!rows || rows.length === 0) {
        results.push({ table, imported: 0, status: 'empty' });
        continue;
      }

      try {
        const pk = TABLE_PRIMARY_KEYS[table] || 'id';
        let imported = 0;

        for (let i = 0; i < rows.length; i += 500) {
          const batch = rows.slice(i, i + 500);
          const { error } = await (supabase as any)
            .from(table).upsert(batch, { onConflict: pk, ignoreDuplicates: false });
          if (error) throw new Error(error.message);
          imported += batch.length;
        }

        results.push({ table, imported, status: 'ok' });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ table, imported: 0, status: 'error', error: msg });
      }
    }

    return NextResponse.json({
      imported_at: new Date().toISOString(),
      results,
      totals: {
        tables_processed: results.length,
        successful: results.filter((r) => r.status === 'ok' || r.status === 'empty').length,
        failed: results.filter((r) => r.status === 'error').length,
        total_rows: results.reduce((acc, r) => acc + r.imported, 0),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
