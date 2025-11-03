// src/app/dashboard/graficos/page.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import { supabase } from '@/lib/supabaseClient'
import { TrendingUp, Package, DollarSign, Calendar } from 'lucide-react'

interface Venta {
  fecha: string
  total: number
}

interface Producto {
  nombre: string
  cantidad: number
}

export default function GraficosPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalVentas: 0,
    ventasHoy: 0,
    promedioVentas: 0,
    productoMasVendido: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // --- Ventas por día ---
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('created_at, total_amount')
          .order('created_at', { ascending: true })

        if (salesError) throw salesError

        if (salesData && salesData.length > 0) {
          const ventasPorFecha: Record<string, number> = {}
          let totalVentas = 0
          const hoy = new Date().toISOString().split('T')[0]
          let ventasHoy = 0
          
          salesData.forEach(s => {
            const fecha = s.created_at.split('T')[0]
            const monto = Number(s.total_amount)
            ventasPorFecha[fecha] = (ventasPorFecha[fecha] || 0) + monto
            totalVentas += monto
            if (fecha === hoy) ventasHoy += monto
          })

          const ventasArray = Object.entries(ventasPorFecha)
            .map(([fecha, total]) => ({
              fecha,
              total: Number(total.toFixed(2))
            }))
            .sort((a, b) => a.fecha.localeCompare(b.fecha))

          setVentas(ventasArray)

          const promedioVentas = totalVentas / ventasArray.length

          setStats(prev => ({
            ...prev,
            totalVentas,
            ventasHoy,
            promedioVentas
          }))
        }

        // --- Productos más vendidos ---
        const { data: saleItemsData, error: itemsError } = await supabase
          .from('sale_items')
          .select('quantity, product_id')

        if (itemsError) throw itemsError

        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name')

        if (productsError) throw productsError

        if (saleItemsData && productsData) {
          const productMap = new Map(productsData.map(p => [p.id, p.name]))
          const productTotals: Record<string, number> = {}

          saleItemsData.forEach(item => {
            const nombre = productMap.get(item.product_id)
            if (nombre) {
              productTotals[nombre] = (productTotals[nombre] || 0) + Number(item.quantity)
            }
          })

          const productosOrdenados = Object.entries(productTotals)
            .map(([nombre, cantidad]) => ({ nombre, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 10)

          setProductos(productosOrdenados)

          if (productosOrdenados.length > 0) {
            setStats(prev => ({
              ...prev,
              productoMasVendido: productosOrdenados[0].nombre
            }))
          }
        }

      } catch (err: any) {
        console.error('Error al cargar datos:', err)
        setError(err?.message || 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">📊 Dashboard de Ventas</h1>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando datos...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">📊 Dashboard de Ventas</h1>
          <div className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-red-500">
            <p className="text-red-700 font-semibold text-lg mb-2">⚠️ Error al cargar datos</p>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📊 Dashboard de Ventas</h1>
          <p className="text-gray-600">Análisis y estadísticas de tu negocio</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <p className="text-blue-100 text-sm mb-1">Total Ventas</p>
            <p className="text-3xl font-bold">${stats.totalVentas.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <p className="text-green-100 text-sm mb-1">Ventas Hoy</p>
            <p className="text-3xl font-bold">${stats.ventasHoy.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <p className="text-purple-100 text-sm mb-1">Promedio Diario</p>
            <p className="text-3xl font-bold">${stats.promedioVentas.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <Package className="w-6 h-6" />
              </div>
            </div>
            <p className="text-orange-100 text-sm mb-1">Top Producto</p>
            <p className="text-lg font-bold truncate">{stats.productoMasVendido || 'N/A'}</p>
          </div>
        </div>

        {/* Gráfico de Ventas */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 rounded-lg p-2 mr-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Evolución de Ventas</h2>
              <p className="text-gray-500 text-sm">Tendencia de ventas por día</p>
            </div>
          </div>
          {ventas.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={ventas}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Total']}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fill="url(#colorTotal)"
                  activeDot={{ r: 8 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">📈 No hay datos de ventas disponibles</p>
            </div>
          )}
        </div>

        {/* Gráfico de Productos más vendidos */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <div className="bg-green-100 rounded-lg p-2 mr-3">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Top 10 Productos</h2>
              <p className="text-gray-500 text-sm">Productos más vendidos del período</p>
            </div>
          </div>
          {productos.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={productos} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  type="category"
                  dataKey="nombre" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  width={150}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => [`${value} unidades`, 'Vendido']}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="cantidad" 
                  fill="#10b981"
                  radius={[0, 8, 8, 0]}
                  name="Unidades Vendidas"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">📦 No hay datos de productos disponibles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}