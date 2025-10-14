// src/app/dashboard/products/edit/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation' // <-- Se importa useParams
import { Database } from '@/lib/database.types'

type Product = Database['public']['Tables']['products']['Row']

// Se eliminan los props de la función
export default function EditProductPage() {
  const router = useRouter()
  const params = useParams() // <-- Se usa el hook para obtener los params
  const id = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  
  // Estados para cada campo del formulario
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [priceMinorista, setPriceMinorista] = useState('')
  const [priceMayorista, setPriceMayorista] = useState('')
  const [stock, setStock] = useState('')

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setProduct(data)
        // Llenamos los estados del formulario con los datos del producto
        setSku(data.sku)
        setName(data.name)
        setPriceMinorista(data.price_minorista?.toString() || '')
        setPriceMayorista(data.price_mayorista?.toString() || '')
        setStock(data.stock?.toString() || '')
      } else {
        console.error('Error fetching product:', error)
        router.push('/dashboard/products')
      }
    }

    fetchProduct()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase
      .from('products')
      .update({
        sku,
        name,
        price_minorista: parseFloat(priceMinorista),
        price_mayorista: parseFloat(priceMayorista),
        stock: parseInt(stock, 10),
      })
      .eq('id', id)

    if (error) {
      alert(`Error al actualizar el producto: ${error.message}`)
    } else {
      alert('Producto actualizado exitosamente.')
      router.push('/dashboard/products')
      router.refresh()
    }
  }

  if (!product) {
    return <div>Cargando...</div>
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Editar Producto: {product.name}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU (Código)</label>
            <input type="text" id="sku" value={sku} onChange={(e) => setSku(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="priceMinorista" className="block text-sm font-medium text-gray-700">Precio Minorista</label>
            <input type="number" id="priceMinorista" value={priceMinorista} onChange={(e) => setPriceMinorista(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="priceMayorista" className="block text-sm font-medium text-gray-700">Precio Mayorista</label>
            <input type="number" id="priceMayorista" value={priceMayorista} onChange={(e) => setPriceMayorista(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock</label>
            <input type="number" id="stock" value={stock} onChange={(e) => setStock(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Actualizar Producto
          </button>
        </div>
      </form>
    </div>
  )
}