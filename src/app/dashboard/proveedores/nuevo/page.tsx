'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function NewSupplierPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    const supplierData = {
      name: formData.get('name') as string,
      contact_person: formData.get('contact_person') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
      cuit: formData.get('cuit') as string,
    }

    if (!supplierData.name) {
      toast.error('El nombre del proveedor es obligatorio.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('suppliers').insert([supplierData])

    if (error) {
      toast.error(`Error al crear el proveedor: ${error.message}`)
    } else {
      toast.success('Proveedor creado exitosamente.')
      router.push('/dashboard/proveedores')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Agregar Nuevo Proveedor</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre / Razón Social</label>
          <input name="name" type="text" required className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Persona de Contacto</label>
            <input name="contact_person" type="text" className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">CUIT / CUIL</label>
            <input name="cuit" type="text" className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input name="phone" type="tel" className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Dirección</label>
          <input name="address" type="text" className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
        </div>
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400">
            {loading ? 'Guardando...' : 'Guardar Proveedor'}
          </button>
        </div>
      </form>
    </div>
  )
}