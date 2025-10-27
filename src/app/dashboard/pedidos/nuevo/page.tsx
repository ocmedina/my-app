'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/lib/database.types'
import { User } from '@supabase/supabase-js'
import { FaSearch, FaShoppingCart, FaTrash, FaPlus, FaMinus, FaUser, FaBox, FaCheckCircle } from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

type Customer = Database['public']['Tables']['customers']['Row']
type Product = Database['public']['Tables']['products']['Row']
type CartItem = Product & { quantity: number }

export default function NewOrderPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadInitialData() {
      const loadingToast = toast.loading('Cargando datos...')
      
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('full_name')
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (customersError || productsError) {
        toast.error('Error al cargar los datos', { id: loadingToast })
        return
      }
      
      setCustomers(customersData || [])
      setProducts(productsData || [])
      setFilteredProducts(productsData || [])
      setCurrentUser(session?.user ?? null)
      toast.success('Datos cargados', { id: loadingToast })
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    if (!selectedCustomer) {
      setTotal(0)
      return
    }
    
    const newTotal = cart.reduce((acc, item) => {
      const price = selectedCustomer.customer_type === 'mayorista' 
        ? item.price_mayorista 
        : item.price_minorista
      return acc + (price || 0) * item.quantity
    }, 0)
    setTotal(newTotal)
  }, [cart, selectedCustomer])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredProducts(filtered)
    }
  }, [searchQuery, products])

  const getProductPrice = (product: Product) => {
    if (!selectedCustomer) return 0
    return selectedCustomer.customer_type === 'mayorista' 
      ? product.price_mayorista 
      : product.price_minorista
  }

  const handleAddProduct = (product: Product) => {
    if (!selectedCustomer) {
      toast.error('Por favor, selecciona un cliente primero')
      return
    }

    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      if (existingItem.quantity < (product.stock || 0)) {
        setCart(cart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        ))
        toast.success(`${product.name} agregado`)
      } else {
        toast.error('No hay más stock disponible')
      }
    } else {
      if ((product.stock || 0) > 0) {
        setCart([...cart, { ...product, quantity: 1 }])
        toast.success(`${product.name} agregado al carrito`)
      } else {
        toast.error('Este producto no tiene stock')
      }
    }
  }

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const item = cart.find(i => i.id === productId)
    if (!item) return

    const newQuantity = item.quantity + delta

    if (newQuantity <= 0) {
      handleRemoveFromCart(productId)
      return
    }

    if (newQuantity > (item.stock || 0)) {
      toast.error('No hay suficiente stock')
      return
    }

    setCart(cart.map(i => 
      i.id === productId 
        ? { ...i, quantity: newQuantity } 
        : i
    ))
  }

  const handleRemoveFromCart = (productId: string) => {
    const item = cart.find(i => i.id === productId)
    setCart(cart.filter(i => i.id !== productId))
    if (item) {
      toast.success(`${item.name} eliminado del carrito`)
    }
  }

  const handleFinalizeOrder = async () => {
    if (!selectedCustomer || cart.length === 0 || !currentUser?.id) {
      toast.error('Faltan datos para completar el pedido')
      return
    }

    setIsSubmitting(true)
    const loadingToast = toast.loading('Guardando pedido...')

    try {
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
        throw new Error(orderError?.message || 'Error al crear el pedido')
      }

      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        price: getProductPrice(item),
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        throw new Error(itemsError.message)
      }

      toast.success('¡Pedido registrado exitosamente!', { id: loadingToast })
      
      setTimeout(() => {
        router.push('/dashboard/pedidos')
      }, 1500)
      
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el pedido', { id: loadingToast })
      setIsSubmitting(false)
    }
  }

  const getStockColor = (stock: number | null) => {
    if (!stock || stock === 0) return 'text-red-600 bg-red-50'
    if (stock < 10) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Pedido</h1>
          <p className="text-sm text-gray-500 mt-1">
            Crea un nuevo pedido seleccionando cliente y productos
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selección de Cliente */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <FaUser className="text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">1. Seleccionar Cliente</h2>
            </div>
            
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const customer = customers.find(c => c.id === e.target.value)
                setSelectedCustomer(customer || null)
                if (customer) {
                  toast.success(`Cliente seleccionado: ${customer.full_name}`)
                }
              }}
            >
              <option value="">Selecciona un cliente...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name} - {customer.customer_type === 'mayorista' ? '🏢 Mayorista' : '👤 Minorista'}
                </option>
              ))}
            </select>

            {selectedCustomer && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Tipo:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedCustomer.customer_type === 'mayorista' ? 'Mayorista' : 'Minorista'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Día de reparto:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedCustomer.delivery_day || 'No especificado'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selección de Productos */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <FaBox className="text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">2. Agregar Productos</h2>
            </div>

            {!selectedCustomer ? (
              <div className="text-center py-12 text-gray-500">
                <FaUser className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Selecciona un cliente para ver los productos disponibles</p>
              </div>
            ) : (
              <>
                {/* Buscador */}
                <div className="relative mb-4">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar productos..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Lista de Productos */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">No se encontraron productos</p>
                  ) : (
                    filteredProducts.map((product) => {
                      const isInCart = cart.some(item => item.id === product.id)
                      const price = getProductPrice(product)
                      
                      return (
                        <div
                          key={product.id}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                            isInCart 
                              ? 'border-blue-300 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900">{product.name}</h3>
                              {isInCart && (
                                <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                                  En carrito
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm font-semibold text-gray-900">
                                ${price?.toFixed(2)}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStockColor(product.stock)}`}>
                                Stock: {product.stock || 0}
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleAddProduct(product)}
                            disabled={(product.stock || 0) === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                          >
                            <FaPlus className="w-3 h-3" />
                            Agregar
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Panel de Carrito */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <FaShoppingCart className="text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Resumen del Pedido</h2>
            </div>

            <div className="space-y-3 min-h-[300px] max-h-[400px] overflow-y-auto mb-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FaShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>El carrito está vacío</p>
                </div>
              ) : (
                cart.map(item => {
                  const price = getProductPrice(item)
                  const subtotal = price * item.quantity
                  
                  return (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">${price.toFixed(2)} c/u</p>
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-100"
                          >
                            <FaMinus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-100"
                            disabled={item.quantity >= (item.stock || 0)}
                          >
                            <FaPlus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-semibold text-gray-900">
                          ${subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Productos</span>
                <span>{cart.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Unidades</span>
                <span>{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-2 border-t">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              <button
                onClick={handleFinalizeOrder}
                disabled={cart.length === 0 || !selectedCustomer || isSubmitting}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <FaCheckCircle className="w-4 h-4" />
                {isSubmitting ? 'Guardando...' : 'Guardar Pedido'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}