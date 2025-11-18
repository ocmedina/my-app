"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import CustomerActions from "@/components/CustomerActions";
import { supabase } from "@/lib/supabaseClient";
import {
  FaUsers,
  FaPlus,
  FaFilter,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaUserTag,
  FaDollarSign,
  FaInbox,
  FaExclamationTriangle,
  FaSearch,
} from "react-icons/fa";

// 🔹 Tipos manuales para TypeScript
type CustomerRow = {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  customer_type: string;
  debt?: number | null;
};

function CustomersPageContent() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");

  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [debtFilter, setDebtFilter] = useState(
    filterParam === "with_debt" ? "with_debt" : "all"
  );
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Obtener el rol del usuario una sola vez
  useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
        }
      }
    };
    fetchUserRole();
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);

      // Obtener todos los clientes activos
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .eq("is_active", true)
        .order("full_name", { ascending: true });

      if (customersError) {
        console.error("Error fetching customers:", customersError);
        setCustomers([]);
        setLoading(false);
        return;
      }

      // Obtener la deuda de cada cliente desde los pedidos (cualquier método de pago) y ventas en CUENTA CORRIENTE
      const customersWithDebt = await Promise.all(
        (customersData || []).map(async (customer) => {
          // Deuda de pedidos con saldo pendiente (cualquier método de pago)
          const { data: ordersData } = await supabase
            .from("orders")
            .select("amount_pending")
            .eq("customer_id", customer.id)
            .gt("amount_pending", 0)
            .neq("status", "cancelado");

          const ordersDebt = (ordersData || []).reduce(
            (sum, order) => sum + (order.amount_pending || 0),
            0
          );

          // Deuda de ventas en cuenta corriente
          const { data: salesData } = await supabase
            .from("sales")
            .select("amount_pending")
            .eq("customer_id", customer.id)
            .eq("payment_method", "cuenta_corriente")
            .eq("is_cancelled", false)
            .gt("amount_pending", 0);

          const salesDebt = (salesData || []).reduce(
            (sum, sale) => sum + ((sale as any).amount_pending || 0),
            0
          );

          return {
            ...customer,
            debt: ordersDebt + salesDebt,
          };
        })
      );

      // Aplicar filtro de deuda
      let filteredCustomers = customersWithDebt;
      if (debtFilter === "with_debt") {
        filteredCustomers = customersWithDebt.filter((c) => (c.debt || 0) > 0);
      } else if (debtFilter === "no_debt") {
        filteredCustomers = customersWithDebt.filter(
          (c) => (c.debt || 0) === 0
        );
      }

      setCustomers(filteredCustomers);
      setLoading(false);
    };

    fetchCustomers();
  }, [debtFilter]);

  // Filtrar clientes por término de búsqueda
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) {
      return customers;
    }

    const search = searchTerm.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.full_name?.toLowerCase().includes(search) ||
        customer.email?.toLowerCase().includes(search) ||
        customer.phone?.toLowerCase().includes(search)
    );
  }, [customers, searchTerm]);

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <FaUsers className="text-blue-600" /> Gestión de Clientes
          </h1>
          <p className="text-gray-600 mt-1">
            Administra tu cartera de clientes y sus cuentas
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/clientes/deudores"
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all font-semibold flex items-center gap-2"
          >
            <FaExclamationTriangle /> Ver Deudores
          </Link>
          <Link
            href="/dashboard/clientes/new"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all font-semibold flex items-center gap-2"
          >
            <FaPlus /> Agregar Cliente
          </Link>
        </div>
      </div>

      {/* BÚSQUEDA Y FILTROS */}
      <div className="bg-white rounded-xl shadow-lg mb-6 p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Barra de búsqueda */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
            />
            {searchTerm && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {filteredCustomers.length}
                </span>
              </div>
            )}
          </div>

          {/* Filtro de deuda */}
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400 text-sm" />
            <select
              id="debtFilter"
              value={debtFilter}
              onChange={(e) => setDebtFilter(e.target.value)}
              className="px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm min-w-[180px]"
            >
              <option value="all">Todos</option>
              <option value="with_debt">Con deudas</option>
              <option value="no_debt">Sin deudas</option>
            </select>
            {debtFilter === "with_debt" && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-200">
                <FaExclamationTriangle className="text-xs" />
                <span className="text-xs font-semibold whitespace-nowrap">
                  Filtrado activo
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLA DE CLIENTES */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaUser /> Nombre
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaPhone /> Teléfono
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaEnvelope /> Email
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaUserTag /> Tipo
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaDollarSign /> Deuda Pendiente
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <span className="text-gray-500 font-medium">
                        Cargando clientes...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <FaInbox className="text-6xl text-gray-300" />
                      <span className="text-gray-500 font-medium">
                        {searchTerm
                          ? "No se encontraron clientes con ese criterio"
                          : "No hay clientes para mostrar"}
                      </span>
                      {searchTerm && (
                        <span className="text-gray-400 text-sm">
                          Intenta con otro término de búsqueda
                        </span>
                      )}
                      {debtFilter !== "all" && !searchTerm && (
                        <span className="text-gray-400 text-sm">
                          Intenta cambiar el filtro
                        </span>
                      )}
                      {debtFilter === "all" && !searchTerm && (
                        <Link
                          href="/dashboard/clientes/new"
                          className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium flex items-center gap-2"
                        >
                          <FaPlus /> Agregar primer cliente
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      customer.debt && customer.debt > 0
                        ? "bg-red-50/30 border-l-4 border-red-400"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/clientes/${customer.id}`}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {customer.full_name?.charAt(0).toUpperCase()}
                        </div>
                        {customer.full_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FaPhone className="text-gray-400" />
                        {customer.phone || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FaEnvelope className="text-gray-400" />
                        {customer.email || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                          customer.customer_type === "mayorista"
                            ? "bg-purple-100 text-purple-800 border border-purple-300"
                            : "bg-blue-100 text-blue-800 border border-blue-300"
                        }`}
                      >
                        <FaUserTag />
                        {customer.customer_type === "mayorista"
                          ? "Mayorista"
                          : "Minorista"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.debt && customer.debt > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-2 border-red-400">
                            <FaExclamationTriangle />${customer.debt.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-green-600">
                          <FaDollarSign />
                          0.00
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <CustomerActions
                        customerId={customer.id}
                        userRole={userRole}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-gray-500">Cargando...</div>
        </div>
      }
    >
      <CustomersPageContent />
    </Suspense>
  );
}
