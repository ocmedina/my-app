'use server'

import { createAdminClient } from '@/lib/admin';
import { Database } from '@/lib/database.types';
import { revalidatePath } from 'next/cache';

type CustomerData = Database['public']['Tables']['customers']['Row'];
type SaleItemData = Database['public']['Tables']['sale_items']['Row'] & {
    products: Database['public']['Tables']['products']['Row'] | null;
};

export async function createInvoiceFromSale(saleId: string) {
  try {
    // Usamos solo Admin client
    const supabaseAdmin = createAdminClient();

    // 1. Verificar si ya existe factura
    const { data: existingInvoice, error: checkError } = await supabaseAdmin
      .from('invoices')
      .select('id')
      .eq('sale_id', saleId)
      .maybeSingle();

    if (checkError) return { success: false, message: "Error al verificar factura existente." };
    if (existingInvoice) return { success: false, message: "Ya existe una factura para esta venta." };

    // 2. Obtener datos de la venta
    const { data: saleData, error: saleError } = await supabaseAdmin
      .from('sales')
      .select(`
        id,
        total_amount,
        customers (*),
        sale_items ( quantity, price, products ( name, sku ) )
      `)
      .eq('id', saleId)
      .single();

    if (saleError || !saleData) return { success: false, message: "No se encontraron los datos completos de la venta." };

    // 3. Generar número de factura
    const { data: invoiceNumData, error: numError } = await supabaseAdmin.rpc('generate_invoice_number');
    if (numError || !invoiceNumData) return { success: false, message: "Error al generar el número de factura." };
    const invoiceNumber = invoiceNumData as string;

    // 4. Preparar datos
    const customerSnapshot: CustomerData = saleData.customers;
    const itemsSnapshot = saleData.sale_items.map((item: SaleItemData) => ({
      name: item.products?.name ?? 'N/A',
      sku: item.products?.sku ?? 'N/A',
      quantity: item.quantity,
      price: item.price
    }));

    // 5. Insertar factura
    const { data: newInvoice, error: insertError } = await supabaseAdmin
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        sale_id: saleId,
        customer_data: customerSnapshot,
        items_data: itemsSnapshot,
        total_amount: saleData.total_amount
      })
      .select()
      .single();

    if (insertError) return { success: false, message: `Error al guardar la factura: ${insertError.message}` };

    // 6. Revalidar rutas
    revalidatePath('/dashboard/ventas');
    revalidatePath(`/dashboard/ventas/${saleId}`);
    revalidatePath('/dashboard/facturas');

    return { success: true, message: `Factura ${invoiceNumber} generada exitosamente.`, invoiceData: newInvoice };
  } catch (error) {
    console.error('Error inesperado al crear factura:', error);
    return { success: false, message: 'Error inesperado al crear la factura.' };
  }
}
