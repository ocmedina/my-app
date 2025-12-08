"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  FaArrowLeft,
  FaDollarSign,
  FaUser,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaShoppingCart,
  FaMoneyBillWave,
  FaCheckCircle,
} from "react-icons/fa";

type PedidoPendiente = {
  id: string;
  created_at: string;
  total_amount: number;
  amount_paid: number;
  amount_pending: number;
  payment_method: string;
  status: string;
  customer_name: string;
  customer_id: string;
  profile_name: string;
};

export default function PedidosPendientesPage() {
  const [pedidos, setPedidos] = useState<PedidoPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPedido, setSelectedPedido] = useState<PedidoPendiente | null>(
    null
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentComment, setPaymentComment] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchPedidosPendientes();
  }, []);

  const fetchPedidosPendientes = async () => {
    setLoading(true);

    // Obtener TODOS los pedidos con deuda pendiente (cualquier método de pago)
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        id,
        created_at,
        total_amount,
        amount_paid,
        amount_pending,
        payment_method,
        status,
        customer_id,
        customers ( full_name ),
        profiles ( full_name )
      `
      )
      .gt("amount_pending", 0)
      .neq("status", "cancelado")
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Error fetching pending orders:", ordersError);
      setLoading(false);
      return;
    }

    const pedidosFormateados = (ordersData || []).map((order: any) => ({
      id: order.id,
      created_at: order.created_at,
      total_amount: order.total_amount,
      amount_paid: order.amount_paid || 0,
      amount_pending: order.amount_pending || 0,
      payment_method: order.payment_method,
      status: order.status,
      customer_name: order.customers?.full_name || "Sin cliente",
      customer_id: order.customer_id,
      profile_name: order.profiles?.full_name || "Desconocido",
    }));

    setPedidos(pedidosFormateados);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "entregado":
        return "bg-green-100 text-green-700 border-green-300";
      case "cancelado":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendiente":
        return "Pendiente";
      case "entregado":
        return "Entregado";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  };

  const handleOpenPayment = (pedido: PedidoPendiente) => {
    setSelectedPedido(pedido);
    setShowPaymentModal(true);
    setPaymentAmount("");
    setPaymentComment("");
  };

  const handleClosePayment = () => {
    setShowPaymentModal(false);
    setSelectedPedido(null);
    setPaymentAmount("");
    setPaymentComment("");
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPedido) return;

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      alert("Por favor, ingresa un monto válido.");
      return;
    }

    if (amount > selectedPedido.amount_pending) {
      alert(
        `El monto no puede ser mayor al saldo pendiente ($${selectedPedido.amount_pending.toFixed(
          2
        )})`
      );
      return;
    }

    setProcessingPayment(true);

    try {
      // Obtener timestamp en zona horaria Argentina
      const now = new Date();
      const argentinaTime = new Date(
        now.toLocaleString("en-US", {
          timeZone: "America/Argentina/Buenos_Aires",
        })
      );

      // Actualizar el pedido
      const newAmountPaid = selectedPedido.amount_paid + amount;
      const newAmountPending = selectedPedido.amount_pending - amount;

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          amount_paid: newAmountPaid,
          amount_pending: newAmountPending,
        })
        .eq("id", selectedPedido.id);

      if (updateError) throw updateError;

      // Registrar el pago en la tabla payments
      const { error: paymentError } = await supabase.from("payments").insert({
        customer_id: selectedPedido.customer_id,
        type: "pago",
        amount: amount,
        comment:
          paymentComment || `Pago de pedido #${selectedPedido.id.slice(0, 8)}`,
        created_at: argentinaTime.toISOString(),
      });

      if (paymentError) throw paymentError;

      alert("¡Pago registrado exitosamente!");
      handleClosePayment();
      fetchPedidosPendientes(); // Recargar la lista
    } catch (error: any) {
      console.error("Error al registrar pago:", error);
      alert(`Error al registrar el pago: ${error.message}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-300">Cargando pedidos pendientes...</p>
        </div>
      </div>
    );
  }

  const totalPendiente = pedidos.reduce((sum, p) => sum + p.amount_pending, 0);

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-950 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 sm:mb-8 gap-4">
        <div className="w-full lg:w-auto">
          <Link
            href="/dashboard/pedidos"
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mb-2 text-sm sm:text-base"
          >
            <FaArrowLeft /> Volver a Pedidos
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
            <FaExclamationTriangle className="text-orange-600 text-xl sm:text-2xl" />{" "}
            Pedidos con Saldo Pendiente
          </h1>
          <p className="text-gray-600 dark:text-slate-300 mt-1 text-sm sm:text-base">
            Todos los pedidos con deuda pendiente de cobro ({pedidos.length}{" "}
            pedidos)
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-4 border-2 border-orange-200 w-full lg:w-auto">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 mb-1">
            Total Pendiente
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-orange-600">
            ${totalPendiente.toFixed(2)}
          </p>
        </div>
      </div>

      {/* LISTA DE PEDIDOS PENDIENTES */}
      {pedidos.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-12 text-center">
          <FaCheckCircle className="text-6xl text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-2">
            ¡No hay pedidos pendientes!
          </h3>
          <p className="text-gray-600 dark:text-slate-300">
            Todos los pedidos fiados están pagados
          </p>
        </div>
      ) : (
        <>
          {/* Vista de tarjetas para móviles */}
          <div className="lg:hidden space-y-4">
            {pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border-2 border-gray-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 p-4 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <Link
                        href={`/dashboard/clientes/${pedido.customer_id}`}
                        className="text-lg font-bold text-orange-600 hover:text-orange-800 hover:underline flex items-center gap-2"
                      >
                        <FaUser className="text-sm" />
                        {pedido.customer_name}
                      </Link>
                      <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
                        Vendedor: {pedido.profile_name}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                        pedido.status
                      )}`}
                    >
                      {getStatusLabel(pedido.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                    <FaCalendarAlt />
                    {new Date(pedido.created_at).toLocaleDateString("es-AR")}
                    {" · "}
                    {new Date(pedido.created_at).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Total Pedido</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-slate-50">
                        ${pedido.total_amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Pagado</p>
                      <p className="text-lg font-bold text-green-600">
                        ${pedido.amount_paid.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 border-2 border-red-200">
                    <p className="text-xs text-red-700 font-semibold mb-1">
                      SALDO PENDIENTE
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      ${pedido.amount_pending.toFixed(2)}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      {(
                        (pedido.amount_pending / pedido.total_amount) *
                        100
                      ).toFixed(0)}
                      % del total
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenPayment(pedido)}
                      className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white text-center font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
                    >
                      <FaDollarSign className="inline mr-2" />
                      Pagar
                    </button>
                    <Link
                      href={`/dashboard/pedidos/${pedido.id}`}
                      className="px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white text-center font-semibold rounded-lg hover:from-orange-700 hover:to-red-700 transition-all"
                    >
                      <FaShoppingCart className="inline mr-2" />
                      Detalle
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vista de tabla para desktop */}
          <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt /> Fecha
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaUser /> Cliente
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaShoppingCart /> Vendedor
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                      Total Pedido
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                      Pagado
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                      <div className="flex items-center justify-end gap-2">
                        <FaDollarSign /> Pendiente
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                  {pedidos.map((pedido) => (
                    <tr
                      key={pedido.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-950 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-slate-50">
                          {new Date(pedido.created_at).toLocaleDateString(
                            "es-AR"
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                          {new Date(pedido.created_at).toLocaleTimeString(
                            "es-AR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/clientes/${pedido.customer_id}`}
                          className="text-sm font-medium text-orange-600 hover:text-orange-800 hover:underline"
                        >
                          {pedido.customer_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-slate-50">
                          {pedido.profile_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                            pedido.status
                          )}`}
                        >
                          {getStatusLabel(pedido.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                          ${pedido.total_amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-green-600 font-medium">
                          ${pedido.amount_paid.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-red-600">
                          ${pedido.amount_pending.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                          {(
                            (pedido.amount_pending / pedido.total_amount) *
                            100
                          ).toFixed(0)}
                          % pendiente
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenPayment(pedido)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <FaDollarSign /> Pagar
                          </button>
                          <Link
                            href={`/dashboard/pedidos/${pedido.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors"
                          >
                            <FaShoppingCart /> Detalle
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-right font-bold text-gray-700 dark:text-slate-200"
                    >
                      TOTAL PENDIENTE:
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-lg font-bold text-red-600">
                        ${totalPendiente.toFixed(2)}
                      </div>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ESTADÍSTICAS ADICIONALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">Total de Pedidos</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-slate-100">
                {pedidos.length}
              </p>
            </div>
            <FaShoppingCart className="text-4xl text-orange-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">Total en Pedidos</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-slate-100">
                $
                {pedidos.reduce((sum, p) => sum + p.total_amount, 0).toFixed(2)}
              </p>
            </div>
            <FaMoneyBillWave className="text-4xl text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">Total Cobrado</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-slate-100">
                ${pedidos.reduce((sum, p) => sum + p.amount_paid, 0).toFixed(2)}
              </p>
            </div>
            <FaDollarSign className="text-4xl text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">Pedidos Pendientes</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-slate-100">
                {pedidos.filter((p) => p.status === "pendiente").length}
              </p>
            </div>
            <FaCalendarAlt className="text-4xl text-yellow-400" />
          </div>
        </div>
      </div>

      {/* MODAL DE PAGO */}
      {showPaymentModal && selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-slate-100">
                Registrar Pago de Pedido
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 mt-1">
                Cliente: {selectedPedido.customer_name}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300">
                Estado:{" "}
                <span
                  className={`font-semibold ${selectedPedido.status === "entregado"
                    ? "text-green-600"
                    : "text-yellow-600"
                    }`}
                >
                  {getStatusLabel(selectedPedido.status)}
                </span>
              </p>
              <div className="mt-3 bg-orange-50 rounded-lg p-3 border border-orange-200">
                <p className="text-xs text-orange-700 font-semibold mb-1">
                  SALDO PENDIENTE
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  ${selectedPedido.amount_pending.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-300 mt-1">
                  Total: ${selectedPedido.total_amount.toFixed(2)} | Pagado: $
                  {selectedPedido.amount_paid.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <form onSubmit={handleRegisterPayment} className="space-y-4">
                <div>
                  <label
                    htmlFor="payment-amount"
                    className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2"
                  >
                    Monto a Pagar
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="payment-amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="block w-full px-3 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                    placeholder="0.00"
                    required
                    max={selectedPedido.amount_pending}
                  />
                </div>
                <div>
                  <label
                    htmlFor="payment-comment"
                    className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2"
                  >
                    Comentario (Opcional)
                  </label>
                  <input
                    type="text"
                    id="payment-comment"
                    value={paymentComment}
                    onChange={(e) => setPaymentComment(e.target.value)}
                    className="block w-full px-3 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                    placeholder="Ej: Pago parcial en efectivo"
                  />
                </div>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 shadow-lg transition-all text-base"
                >
                  {processingPayment ? "Registrando..." : "Registrar Pago"}
                </button>
              </form>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={handleClosePayment}
                disabled={processingPayment}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm sm:text-base disabled:opacity-50"
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
