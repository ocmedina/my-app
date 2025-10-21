// src/app/dashboard/clientes/new/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function NewCustomerPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [customerType, setCustomerType] = useState('minorista')
  const [deliveryDay, setDeliveryDay] = useState('') // <-- NUEVO ESTADO

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) { toast.error('El nombre es obligatorio.'); return; }

    const { error } = await supabase.from('customers').insert([
      {
        full_name: fullName,
        phone,
        email,
        customer_type: customerType,
        delivery_day: deliveryDay || null, // <-- GUARDAMOS EL DÍA
      },
    ]);

    if (error) {
      toast.error(`Error al crear el cliente: ${error.message}`);
    } else {
      toast.success('Cliente creado exitosamente.');
      router.push('/dashboard/clientes');
      router.refresh();
    }
  };

  const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Agregar Nuevo Cliente</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
            <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md"/>
          </div>
          <div>
            <label htmlFor="customerType" className="block text-sm font-medium text-gray-700">Tipo de Cliente</label>
            <select id="customerType" value={customerType} onChange={(e) => setCustomerType(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md">
              <option value="minorista">Minorista</option>
              <option value="mayorista">Mayorista</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full p-2 border rounded-md"/>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full p-2 border rounded-md"/>
          </div>
        </div>
        
        {/* --- NUEVO CAMPO: DÍA DE REPARTO --- */}
        <div>
          <label htmlFor="deliveryDay" className="block text-sm font-medium text-gray-700">Día de Reparto (Opcional)</label>
          <select id="deliveryDay" value={deliveryDay} onChange={(e) => setDeliveryDay(e.target.value)} className="mt-1 block w-full p-2 border rounded-md">
            <option value="">Ninguno</option>
            {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
          </select>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Guardar Cliente</button>
        </div>
      </form>
    </div>
  )
}