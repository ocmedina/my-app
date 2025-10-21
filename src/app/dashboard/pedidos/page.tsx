'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { FaSearch } from 'react-icons/fa'
import toast from 'react-hot-toast'
import OrderStatusChanger from '@/components/OrderStatusChanger'

const ITEMS_PER_PAGE = 15

// Tipos de datos para mayor seguridad y autocompletado
type CustomerRow = {
  id: string
  full_name: string
  delivery_day: string | null
}

type ProductRow = {
  id: string
  name: string
  stock: number | null
}

type OrderItemRow = {
  quantity: number
  products: ProductRow | null
}

type OrderRow = {
  id: string
  created_at: string
  total_amount: number | null
  status: 'pendiente' | 'confirmado' | 'enviado' | 'entregado' | 'cancelado'
  customers: CustomerRow | null
  order_items: OrderItemRow[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Estados para todos los filtros
  const [statusFilter, setStatusFilter] = useState<'todos' | OrderRow['status']>('todos')
  const [dateFilter, setDateFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [deliveryDayFilter, setDeliveryDayFilter] = useState('todos')

  const fetchOrders = useCallback(async () => {
    setLoading(true)

    const from = (currentPage - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    let query = supabase
      .from('orders')
      .select(
        `
        id, created_at, total_amount, status,
        customers ( id, full_name, delivery_day ),
        order_items ( quantity, products ( id, name, stock ) )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to)

    if (statusFilter !== 'todos') query = query.eq('status', statusFilter)
    if (dateFilter) {
      const startDate = new Date(dateFilter)
      startDate.setUTCHours(0, 0, 0, 0)
      const endDate = new Date(dateFilter)
      endDate.setUTCHours(23, 59, 59, 999)
      query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString())
    }
    if (searchQuery.length > 2) query = query.ilike('customers.full_name', `%${searchQuery}%`)
    if (deliveryDayFilter !== 'todos') query = query.eq('customers.delivery_day', deliveryDayFilter)


    const { data, error, count } = await query

    if (error) {
      toast.error('Error al cargar los pedidos.')
    } else {
      setOrders((data || []) as OrderRow[])
      setTotalCount(count || 0)
    }

    setLoading(false)
  }, [currentPage, statusFilter, dateFilter, searchQuery, deliveryDayFilter])

  useEffect(() => {
    const debounce = setTimeout(fetchOrders, 300)
    return () => clearTimeout(debounce)
  }, [fetchOrders])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Pedidos</h1>
        <Link href="/dashboard/pedidos/nuevo" className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
          + Nuevo Pedido
        </Link>
      </div>

      <div className="p-4 bg-white rounded-lg shadow-md mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <label className="text-sm font-medium text-gray-700">Buscar por Cliente</label>
            <FaSearch className="absolute left-3 top-9 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Nombre del cliente..." className="w-full p-2 pl-10 border border-gray-300 rounded-md mt-1"/>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Filtrar por Fecha</label>
            <input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} className="w-full p-2 border border-gray-300 rounded-md mt-1"/>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Filtrar por Día de Reparto</label>
            <select value={deliveryDayFilter} onChange={e => { setDeliveryDayFilter(e.target.value); setCurrentPage(1); }} className="w-full p-2 border border-gray-300 rounded-md mt-1">
              <option value="todos">Todos los Días</option>
              {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['todos', 'pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'].map((status) => (
            <button key={status} onClick={() => { setStatusFilter(status as any); setCurrentPage(1); }} className={`px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap ${statusFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-500">Cargando...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-500">No hay pedidos con los filtros aplicados.</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.customers?.full_name ?? 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">${order.total_amount?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm"><OrderStatusChanger order={order} onStatusUpdate={fetchOrders} /></td>
                  <td className="px-6 py-4 text-sm font-medium"><Link href={`/dashboard/pedidos/${order.id}`} className="text-indigo-600 hover:text-indigo-900">Ver Detalle</Link></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-between items-center">
        <span className="text-sm text-gray-700">Mostrando {orders.length} de {totalCount} pedidos</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1 || loading} className="px-3 py-1 border rounded-md text-sm disabled:opacity-50">Anterior</button>
          <span className="text-sm">Página {currentPage} de {Math.max(1, totalPages)}</span>
          <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages || loading} className="px-3 py-1 border rounded-md text-sm disabled:opacity-50">Siguiente</button>
        </div>
      </div>
    </div>
  )
}