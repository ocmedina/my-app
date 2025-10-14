// src/app/dashboard/ventas/[id]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import SaleDetailsClient from './SaleDetailsClient'; // Asegúrate de que este archivo también exista

async function getSaleDetails(saleId: string) {
  const supabase = createServerComponentClient({ cookies });
  const { data, error } = await supabase
    .from('sales')
    .select(`
      id,
      created_at,
      total_amount,
      customers ( full_name, customer_type ),
      profiles ( full_name ),
      sale_items (
        quantity,
        price,
        products ( name, sku )
      )
    `)
    .eq('id', saleId)
    .single();

  if (error) {
    console.error("Error al obtener detalles de la venta:", error.message);
  }
  
  return data;
}

export default async function SaleDetailPage({ params }: { params: { id: string } }) {
  const sale = await getSaleDetails(params.id);

  if (!sale) {
    return <div>Venta no encontrada.</div>;
  }

  return <SaleDetailsClient sale={sale} />;
}