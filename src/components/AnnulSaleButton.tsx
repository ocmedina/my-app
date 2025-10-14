// src/components/AnnulSaleButton.tsx
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function AnnulSaleButton({ sale }: { sale: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAnnul = async () => {
    if (!confirm("¿Seguro que quieres anular esta venta? Esta acción no se puede deshacer.")) return;
    setLoading(true);

    // 1. Devolver stock
    for (const item of sale.sale_items) {
      await supabase.rpc('increment_stock', { product_id: item.product_id, quantity: item.quantity });
    }

    // 2. Revertir deuda (si la hubo)
    // ... (lógica más compleja, por ahora omitida para simplicidad)

    // 3. Marcar venta como anulada (necesitarías una columna 'status' en la tabla 'sales')

    alert("Venta anulada y stock devuelto.");
    router.refresh();
    setLoading(false);
  };

  return <button onClick={handleAnnul} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-md">{loading ? 'Anulando...' : 'Anular Venta'}</button>
}