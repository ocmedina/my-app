"use client";

import { FaTimes } from "react-icons/fa";
import { Supplier } from "../types";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  total: number;
  customerName: string;
  cartItemsCount: number;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  amountPaid: string;
  setAmountPaid: (amount: string) => void;
  useMixedPayment: boolean;
  setUseMixedPayment: (value: boolean) => void;
  paymentMethods: Array<{ method: string; amount: string }>;
  setPaymentMethods: (
    methods: Array<{ method: string; amount: string }>
  ) => void;
  handleAddPaymentMethod: () => void;
  handleRemovePaymentMethod: (index: number) => void;
  handleUpdatePaymentMethod: (
    index: number,
    field: "method" | "amount",
    value: string
  ) => void;
  getTotalPaidFromMixed: () => number;
  loading: boolean;
  payToSupplier: boolean;
  setPayToSupplier: (value: boolean) => void;
  selectedSupplierId: string | null;
  setSelectedSupplierId: (id: string | null) => void;
  suppliers: Supplier[];
}

export default function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  total,
  customerName,
  cartItemsCount,
  paymentMethod,
  setPaymentMethod,
  amountPaid,
  setAmountPaid,
  useMixedPayment,
  setUseMixedPayment,
  paymentMethods,
  setPaymentMethods,
  handleAddPaymentMethod,
  handleRemovePaymentMethod,
  handleUpdatePaymentMethod,
  getTotalPaidFromMixed,
  loading,
  payToSupplier,
  setPayToSupplier,
  selectedSupplierId,
  setSelectedSupplierId,
  suppliers,
}: PaymentModalProps) {
  if (!isOpen) return null;

  const debtDifference = useMixedPayment
    ? total - getTotalPaidFromMixed()
    : total - (parseFloat(amountPaid) || 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                💳 Finalizar Venta
              </h2>
              <div className="flex gap-4 text-green-100 text-sm">
                <p>
                  Cliente:{" "}
                  <span className="font-semibold text-white">
                    {customerName}
                  </span>
                </p>
                <p>
                  Items:{" "}
                  <span className="font-semibold text-white">
                    {cartItemsCount}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
            >
              <FaTimes size={24} />
            </button>
          </div>
          <div className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <p className="text-green-100 text-sm font-medium uppercase tracking-wider">
              Total a Pagar
            </p>
            <p className="text-5xl font-bold text-white tracking-tight">
              ${total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8">
          {/* Atajos de teclado */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center text-sm text-gray-600">
            <span className="font-medium">⌨️ Atajos:</span>
            <div className="flex gap-4">
              <span>
                <kbd className="px-2 py-0.5 bg-white rounded border shadow-sm font-sans">
                  F12
                </kbd>{" "}
                Cerrar
              </span>
              <span>
                <kbd className="px-2 py-0.5 bg-white rounded border shadow-sm font-sans">
                  F2
                </kbd>{" "}
                Confirmar
              </span>
            </div>
          </div>

          {!useMixedPayment ? (
            <div className="space-y-6">
              {/* Método de pago simple */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Método de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPaymentMethod(value);
                    if (value === "mixtos") {
                      setUseMixedPayment(true);
                    } else if (value === "cuenta_corriente") {
                      setAmountPaid("0");
                    } else {
                      setAmountPaid(total.toFixed(2));
                    }
                  }}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg bg-white shadow-sm transition-all hover:border-green-400"
                >
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="tarjeta_debito">💳 Tarjeta de Débito</option>
                  <option value="tarjeta_credito">💳 Tarjeta de Crédito</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="mercado_pago">📱 Mercado Pago</option>
                  <option value="mixtos">🔀 Pagos Mixtos</option>
                  <option value="cuenta_corriente">
                    📋 Cuenta Corriente (Fiado)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Monto Pagado
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                    $
                  </span>
                  <input
                    id="amountPaid"
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full pl-10 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-2xl font-bold text-gray-800 shadow-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {/* Pagos mixtos */}
              <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-blue-900 text-lg flex items-center gap-2">
                    🔀 Pagos Mixtos
                  </h3>
                  <button
                    onClick={() => {
                      setUseMixedPayment(false);
                      setPaymentMethod("efectivo");
                      setAmountPaid(total.toFixed(2));
                    }}
                    className="text-sm px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                  >
                    Cancelar Mixto
                  </button>
                </div>

                <div className="space-y-4">
                  {paymentMethods.map((pm, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <select
                        value={pm.method}
                        onChange={(e) =>
                          handleUpdatePaymentMethod(
                            index,
                            "method",
                            e.target.value
                          )
                        }
                        className="flex-1 p-3 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta_debito">Débito</option>
                        <option value="tarjeta_credito">Crédito</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="mercado_pago">Mercado Pago</option>
                      </select>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          value={pm.amount}
                          onChange={(e) =>
                            handleUpdatePaymentMethod(
                              index,
                              "amount",
                              e.target.value
                            )
                          }
                          className="w-full pl-7 p-3 border border-gray-300 rounded-lg font-medium"
                          placeholder="0.00"
                        />
                      </div>
                      <button
                        onClick={() => handleRemovePaymentMethod(index)}
                        className="text-red-500 hover:text-red-700 p-2"
                        disabled={paymentMethods.length <= 1}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleAddPaymentMethod}
                    className="w-full py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
                  >
                    + Agregar otro método
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-200 flex justify-between items-center">
                  <span className="text-blue-800 font-medium">
                    Total Acumulado:
                  </span>
                  <span className="text-xl font-bold text-blue-900">
                    ${getTotalPaidFromMixed().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pago directo a proveedor */}
          {paymentMethod !== "cuenta_corriente" && (
            <div className="border-t border-gray-100 pt-6">
              <div
                className={`transition-all duration-300 ${
                  payToSupplier
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-gray-50 border-gray-200"
                } p-5 rounded-xl border`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="payToSupplier"
                    checked={payToSupplier}
                    onChange={(e) => {
                      setPayToSupplier(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedSupplierId(null);
                      }
                    }}
                    className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500 border-gray-300"
                  />
                  <label
                    htmlFor="payToSupplier"
                    className="flex-1 cursor-pointer select-none"
                  >
                    <div className="font-bold text-gray-900">
                      Pagar directo a proveedor
                    </div>
                    <div className="text-sm text-gray-500">
                      El dinero ingresa y se paga automáticamente a un proveedor
                    </div>
                  </label>
                </div>

                {payToSupplier && (
                  <div className="mt-3 animate-slideDown">
                    <select
                      value={selectedSupplierId || ""}
                      onChange={(e) =>
                        setSelectedSupplierId(e.target.value || null)
                      }
                      className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
                      required
                    >
                      <option value="">Seleccione un proveedor...</option>
                      {suppliers
                        .filter((s) => (s.debt || 0) > 0)
                        .map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name} - Deuda: $
                            {(supplier.debt || 0).toFixed(2)}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Indicadores de deuda/cambio */}
          {debtDifference > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex justify-between items-center animate-pulse-slow">
              <span className="font-bold text-red-800 flex items-center gap-2">
                ⚠️ Saldo Pendiente
              </span>
              <span className="text-3xl font-bold text-red-600">
                ${debtDifference.toFixed(2)}
              </span>
            </div>
          )}

          {debtDifference < 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex justify-between items-center">
              <span className="font-bold text-green-800 flex items-center gap-2">
                💰 Cambio a Devolver
              </span>
              <span className="text-3xl font-bold text-green-600">
                ${Math.abs(debtDifference).toFixed(2)}
              </span>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 px-6 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-[2] py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
            >
              {loading ? (
                <>⏳ Procesando...</>
              ) : (
                <>
                  ✅ Confirmar Venta
                  <span className="text-xs bg-green-500/30 px-2 py-1 rounded border border-green-400/30">
                    F2
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
