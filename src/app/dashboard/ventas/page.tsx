// src/app/dashboard/ventas/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const ITEMS_PER_PAGE = 10; // Puedes ajustar cuántas ventas mostrar por página

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // Fecha de hoy por defecto
  const [paymentFilter, setPaymentFilter] = useState("all"); // Filtro por método de pago
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("sales")
        .select(
          `
          id,
          created_at,
          total_amount,
          payment_method,
          customers ( full_name ),
          profiles ( full_name )
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      // --- FILTRO POR DÍA ESPECÍFICO ---
      if (date) {
        const startDate = new Date(date);
        startDate.setUTCHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setUTCHours(23, 59, 59, 999);
        query = query
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString());
      }

      // --- FILTRO POR MÉTODO DE PAGO ---
      if (paymentFilter !== "all") {
        query = query.eq("payment_method", paymentFilter);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching sales:", error);
      } else {
        setSales(data || []);
        setTotalCount(count || 0);
      }
      setLoading(false);
    };

    fetchSales();
  }, [date, currentPage, paymentFilter]); // Se ejecuta si la fecha, página o filtro de pago cambian

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Historial de Ventas</h1>
        <Link
          href="/dashboard/ventas/nueva"
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          + Nueva Venta
        </Link>
      </div>

      {/* --- FILTROS --- */}
      <div className="p-4 bg-white rounded-lg shadow-md mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <label
            htmlFor="saleDate"
            className="text-sm font-medium text-gray-700"
          >
            Filtrar por fecha:
          </label>
          <input
            type="date"
            id="saleDate"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setCurrentPage(1); // Reiniciar a la página 1 al cambiar de fecha
            }}
            className="p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex items-center gap-4">
          <label
            htmlFor="paymentFilter"
            className="text-sm font-medium text-gray-700"
          >
            Método de pago:
          </label>
          <select
            id="paymentFilter"
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1); // Reiniciar a la página 1 al cambiar filtro
            }}
            className="p-2 border border-gray-300 rounded-md min-w-[200px]"
          >
            <option value="all">Todos</option>
            <option value="efectivo">💵 Efectivo</option>
            <option value="transferencia">🏦 Transferencia</option>
            <option value="mercado_pago">📱 Mercado Pago</option>
            <option value="cuenta_corriente">
              📋 Cuenta Corriente (Fiado)
            </option>
          </select>
          {paymentFilter === "cuenta_corriente" && (
            <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              🔴 Mostrando solo ventas fiadas
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* ... (el thead de la tabla no cambia) ... */}
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  No hay ventas para la fecha seleccionada.
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr
                  key={sale.id}
                  className={
                    sale.payment_method === "cuenta_corriente"
                      ? "bg-orange-50"
                      : ""
                  }
                >
                  {/* ... (las celdas <td> de la tabla no cambian) ... */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sale.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {sale.customers?.full_name ?? "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sale.profiles?.full_name ?? "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {sale.payment_method === "cuenta_corriente" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        📋 Cuenta Corriente (Fiado)
                      </span>
                    ) : (
                      <span className="text-gray-500 capitalize">
                        {sale.payment_method?.replace("_", " ") ?? "N/A"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                    ${sale.total_amount?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/dashboard/ventas/${sale.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
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

      {/* --- PAGINACIÓN --- */}
      <div className="mt-6 flex justify-between items-center">
        <span className="text-sm text-gray-700">
          Mostrando {sales.length} de {totalCount} ventas
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
