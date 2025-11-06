import { createClient } from "@/lib/server";
import Link from "next/link";
import { Database } from "@/lib/database.types";
import {
  FaBoxes,
  FaUsers,
  FaDolly,
  FaCashRegister,
  FaArrowRight,
} from "react-icons/fa";
import QuickActionsHeader from "@/components/QuickActionsHeader";

// --- Tipos ---
type CustomerRow = {
  id: string;
  full_name: string;
};

type OrderRow = {
  id: string;
  customers: CustomerRow | null;
};

type ProductRow = {
  name: string;
  stock: number;
  id: string;
};

type SaleRow = {
  total_amount: number;
  created_at: string;
};

// --- Componente de tarjeta simple ---
function DashboardCard({
  title,
  value,
  icon,
  note,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  note: string;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{note}</p>
        </div>
        <div className="text-gray-300 text-2xl">{icon}</div>
      </div>
    </div>
  );
}

// --- Obtener datos del dashboard ---
async function getDashboardData() {
  const supabase = await createClient();
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfNextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  );

  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: clientCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: totalOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  const { data: salesThisMonth } = await supabase
    .from("sales")
    .select("total_amount")
    .gte("created_at", firstDayOfMonth.toISOString())
    .lt("created_at", firstDayOfNextMonth.toISOString());

  const totalSales =
    salesThisMonth?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) ??
    0;

  const { data: pendingOrders } = await supabase
    .from("orders")
    .select("id, customers ( id, full_name ), created_at")
    .eq("status", "pendiente")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: criticalStockProducts } = await supabase
    .from("products")
    .select("name, stock, id")
    .eq("is_active", true)
    .lte("stock", 5)
    .order("stock", { ascending: true })
    .limit(5);

  const { data: recentSales } = await supabase
    .from("sales")
    .select("id, total_amount, created_at, customers ( full_name )")
    .order("created_at", { ascending: false })
    .limit(5);

  // Total de deuda pendiente (cuenta corriente)
  const { data: customersWithDebt } = await supabase
    .from("customers")
    .select("debt")
    .eq("is_active", true)
    .gt("debt", 0);

  const totalDebt =
    customersWithDebt?.reduce(
      (sum, customer) => sum + (customer.debt || 0),
      0
    ) ?? 0;
  const customersWithDebtCount = customersWithDebt?.length ?? 0;

  return {
    productCount: productCount ?? 0,
    clientCount: clientCount ?? 0,
    totalOrders: totalOrders ?? 0,
    totalSales,
    totalDebt,
    customersWithDebtCount,
    pendingOrders: pendingOrders ?? [],
    criticalStockProducts: criticalStockProducts ?? [],
    recentSales: recentSales ?? [],
  };
}

// --- Página principal ---
export default async function DashboardPage() {
  const {
    productCount,
    clientCount,
    totalOrders,
    totalSales,
    totalDebt,
    customersWithDebtCount,
    pendingOrders,
    criticalStockProducts,
    recentSales,
  } = await getDashboardData();

  const currentMonth = new Date().toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Acciones Rápidas como Header */}
      <QuickActionsHeader />

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Ventas del Mes"
          value={`$${totalSales.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={<FaCashRegister />}
          note={currentMonth}
        />
        <DashboardCard
          title="Pedidos Totales"
          value={totalOrders}
          icon={<FaDolly />}
          note="Históricos"
        />
        <DashboardCard
          title="Productos Activos"
          value={productCount}
          icon={<FaBoxes />}
          note="En catálogo"
        />
        <DashboardCard
          title="Clientes Activos"
          value={clientCount}
          icon={<FaUsers />}
          note="Registrados"
        />
      </div>

      {/* Tarjeta de Cuenta Corriente */}
      {totalDebt > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg shadow-sm border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📋</span>
                <h3 className="text-lg font-semibold text-gray-800">
                  Cuenta Corriente Pendiente
                </h3>
              </div>
              <p className="text-3xl font-bold text-red-600 mb-1">
                $
                {totalDebt.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-sm text-gray-600">
                {customersWithDebtCount}{" "}
                {customersWithDebtCount === 1 ? "cliente" : "clientes"} con
                deuda pendiente
              </p>
            </div>
            <Link
              href="/dashboard/clientes?filter=with_debt"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
            >
              Ver Clientes <FaArrowRight />
            </Link>
          </div>
        </div>
      )}

      {/* Grid de información */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos Pendientes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">
              Pedidos Pendientes
            </h2>
            {pendingOrders.length > 0 && (
              <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-1 rounded-full">
                {pendingOrders.length}
              </span>
            )}
          </div>
          <div className="p-4">
            {pendingOrders.length > 0 ? (
              <ul className="space-y-3">
                {pendingOrders.map((order) => (
                  <li
                    key={order.id}
                    className="flex justify-between items-center pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.customers?.full_name ?? "Cliente N/A"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/pedidos/${order.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      Ver <FaArrowRight className="text-xs" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p className="text-sm">No hay pedidos pendientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Stock Crítico */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">
              Stock Crítico
            </h2>
            {criticalStockProducts.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">
                {criticalStockProducts.length}
              </span>
            )}
          </div>
          <div className="p-4">
            {criticalStockProducts.length > 0 ? (
              <ul className="space-y-3">
                {criticalStockProducts.map((product) => (
                  <li
                    key={product.id}
                    className="flex justify-between items-center pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <span className="text-sm font-medium text-gray-900 truncate pr-2">
                      {product.name}
                    </span>
                    <span
                      className={`text-sm font-semibold px-2 py-1 rounded ${
                        product.stock === 0
                          ? "bg-red-50 text-red-700"
                          : product.stock <= 2
                          ? "bg-orange-50 text-orange-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {product.stock} u.
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p className="text-sm">Stock en buen estado</p>
              </div>
            )}
          </div>
        </div>

        {/* Últimas Ventas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">
              Últimas Ventas
            </h2>
          </div>
          <div className="p-4">
            {recentSales.length > 0 ? (
              <ul className="space-y-3">
                {recentSales.map((sale) => (
                  <li
                    key={sale.id}
                    className="flex justify-between items-center pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {sale.customers?.full_name ?? "Cliente N/A"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(sale.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-gray-900">
                        $
                        {sale.total_amount.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <Link
                        href={`/dashboard/ventas/${sale.id}`}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p className="text-sm">No hay ventas recientes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
