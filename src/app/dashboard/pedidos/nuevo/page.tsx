// src/app/dashboard/pedidos/nuevo/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/lib/database.types'
import { User } from '@supabase/supabase-js'

type Customer = Database['public']['Tables']['customers']['Row']
type Product = Database['public']['Tables']['products']['Row']
type CartItem = Product & { quantity: number }

export default function NewOrderPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    async function loadInitialData() {
      const { data: customersData } = await supabase.from('customers').select('*').eq('is_active', true)
      setCustomers(customersData || [])
      const { data: productsData } = await supabase.from('products').select('*').eq('is_active', true)
      setProducts(productsData || [])
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUser(session?.user ?? null)
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    if (!selectedCustomer) { setTotal(0); return }
    const newTotal = cart.reduce((acc, item) => {
      const price = selectedCustomer.customer_type === 'mayorista' ? item.price_mayorista : item.price_minorista
      return acc + (price || 0) * item.quantity
    }, 0)
    setTotal(newTotal)
  }, [cart, selectedCustomer])

  const handleAddProduct = (productId: string) => {
    if (!selectedCustomer) { alert('Por favor, selecciona un cliente primero.'); return }
    const productToAdd = products.find(p => p.id === productId)
    if (!productToAdd) return
    const existingItem = cart.find(item => item.id === productId)
    if (existingItem) {
      if (existingItem.quantity < (productToAdd.stock || 0)) {
        setCart(cart.map(item => item.id === productId ? { ...item, quantity: item.quantity + 1 } : item))
      } else {
        alert('No hay más stock disponible para este producto.')
      }
    } else {
      if ((productToAdd.stock || 0) > 0) {
        setCart([...cart, { ...productToAdd, quantity: 1 }])
      } else {
        alert('Este producto no tiene stock.')
      }
    }
  }

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const handleFinalizeOrder = async () => {
    if (!selectedCustomer || cart.length === 0 || !currentUser?.id) {
      alert('Faltan datos para completar el pedido.'); return
    }

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: selectedCustomer.id,
        profile_id: currentUser.id,
        total_amount: total,
        status: 'pendiente',
      })
      .select()
      .single()

    if (orderError || !orderData) {
      alert(`Error al registrar el pedido: ${orderError?.message}`); return
    }

    const orderItems = cart.map(item => ({
      order_id: orderData.id,
      product_id: item.id,
      quantity: item.quantity,
      price: selectedCustomer.customer_type === 'mayorista' ? item.price_mayorista : item.price_minorista,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) {
      alert(`Error al registrar los productos del pedido: ${itemsError.message}`); return
    }

    alert('¡Pedido registrado exitosamente!')
    setCart([])
    setSelectedCustomer(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Nuevo Pedido</h1>
        <div className="mb-4">
          <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
            1. Seleccionar Cliente
          </label>
          <select
            id="customer"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const customer = customers.find(c => c.id === e.target.value)
              setSelectedCustomer(customer || null)
            }}
          >
            <option value="">Selecciona un cliente...</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.full_name} ({customer.customer_type})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
            2. Agregar Producto
          </label>
          <div className="flex gap-2">
            <select id="product-select" className="w-full p-2 border border-gray-300 rounded-md">
              <option value="">Selecciona un producto...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (Stock: {product.stock})
                </option>
              ))}
            </select>
            <button 
              onClick={() => {
                const select = document.getElementById('product-select') as HTMLSelectElement
                if (select.value) handleAddProduct(select.value)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Agregar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Resumen del Pedido</h2>
        <div className="space-y-3 min-h-[200px]">
          {cart.length === 0 ? (
            <p className="text-gray-400 text-center pt-8">El carrito está vacío.</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-500">Cant: {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span>${((selectedCustomer?.customer_type === 'mayorista' ? item.price_mayorista : item.price_minorista) || 0) * item.quantity}</span>
                  <button onClick={() => handleRemoveFromCart(item.id)} className="text-red-500 hover:text-red-700">
                    &times;
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button 
            onClick={handleFinalizeOrder}
            className="w-full mt-4 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400"
            disabled={cart.length === 0 || !selectedCustomer}
          >
            Guardar Pedido
          </button>
        </div>
      </div>
    </div>
  )
}