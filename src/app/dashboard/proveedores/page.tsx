'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import SupplierActions from '@/components/SupplierActions'
import { FaPlus } from 'react-icons/fa'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSuppliers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      toast.error('Error al cargar los proveedores.')
    } else {
      setSuppliers(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSuppliers()

    // Recargar cuando la página se vuelve visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSuppliers()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Limpiar el event listener cuando el componente se desmonte
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Proveedores</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/compras/nueva" className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
            <FaPlus /> Registrar Compra
          </Link>
          <Link href="/dashboard/proveedores/nuevo" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
            <FaPlus /> Agregar Proveedor
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deuda Actual</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10">Cargando...</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-500">No hay proveedores registrados</td></tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link href={`/dashboard/proveedores/${supplier.id}`} className="hover:underline text-blue-600">
                      {supplier.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.contact_person || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.phone || 'N/A'}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${supplier.debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${(supplier.debt || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <SupplierActions supplierId={supplier.id} onUpdate={fetchSuppliers} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}