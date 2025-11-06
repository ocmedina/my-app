'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import { Database } from '@/lib/database.types'
import toast from 'react-hot-toast' // Importamos toast

type Customer = Database['public']['Tables']['customers']['Row']

export default function EditCustomerPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  // Estados para cada campo del formulario
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [customerType, setCustomerType] = useState('minorista')
  const [address, setAddress] = useState('') // <-- 1. ESTADO AÑADIDO
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false) // Loading para el botón

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return
      setLoading(true)

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        // Llenamos los estados del formulario con los datos del cliente
        setFullName(data.full_name)
        setPhone(data.phone || '')
        setEmail(data.email || '')
        setCustomerType(data.customer_type)
        setAddress(data.address || '') // <-- 2. CARGAMOS LA DIRECCIÓN
      } else {
        toast.error('Error: Cliente no encontrado.')
        console.error('Error fetching customer:', error)
        router.push('/dashboard/clientes')
      }
      setLoading(false)
    }

    fetchCustomer()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    const { error } = await supabase
      .from('customers')
      .update({
        full_name: fullName,
        phone,
        email,
        customer_type: customerType,
        address: address // <-- 3. AÑADIMOS LA DIRECCIÓN AL GUARDAR
      })
      .eq('id', id)

    setFormLoading(false)
    if (error) {
      toast.error(`Error al actualizar el cliente: ${error.message}`) // Cambiado a toast
    } else {
      toast.success('Cliente actualizado exitosamente.') // Cambiado a toast
      router.push('/dashboard/clientes')
      router.refresh()
    }
  }

  if (loading) {
    return <div className="p-6">Cargando datos del cliente...</div>
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Editar Cliente</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nombre Completo / Razón Social</label>
            <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="customerType" className="block text-sm font-medium text-gray-700">Tipo de Cliente</label>
            <select id="customerType" value={customerType} onChange={(e) => setCustomerType(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
              <option value="minorista">Minorista</option>
              <option value="mayorista">Mayorista</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
        </div>

        {/* --- 4. CAMPO DE DIRECCIÓN AÑADIDO --- */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Dirección</label>
          <input 
            type="text" 
            id="address" 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            placeholder="Calle, Número, Localidad"
          />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={formLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            {formLoading ? 'Actualizando...' : 'Actualizar Cliente'}
          </button>
        </div>
      </form>
    </div>
  )
}