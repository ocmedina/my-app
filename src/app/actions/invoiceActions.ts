'use server'

import { createClient } from '@/lib/server'
import { createAdminClient } from '@/lib/admin'
import { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'

type CustomerData = Database['public']['Tables']['customers']['Row'];
type SaleItemData = Database['public']['Tables']['sale_items']['Row'] & {
    products: Database['public']['Tables']['products']['Row'] | null;
};

export async function createInvoiceFromSale(saleId: string) {
    
    try {
        // Cliente normal para leer datos con el contexto del usuario
        const supabase = await createClient();
        
        // Cliente admin puro - NO toca cookies
        const supabaseAdmin = createAdminClient();

        // 1. Verificar si ya existe una factura para esta venta
        const { data: existingInvoice, error: checkError } = await supabase
            .from('invoices')
            .select('id')
            .eq('sale_id', saleId)
            .maybeSingle(); 

        if (checkError) {
            console.error("Error al verificar factura existente:", checkError);
            return { success: false, message: "Error al verificar factura existente." };
        }
        
        if (existingInvoice) {
            return { success: false, message: "Ya existe una factura para esta venta." };
        }

        // 2. Obtener los detalles completos de la venta
        const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .select(`
                id, 
                total_amount, 
                customers ( * ), 
                sale_items ( quantity, price, products ( name, sku ) )
            `)
            .eq('id', saleId)
            .single();
            
        if (saleError || !saleData || !saleData.customers || !saleData.sale_items) {
            console.error("Error fetching sale data:", saleError);
            return { success: false, message: "No se encontraron los datos completos de la venta." };
        }

        // 3. Generar el número de factura (usando cliente Admin)
        const { data: invoiceNumData, error: numError } = await supabaseAdmin
            .rpc('generate_invoice_number');
            
        if (numError || !invoiceNumData) {
            console.error("Error generating invoice number:", numError);
            return { success: false, message: "Error al generar el número de factura." };
        }
        
        const invoiceNumber = invoiceNumData as string;

        // 4. Preparar los datos para 'jsonb'
        const customerSnapshot: CustomerData = saleData.customers; 
        const itemsSnapshot = saleData.sale_items.map((item: SaleItemData) => ({
            name: item.products?.name ?? 'N/A',
            sku: item.products?.sku ?? 'N/A',
            quantity: item.quantity,
            price: item.price
        }));

        // 5. Insertar la nueva factura (usando cliente Admin)
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

        if (insertError) {
            console.error("Error inserting invoice:", insertError);
            return { 
                success: false, 
                message: `Error al guardar la factura: ${insertError.message}` 
            };
        }

        // Revalidar las rutas relevantes
        revalidatePath('/dashboard/ventas');
        revalidatePath(`/dashboard/ventas/${saleId}`);
        revalidatePath('/dashboard/facturas');

        return { 
            success: true, 
            message: `Factura ${invoiceNumber} generada exitosamente.`, 
            invoiceData: newInvoice 
        };

    } catch (error) {
        console.error('Error inesperado al crear factura:', error);
        return { 
            success: false, 
            message: 'Error inesperado al crear la factura.' 
        };
    }
}