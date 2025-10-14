import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";
import { Database } from "@/lib/database.types";
import { FaBoxes, FaUsers, FaDolly, FaCashRegister } from "react-icons/fa";
import QuickActions from "@/components/QuickActions"; // Importamos el componente interactivo

// --- Componente para las tarjetas ---
function DashboardCard({
  title,
  value,
  icon,
  note,
}: {
  title: string;
  value: string | number;
  icon: JSX.Element;
  note: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm flex items-center justify-between transition hover:shadow-md">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-400">{note}</p>
      </div>
      <div className="text-4xl text-gray-300">{icon}</div>
    </div>
  );
}

// --- Función para obtener datos ---
async function getDashboardData() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { count: productCount } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true);
  const { count: clientCount } = await supabase.from("customers").select("*", { count: "exact", head: true }).eq("is_active", true);
  const { count: totalOrders } = await supabase.from("orders").select("*", { count: "exact", head: true });
  const { data: salesThisMonth } = await supabase.from("sales").select("total_amount").gte("created_at", firstDayOfMonth.toISOString()).lt("created_at", firstDayOfNextMonth.toISOString());
  const totalSales = salesThisMonth ? salesThisMonth.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) : 0;
  const { data: pendingOrders } = await supabase.from("orders").select("id, customers(full_name)").eq("status", "pendiente");
  const { data: criticalStockProducts } = await supabase.from("products").select("name, stock").eq("is_active", true).lte("stock", 5).limit(5);

  return {
    productCount: productCount ?? 0,
    clientCount: clientCount ?? 0,
    totalOrders: totalOrders ?? 0,
    totalSales,
    pendingOrders: pendingOrders ?? [],
    criticalStockProducts: criticalStockProducts ?? [],
  };
}

// --- Página principal ---
export default async function DashboardPage() {
  const {
    productCount,
    clientCount,
    totalOrders,
    totalSales,
    pendingOrders,
    criticalStockProducts,
  } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Total Productos" value={productCount} icon={<FaBoxes />} note="Activos" />
        <DashboardCard title="Total Clientes" value={clientCount} icon={<FaUsers />} note="Registrados" />
        <DashboardCard title="Pedidos Totales" value={totalOrders} icon={<FaDolly />} note="Históricos" />
        <DashboardCard title="Ventas Totales" value={`$${totalSales.toFixed(2)}`} icon={<FaCashRegister />} note="Este mes" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">📝 Pedidos Pendientes</h2>
          {pendingOrders.length > 0 ? (
            <ul className="space-y-3">
              {pendingOrders.map((order) => (<li key={order.id} className="flex justify-between items-center text-base"><span>{order.customers?.full_name ?? "Cliente N/A"}</span><Link href={`/dashboard/pedidos/${order.id}`} className="text-blue-500 hover:underline text-sm">Ver</Link></li>))}
            </ul>
          ) : (<div className="text-center text-gray-400 py-6 text-base"><p>No hay pedidos pendientes.</p></div>)}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">🚨 Stock Crítico</h2>
          {criticalStockProducts.length > 0 ? (
            <ul className="space-y-3">
              {criticalStockProducts.map((product, index) => (<li key={index} className="flex justify-between items-center text-base"><span>{product.name}</span><span className="font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm">{product.stock} u.</span></li>))}
            </ul>
          ) : (<div className="text-center text-gray-400 py-6 text-base"><p>No hay productos con stock crítico.</p></div>)}
        </div>
      </div>
      
      <QuickActions />
    </div>
  );
}