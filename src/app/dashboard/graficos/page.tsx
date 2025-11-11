// src/app/dashboard/graficos/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { supabase } from "@/lib/supabaseClient";
import {
  FaChartLine,
  FaChartPie,
  FaStore,
  FaTruck,
  FaBox,
  FaDollarSign,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaEquals,
} from "react-icons/fa";
import toast from "react-hot-toast";

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
];

export default function GraficosPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("month"); // 'week', 'month', 'year'

  // Datos
  const [salesByDay, setSalesByDay] = useState<any[]>([]);
  const [localVsReparto, setLocalVsReparto] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalSales: 0,
    localSales: 0,
    repartoSales: 0,
    growth: 0,
  });

  useEffect(() => {
    fetchAllData();
  }, [dateRange]);

  const getDateRange = () => {
    const now = new Date();
    const argDate = new Date(
      now.toLocaleString("en-US", {
        timeZone: "America/Argentina/Buenos_Aires",
      })
    );

    let startDate = new Date(argDate);

    if (dateRange === "week") {
      startDate.setDate(argDate.getDate() - 7);
    } else if (dateRange === "month") {
      startDate.setMonth(argDate.getMonth() - 1);
    } else if (dateRange === "year") {
      startDate.setFullYear(argDate.getFullYear() - 1);
    }

    return {
      start: startDate.toISOString(),
      end: argDate.toISOString(),
    };
  };

  const fetchAllData = async () => {
    setLoading(true);
    const loadingToast = toast.loading("Cargando datos...");

    try {
      const { start, end } = getDateRange();

      // Queries en paralelo
      const [salesRes, ordersRes, saleItemsRes, orderItemsRes, productsRes] =
        await Promise.all([
          supabase
            .from("sales")
            .select("id, created_at, total_amount, payment_method")
            .gte("created_at", start)
            .lte("created_at", end)
            .order("created_at", { ascending: true }),
          (supabase as any)
            .from("orders")
            .select("id, created_at, total_amount, status")
            .gte("created_at", start)
            .lte("created_at", end),
          supabase.from("sale_items").select("quantity, product_id, sale_id"),
          (supabase as any)
            .from("order_items")
            .select("quantity, product_id, order_id"),
          supabase.from("products").select("id, name"),
        ]);

      if (salesRes.error) throw salesRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (saleItemsRes.error) throw saleItemsRes.error;
      if (orderItemsRes.error) throw orderItemsRes.error;
      if (productsRes.error) throw productsRes.error;

      processData(
        salesRes.data || [],
        ordersRes.data || [],
        saleItemsRes.data || [],
        orderItemsRes.data || [],
        productsRes.data || []
      );

      toast.success("Datos cargados correctamente", { id: loadingToast });
    } catch (err: any) {
      console.error("Error al cargar datos:", err);
      toast.error(err?.message || "Error al cargar datos", {
        id: loadingToast,
      });
    } finally {
      setLoading(false);
    }
  };

  const processData = (
    sales: any[],
    orders: any[],
    saleItems: any[],
    orderItems: any[],
    products: any[]
  ) => {
    const productMap = new Map(products.map((p) => [p.id, p.name]));

    // 1. Ventas por día (Local vs Reparto)
    const dayMap: Record<
      string,
      { date: string; local: number; reparto: number }
    > = {};

    sales.forEach((s) => {
      const date = s.created_at.split("T")[0];
      if (!dayMap[date]) dayMap[date] = { date, local: 0, reparto: 0 };
      dayMap[date].local += Number(s.total_amount);
    });

    const deliveredOrders = orders.filter((o: any) => o.status === "entregado");
    deliveredOrders.forEach((o: any) => {
      const date = o.created_at.split("T")[0];
      if (!dayMap[date]) dayMap[date] = { date, local: 0, reparto: 0 };
      dayMap[date].reparto += Number(o.total_amount);
    });

    const salesByDayData = Object.values(dayMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // 2. Balance Local vs Reparto
    const totalLocal = sales.reduce(
      (sum, s) => sum + Number(s.total_amount),
      0
    );
    const totalReparto = deliveredOrders.reduce(
      (sum: number, o: any) => sum + Number(o.total_amount),
      0
    );
    const total = totalLocal + totalReparto;

    const localVsRepartoData = [
      { name: "Local", value: totalLocal, color: "#10b981" },
      { name: "Reparto", value: totalReparto, color: "#3b82f6" },
    ];

    // 3. Top productos
    const productTotals: Record<string, number> = {};

    // Crear sets de IDs de ventas y pedidos del período
    const saleIds = new Set(sales.map((s) => s.id));
    const orderIds = new Set(deliveredOrders.map((o: any) => o.id));

    saleItems.forEach((item) => {
      if (saleIds.has(item.sale_id)) {
        const nombre = productMap.get(item.product_id) || "Desconocido";
        productTotals[nombre] =
          (productTotals[nombre] || 0) + Number(item.quantity);
      }
    });

    orderItems.forEach((item: any) => {
      if (orderIds.has(item.order_id)) {
        const nombre = productMap.get(item.product_id) || "Desconocido";
        productTotals[nombre] =
          (productTotals[nombre] || 0) + Number(item.quantity);
      }
    });

    const topProductsData = Object.entries(productTotals)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // 4. Métodos de pago
    const paymentTotals: Record<string, number> = {};

    sales.forEach((s) => {
      const method = s.payment_method || "Efectivo";
      paymentTotals[method] =
        (paymentTotals[method] || 0) + Number(s.total_amount);
    });

    const paymentMethodsData = Object.entries(paymentTotals).map(
      ([method, amount]) => ({ method, amount })
    );

    // 5. Tendencia mensual (últimos 6 meses)
    const monthlyMap: Record<
      string,
      { month: string; local: number; reparto: number }
    > = {};

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d.toISOString().substring(0, 7);
    });

    last6Months.forEach((month) => {
      monthlyMap[month] = { month, local: 0, reparto: 0 };
    });

    sales.forEach((s) => {
      const month = s.created_at.substring(0, 7);
      if (monthlyMap[month]) {
        monthlyMap[month].local += Number(s.total_amount);
      }
    });

    deliveredOrders.forEach((o: any) => {
      const month = o.created_at.substring(0, 7);
      if (monthlyMap[month]) {
        monthlyMap[month].reparto += Number(o.total_amount);
      }
    });

    const monthlyTrendData = Object.values(monthlyMap);

    // 6. Calcular estadísticas
    const previousPeriodTotal = 0; // Simplificado por ahora
    const growth =
      previousPeriodTotal > 0
        ? ((total - previousPeriodTotal) / previousPeriodTotal) * 100
        : 0;

    setSalesByDay(salesByDayData);
    setLocalVsReparto(localVsRepartoData);
    setTopProducts(topProductsData);
    setPaymentMethods(paymentMethodsData);
    setMonthlyTrend(monthlyTrendData);
    setStats({
      totalSales: total,
      localSales: totalLocal,
      repartoSales: totalReparto,
      growth,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
            <FaChartLine className="text-blue-600" />
            Dashboard de Análisis
          </h1>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando datos...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3 flex items-center gap-3">
            <FaChartLine className="text-blue-600" />
            Dashboard de Análisis
          </h1>
          <p className="text-gray-600 mb-4">
            Visualización completa de toda la información de tu negocio
          </p>

          {/* Selector de rango */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setDateRange("week")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                dateRange === "week"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FaCalendarAlt className="inline mr-2" />7 días
            </button>
            <button
              onClick={() => setDateRange("month")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                dateRange === "month"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FaCalendarAlt className="inline mr-2" />
              30 días
            </button>
            <button
              onClick={() => setDateRange("year")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                dateRange === "year"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FaCalendarAlt className="inline mr-2" />1 año
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white rounded-lg p-3">
                <FaDollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-green-100 text-sm mb-1">Total General</p>
            <p className="text-3xl font-bold">
              $
              {stats.totalSales.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white rounded-lg p-3">
                <FaStore className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-blue-100 text-sm mb-1">Ventas Local</p>
            <p className="text-3xl font-bold">
              $
              {stats.localSales.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white rounded-lg p-3">
                <FaTruck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-purple-100 text-sm mb-1">Ventas Reparto</p>
            <p className="text-3xl font-bold">
              $
              {stats.repartoSales.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white rounded-lg p-3">
                {stats.growth > 0 ? (
                  <FaArrowUp className="w-6 h-6 text-orange-600" />
                ) : stats.growth < 0 ? (
                  <FaArrowDown className="w-6 h-6 text-orange-600" />
                ) : (
                  <FaEquals className="w-6 h-6 text-orange-600" />
                )}
              </div>
            </div>
            <p className="text-orange-100 text-sm mb-1">Tendencia</p>
            <p className="text-3xl font-bold">
              {stats.growth > 0 ? "+" : ""}
              {stats.growth.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Gráfico: Evolución diaria */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 rounded-lg p-2 mr-3">
              <FaChartLine className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Evolución de Ventas Diarias
              </h2>
              <p className="text-gray-500 text-sm">
                Comparación Local vs Reparto por día
              </p>
            </div>
          </div>
          {salesByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={salesByDay}>
                <defs>
                  <linearGradient id="colorLocal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorReparto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: number) =>
                    `$${value.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  }
                  labelStyle={{ color: "#fff", fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey="local"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#colorLocal)"
                  activeDot={{ r: 8 }}
                  name="Local"
                />
                <Area
                  type="monotone"
                  dataKey="reparto"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#colorReparto)"
                  activeDot={{ r: 8 }}
                  name="Reparto"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">
                📈 No hay datos disponibles para este período
              </p>
            </div>
          )}
        </div>

        {/* Row: Balance Distribution + Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Balance Distribution */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="bg-purple-100 rounded-lg p-2 mr-3">
                <FaChartPie className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Distribución de Ventas
                </h2>
                <p className="text-gray-500 text-sm">
                  Balance Local vs Reparto
                </p>
              </div>
            </div>
            {localVsReparto.length > 0 &&
            localVsReparto.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={localVsReparto}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) =>
                      `${entry.name}: ${(
                        (entry.value / stats.totalSales) *
                        100
                      ).toFixed(1)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {localVsReparto.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value: number) =>
                      `$${value.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg">
                  📊 No hay datos disponibles
                </p>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="bg-green-100 rounded-lg p-2 mr-3">
                <FaDollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Métodos de Pago
                </h2>
                <p className="text-gray-500 text-sm">
                  Distribución por método de pago
                </p>
              </div>
            </div>
            {paymentMethods.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentMethods}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="method"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value: number) =>
                      `$${value.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    }
                    labelStyle={{ color: "#fff", fontWeight: "bold" }}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg">
                  💰 No hay datos disponibles
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Top Productos */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center mb-6">
            <div className="bg-orange-100 rounded-lg p-2 mr-3">
              <FaBox className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Top 10 Productos
              </h2>
              <p className="text-gray-500 text-sm">
                Productos más vendidos por cantidad
              </p>
            </div>
          </div>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topProducts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  width={150}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: number) => [
                    `${value} unidades`,
                    "Vendido",
                  ]}
                  labelStyle={{ color: "#fff", fontWeight: "bold" }}
                />
                <Bar dataKey="quantity" fill="#f59e0b" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">
                📦 No hay datos de productos disponibles
              </p>
            </div>
          )}
        </div>

        {/* Tendencia Mensual */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <div className="bg-indigo-100 rounded-lg p-2 mr-3">
              <FaChartLine className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Tendencia Mensual
              </h2>
              <p className="text-gray-500 text-sm">
                Evolución de ventas en los últimos 6 meses
              </p>
            </div>
          </div>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: number) =>
                    `$${value.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  }
                  labelStyle={{ color: "#fff", fontWeight: "bold" }}
                />
                <Line
                  type="monotone"
                  dataKey="local"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Local"
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="reparto"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Reparto"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">
                📈 No hay datos disponibles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
