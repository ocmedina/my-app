import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import SaleDetailsClient from './SaleDetailsClient';
import { Database } from '@/lib/database.types';
import Link from 'next/link';

// Cambia el tipo de params a Promise
export default async function SaleDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  
  // Await params antes de usarlo
  const { id } = await params;
  
  // Await cookies antes de usarlo
  const cookieStore = await cookies();
  
  // --- LÓGICA DE CARGA DIRECTAMENTE AQUÍ ---
  const supabase = createServerComponentClient<Database>({ 
    cookies: () => cookieStore 
  });
  
  const { data: sale, error } = await supabase
    .from('sales')
    .select(`
      id,
      created_at,
      total_amount,
      customers ( * ),
      profiles ( * ),
      sale_items ( *, products ( * ) )
    `)
    .eq('id', id) // Usa el id extraído
    .single();

  if (error || !sale) {
    console.error("Error al obtener detalles de la venta:", error?.message);
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold">Venta no encontrada</h1>
            <p>No se pudieron cargar los detalles de esta venta.</p>
            <Link href="/dashboard/ventas" className="text-blue-600 mt-4 inline-block">
            &larr; Volver al historial
            </Link>
        </div>
    );
  }

  // Pasamos los datos cargados al componente cliente
  return <SaleDetailsClient sale={sale} />;
}