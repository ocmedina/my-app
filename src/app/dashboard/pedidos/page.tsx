'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { FaSearch, FaPlus, FaFilter, FaTimes } from 'react-icons/fa'
import toast from 'react-hot-toast'
import OrderStatusChanger from '@/components/OrderStatusChanger'

const ITEMS_PER_PAGE = 15

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

const STATUS_CONFIG = {
  todos: { label: 'Todos', color: 'bg-gray-100 text-gray-700', activeColor: 'bg-gray-600 text-white' },
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', activeColor: 'bg-yellow-600 text-white' },
  confirmado: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700', activeColor: 'bg-blue-600 text-white' },
  enviado: { label: 'Enviado', color: 'bg-purple-100 text-purple-700', activeColor: 'bg-purple-600 text-white' },
  entregado: { label: 'Entregado', color: 'bg-green-100 text-green-700', activeColor: 'bg-green-600 text-white' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700', activeColor: 'bg-red-600 text-white' },
} as const

const DAYS_OF_WEEK = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  const [statusFilter, setStatusFilter] = useState<'todos' | OrderRow['status']>('todos')
  const [dateFilter, setDateFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [deliveryDayFilter, setDeliveryDayFilter] = useState('todos')

  const hasActiveFilters = statusFilter !== 'todos' || dateFilter || searchQuery || deliveryDayFilter !== 'todos'

  const clearFilters = () => {
    setStatusFilter('todos')
    setDateFilter('')
    setSearchQuery('')
    setDeliveryDayFilter('todos')
    setCurrentPage(1)
  }

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
      console.error(error)
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

  const getStatusBadge = (status: OrderRow['status']) => {
    const config = STATUS_CONFIG[status]
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalCount} pedido{totalCount !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Link 
          href="/dashboard/pedidos/nuevo" 
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <FaPlus className="w-4 h-4" />
          Nuevo Pedido
        </Link>
      </div>

      {/* Filtros de Estado */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Filtrar por Estado</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <FaFilter className="w-3 h-3" />
            {showFilters ? 'Ocultar' : 'Más'} Filtros
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((status) => {
            const config = STATUS_CONFIG[status]
            const isActive = statusFilter === status
            return (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status as any)
                  setCurrentPage(1)
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive ? config.activeColor : `${config.color} hover:opacity-80`
                }`}
              >
                {config.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Filtros Avanzados */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4 animate-slideDown">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Filtros Avanzados</h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
              >
                <FaTimes className="w-3 h-3" />
                Limpiar Filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar Cliente
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Nombre del cliente..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha del Pedido
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Día de Reparto
              </label>
              <select
                value={deliveryDayFilter}
                onChange={(e) => {
                  setDeliveryDayFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos los Días</option>
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Pedidos */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Día de Reparto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center gap-2 text-gray-500">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Cargando pedidos...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <FaSearch className="w-8 h-8 text-gray-300" />
                      <p>No se encontraron pedidos con los filtros aplicados</p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customers?.full_name ?? 'Sin cliente'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customers?.delivery_day ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${order.total_amount?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OrderStatusChanger order={order} onStatusUpdate={fetchOrders} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/dashboard/pedidos/${order.id}`}
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Ver Detalle
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-lg shadow-sm p-4">
          <span className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{orders.length}</span> de{' '}
            <span className="font-medium">{totalCount}</span> pedidos
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">
              Página <span className="font-medium">{currentPage}</span> de{' '}
              <span className="font-medium">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}