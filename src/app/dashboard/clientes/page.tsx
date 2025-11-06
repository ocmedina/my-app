'use client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import CustomerActions from "@/components/CustomerActions";
import { supabase } from "@/lib/supabaseClient";

// 🔹 Tipos manuales para TypeScript
type CustomerRow = {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  customer_type: string;
  debt?: number | null;
};

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");

  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [debtFilter, setDebtFilter] = useState(
    filterParam === "with_debt" ? "with_debt" : "all"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);

      let query = supabase
        .from("customers")
        .select("*")
        .eq("is_active", true)
        .order("full_name", { ascending: true });

      if (debtFilter === "with_debt") {
        query = query.gt("debt", 0);
      } else if (debtFilter === "no_debt") {
        query = query.eq("debt", 0);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching customers:", error);
        setCustomers([]);
      } else {
        setCustomers((data as CustomerRow[]) || []);
      }

      setLoading(false);
    };

    fetchCustomers();
  }, [debtFilter]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Clientes</h1>
        <Link
          href="/dashboard/clientes/new"
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          + Agregar Cliente
        </Link>
      </div>

      {/* --- FILTRO POR DEUDA --- */}
      <div className="p-4 bg-white rounded-lg shadow-md mb-6">
        <div className="flex items-center gap-4">
          <label
            htmlFor="debtFilter"
            className="text-sm font-medium text-gray-700"
          >
            Filtrar por deuda:
          </label>
          <select
            id="debtFilter"
            value={debtFilter}
            onChange={(e) => setDebtFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md min-w-[200px]"
          >
            <option value="all">Todos los clientes</option>
            <option value="with_debt">🔴 Con cuenta corriente (deuda)</option>
            <option value="no_debt">✅ Sin deuda</option>
          </select>
          {debtFilter === "with_debt" && (
            <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
              🔴 Mostrando solo clientes con deuda
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deuda</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  No hay clientes para mostrar.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr
                  key={customer.id}
                  className={customer.debt && customer.debt > 0 ? "bg-red-50" : ""}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link
                      href={`/dashboard/clientes/${customer.id}`}
                      className="hover:underline text-blue-600"
                    >
                      {customer.full_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{customer.customer_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {customer.debt && customer.debt > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        🔴 ${customer.debt.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-green-600 font-medium">$0.00</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <CustomerActions customerId={customer.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
