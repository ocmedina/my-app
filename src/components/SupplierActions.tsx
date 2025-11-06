'use client'

import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function SupplierActions({ supplierId, onUpdate }: { supplierId: string, onUpdate: () => void }) {
  const { can } = useAuth(); // Asume que tienes permisos como 'EDITAR_PROVEEDORES'

  const handleDeactivate = async () => {
    // if (!can('DESACTIVAR_PROVEEDORES')) {
    //   toast.error('No tienes permisos para esta acción.');
    //   return;
    // }
    if (confirm('¿Estás seguro de que quieres desactivar este proveedor?')) {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', supplierId);
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Proveedor desactivado.');
        onUpdate(); // Refresca la lista
      }
    }
  }

  return (
    <div className="flex gap-3">
      <Link href={`/dashboard/proveedores/edit/${supplierId}`} className="text-indigo-600 hover:text-indigo-900 text-sm">
        Editar
      </Link>
      <button onClick={handleDeactivate} className="text-red-600 hover:text-red-900 text-sm">
        Desactivar
      </button>
    </div>
  )
}