// src/app/dashboard/pedidos/[id]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Database } from '@/lib/database.types';
import OrderDetailsClient from './OrderDetailsClient'; // Importaremos el componente cliente que crearemos abajo

// Esta función obtiene todos los detalles del pedido desde el servidor
async function getOrderDetails(orderId: string) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      created_at,
      total_amount,
      status,
      customers ( full_name, customer_type ),
      profiles ( full_name ),
      order_items (
        quantity,
        price,
        products ( id, name, sku, stock )
      )
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order details:', error);
    return null;
  }
  return data;
}

// Este es el Componente de Servidor principal
export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await getOrderDetails(params.id);

  if (!order) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">Pedido no encontrado</h1>
        <Link href="/dashboard/pedidos" className="text-blue-600 mt-4 inline-block">
          &larr; Volver al listado
        </Link>
      </div>
    );
  }

  return <OrderDetailsClient initialOrder={order} />;
}