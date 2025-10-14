// src/app/dashboard/products/new/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function NewProductPage() {
  const router = useRouter()
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [priceMinorista, setPriceMinorista] = useState('')
  const [priceMayorista, setPriceMayorista] = useState('')
  const [stock, setStock] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sku || !name || !priceMinorista || !priceMayorista || !stock) {
      alert('Por favor, completa todos los campos.')
      return
    }

    const { data, error } = await supabase
      .from('products')
      .insert([
        { 
          sku, 
          name, 
          price_minorista: parseFloat(priceMinorista), 
          price_mayorista: parseFloat(priceMayorista), 
          stock: parseInt(stock, 10) 
        },
      ])

    if (error) {
      alert(`Error al crear el producto: ${error.message}`)
      console.error(error)
    } else {
      alert('Producto creado exitosamente.')
      router.push('/dashboard/products') // Redirige de vuelta a la lista
      router.refresh() // Refresca los datos de la página de productos
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Agregar Nuevo Producto</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SKU y Nombre */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU (Código)</label>
            <input type="text" id="sku" value={sku} onChange={(e) => setSku(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
        </div>

        {/* Precios y Stock */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="priceMinorista" className="block text-sm font-medium text-gray-700">Precio Minorista</label>
            <input type="number" id="priceMinorista" value={priceMinorista} onChange={(e) => setPriceMinorista(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="priceMayorista" className="block text-sm font-medium text-gray-700">Precio Mayorista</label>
            <input type="number" id="priceMayorista" value={priceMayorista} onChange={(e) => setPriceMayorista(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock Inicial</label>
            <input type="number" id="stock" value={stock} onChange={(e) => setStock(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Guardar Producto
          </button>
        </div>
      </form>
    </div>
  )
}