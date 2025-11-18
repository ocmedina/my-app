"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  FaArrowLeft,
  FaDollarSign,
  FaUser,
  FaPhone,
  FaFileInvoiceDollar,
  FaShoppingCart,
  FaExclamationTriangle,
} from "react-icons/fa";
import RegisterPayment from "@/components/RegisterPayment";

type DebtDetail = {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  customer_type: string;
  ordersDebt: number;
  salesDebt: number;
  totalDebt: number;
  ordersCount: number;
  salesCount: number;
};

export default function DeudoresPage() {
  const [deudores, setDeudores] = useState<DebtDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<DebtDetail | null>(
    null
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchDeudores();
  }, []);

  const fetchDeudores = async () => {
    setLoading(true);

    // Obtener TODOS los clientes (activos e inactivos)
    const { data: customersData, error: customersError } = await supabase
      .from("customers")
      .select("*");

    if (customersError) {
      console.error("Error fetching customers:", customersError);
      setLoading(false);
      return;
    }

    // Calcular deuda detallada de cada cliente
    const deudoresData = await Promise.all(
      (customersData || []).map(async (customer) => {
        // Pedidos con deuda pendiente (cualquier método de pago)
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

        // Ventas en cuenta corriente con deuda pendiente
        const { data: salesData } = await supabase
          .from("sales")
          .select("amount_pending")
          .eq("customer_id", customer.id)
          .eq("payment_method", "cuenta_corriente")
          .gt("amount_pending", 0)
          .eq("is_cancelled", false);

        const salesDebt = (salesData || []).reduce(
          (sum, sale) => sum + ((sale as any).amount_pending || 0),
          0
        );

        return {
          id: customer.id,
          full_name: customer.full_name,
          phone: customer.phone,
          email: customer.email,
          customer_type: customer.customer_type,
          ordersDebt,
          salesDebt,
          totalDebt: ordersDebt + salesDebt,
          ordersCount: ordersData?.length || 0,
          salesCount: salesData?.length || 0,
        };
      })
    );

    // Filtrar solo los que tienen deuda y ordenar por mayor deuda
    const clientesConDeuda = deudoresData
      .filter((d) => d.totalDebt > 0)
      .sort((a, b) => b.totalDebt - a.totalDebt);

    setDeudores(clientesConDeuda);
    setLoading(false);
  };

  const handleOpenPayment = (customer: DebtDetail) => {
    setSelectedCustomer(customer);
    setShowPaymentModal(true);
  };

  const handleClosePayment = () => {
    setShowPaymentModal(false);
    setSelectedCustomer(null);
    fetchDeudores(); // Refrescar después de registrar pago
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando deudores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 sm:mb-8 gap-4">
        <div className="w-full lg:w-auto">
          <Link
            href="/dashboard/clientes"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-2 text-sm sm:text-base"
          >
            <FaArrowLeft /> Volver a Clientes
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
            <FaExclamationTriangle className="text-red-600 text-xl sm:text-2xl" />{" "}
            Clientes Deudores
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Todos los clientes con deudas pendientes ({deudores.length}{" "}
            clientes)
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-red-200 w-full lg:w-auto">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Deuda Total</p>
          <p className="text-2xl sm:text-3xl font-bold text-red-600">
            ${deudores.reduce((sum, d) => sum + d.totalDebt, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* LISTA DE DEUDORES */}
      {deudores.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <FaDollarSign className="text-6xl text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            ¡No hay deudores!
          </h3>
          <p className="text-gray-600">
            Todos los clientes tienen sus cuentas al día
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {deudores.map((deudor) => (
            <div
              key={deudor.id}
              className="bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-red-300 transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  {/* INFO DEL CLIENTE */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-3 bg-red-100 rounded-lg">
                        <FaUser className="text-red-600 text-xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {deudor.full_name}
                        </h3>
                        <div className="flex gap-3 mt-1">
                          {deudor.phone && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <FaPhone className="text-xs" /> {deudor.phone}
                            </p>
                          )}
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-semibold ${
                              deudor.customer_type === "mayorista"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {deudor.customer_type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* DETALLE DE DEUDAS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                      {/* Pedidos */}
                      {deudor.ordersCount > 0 && (
                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                          <div className="flex items-center gap-2 mb-1">
                            <FaShoppingCart className="text-orange-600 text-sm" />
                            <p className="text-xs font-semibold text-orange-700">
                              Pedidos Pendientes
                            </p>
                          </div>
                          <p className="text-lg font-bold text-orange-600">
                            ${deudor.ordersDebt.toFixed(2)}
                          </p>
                          <p className="text-xs text-orange-600">
                            {deudor.ordersCount} pedido(s)
                          </p>
                        </div>
                      )}

                      {/* Ventas */}
                      {deudor.salesCount > 0 && (
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                          <div className="flex items-center gap-2 mb-1">
                            <FaFileInvoiceDollar className="text-red-600 text-sm" />
                            <p className="text-xs font-semibold text-red-700">
                              Cuenta Corriente
                            </p>
                          </div>
                          <p className="text-lg font-bold text-red-600">
                            ${deudor.salesDebt.toFixed(2)}
                          </p>
                          <p className="text-xs text-red-600">
                            {deudor.salesCount} venta(s)
                          </p>
                        </div>
                      )}

                      {/* Total */}
                      <div className="bg-red-100 rounded-lg p-3 border-2 border-red-300">
                        <div className="flex items-center gap-2 mb-1">
                          <FaDollarSign className="text-red-700 text-sm" />
                          <p className="text-xs font-bold text-red-700">
                            DEUDA TOTAL
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-red-700">
                          ${deudor.totalDebt.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ACCIONES */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-48">
                    <button
                      onClick={() => handleOpenPayment(deudor)}
                      className="flex-1 sm:flex-initial lg:flex-auto px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all font-semibold text-xs sm:text-sm"
                    >
                      <FaDollarSign className="inline mr-2" />
                      Registrar Pago
                    </button>
                    <Link
                      href={`/dashboard/clientes/${deudor.id}`}
                      className="flex-1 sm:flex-initial lg:flex-auto px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all font-semibold text-center text-xs sm:text-sm"
                    >
                      Ver Detalle
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE PAGO */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                Registrar Pago
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Cliente: {selectedCustomer.full_name}
              </p>
              <p className="text-xs sm:text-sm text-red-600 font-semibold mt-1">
                Deuda actual: ${selectedCustomer.totalDebt.toFixed(2)}
              </p>
            </div>
            <div className="p-4 sm:p-6">
              <RegisterPayment
                customerId={selectedCustomer.id}
                currentDebt={selectedCustomer.totalDebt}
                onSuccess={handleClosePayment}
              />
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleClosePayment}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm sm:text-base"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
