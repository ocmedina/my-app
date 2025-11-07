'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';

type OrderItemInput = {
  product_id: string;
  quantity: number;
  price: number;
};

export async function updateOrder(
  orderId: string,
  customerId: string,
  totalAmount: number,
  items: OrderItemInput[]
) {
  try {
    // Usar el cliente Admin para tener permisos completos
    const supabase = supabaseAdmin;

    // Verificar que el pedido existe y está en estado pendiente
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (checkError) {
      throw new Error(`Error verificando pedido: ${checkError.message}`);
    }

    if (existingOrder.status !== 'pendiente') {
      throw new Error('Solo se pueden editar pedidos en estado pendiente');
    }

    // Eliminar items anteriores
    const { data: deletedItems, error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId)
      .select();

    if (deleteError) {
      console.error('Error eliminando items:', deleteError);
      throw new Error(`Error al eliminar items anteriores: ${deleteError.message}`);
    }

    console.log(`[Server Action] Items eliminados: ${deletedItems?.length || 0}`, deletedItems);

    // Insertar nuevos items
    const orderItems = items.map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }));

    console.log(`[Server Action] Items a insertar: ${orderItems.length}`, orderItems);

    const { data: insertedItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) {
      console.error('Error insertando items:', itemsError);
      throw new Error(`Error al insertar items: ${itemsError.message}`);
    }

    console.log(`[Server Action] Items insertados: ${insertedItems?.length || 0}`, insertedItems);

    // Actualizar el pedido
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        customer_id: customerId,
        total_amount: totalAmount,
      })
      .eq('id', orderId);

    if (orderError) {
      throw new Error(`Error al actualizar pedido: ${orderError.message}`);
    }

    // Revalidar la página de detalles
    revalidatePath(`/dashboard/pedidos/${orderId}`);
    revalidatePath('/dashboard/pedidos');

    return { success: true };
  } catch (error: any) {
    console.error('Error en updateOrder:', error);
    return { success: false, error: error.message };
  }
}
