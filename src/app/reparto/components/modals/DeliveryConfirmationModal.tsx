import { useState, useEffect } from "react";
import {
  FaTimes,
  FaTruck,
  FaMapMarkerAlt,
  FaSpinner,
  FaCheck,
} from "react-icons/fa";
import { Database } from "@/lib/database.types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Order = {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  profile_id: string;
  customers: {
    full_name: string;
    address?: string | null;
    reference?: string | null;
  };
};

interface DeliveryConfirmationModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirm: (
    orderId: string,
    amountPaid: number,
    paymentMethod: string
  ) => void;
}

export default function DeliveryConfirmationModal({
  isOpen,
  order,
  onClose,
  onConfirm,
}: DeliveryConfirmationModalProps) {
  const [isDelivering, setIsDelivering] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [amountCash, setAmountCash] = useState("");
  const [amountTransfer, setAmountTransfer] = useState("");

  useEffect(() => {
    if (order) {
      setAmountPaid(order.total_amount.toFixed(2));
      setPaymentMethod("efectivo");
    }
  }, [order]);

  useEffect(() => {
    if (paymentMethod === "cuenta_corriente") {
      setAmountPaid("0.00");
    } else if (paymentMethod === "mixto") {
      const cash = parseFloat(amountCash) || 0;
      const transfer = parseFloat(amountTransfer) || 0;
      setAmountPaid((cash + transfer).toFixed(2));
    } else if (order) {
      setAmountPaid(order.total_amount.toFixed(2));
    }
  }, [paymentMethod, order, amountCash, amountTransfer]);

  if (!isOpen || !order) return null;

  const handleConfirm = async () => {
    setIsDelivering(true);
    const paid = parseFloat(amountPaid) || 0;
    await onConfirm(order.id, paid, paymentMethod);
    setIsDelivering(false);
    onClose();
  };

  const total = order.total_amount;
  const paid = parseFloat(amountPaid) || 0;
  const pending = total - paid;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 rounded-t-3xl flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaTruck /> Confirmar Entrega y Pago
          </h2>
          <button
            onClick={onClose}
            disabled={isDelivering}
            className="text-white hover:bg-white dark:bg-slate-900 hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className="p-8 space-y-5">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">Cliente</p>
            <p className="text-xl font-bold text-gray-800 dark:text-slate-100">
              {order.customers.full_name}
            </p>
            {order.customers.address && (
              <div className="mt-3 text-sm text-gray-600 dark:text-slate-300">
                <div className="flex items-center justify-center gap-2">
                  <FaMapMarkerAlt className="text-purple-500" />
                  <span>{order.customers.address}</span>
                </div>
                {order.customers.reference && (
                  <p className="text-xs italic text-gray-500 dark:text-slate-400 mt-1">
                    Ref: {order.customers.reference}
                  </p>
                )}
              </div>
            )}
            <p className="text-3xl font-bold text-green-600 mt-2">
              ${order.total_amount.toFixed(2)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Método de Pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                if (e.target.value === "mixto") {
                  setAmountCash("");
                  setAmountTransfer("");
                }
              }}
              className="mt-1 w-full p-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-950"
            >
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">🏦 Transferencia</option>
              <option value="mercado_pago">📱 Mercado Pago</option>
              <option value="mixto">💳 Mixto</option>
              <option value="cuenta_corriente">
                📋 Cuenta Corriente (Fiado)
              </option>
            </select>
          </div>
          {paymentMethod === "mixto" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
                  💵 Efectivo
                </label>
                <input
                  type="number"
                  value={amountCash}
                  onChange={(e) => setAmountCash(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="mt-1 w-full p-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
                  🏦 Transferencia
                </label>
                <input
                  type="number"
                  value={amountTransfer}
                  onChange={(e) => setAmountTransfer(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="mt-1 w-full p-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-950"
                />
              </div>
              <div className="bg-purple-50 p-3 rounded-xl border-2 border-purple-200">
                <label className="block text-sm font-medium text-purple-700">
                  💰 Total Recibido
                </label>
                <div className="text-2xl font-bold text-purple-700 mt-1">
                  ${amountPaid}
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
                Monto Recibido
              </label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                step="0.01"
                min="0"
                className="mt-1 w-full p-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-950"
              />
            </div>
          )}
          {pending > 0 && (
            <div className="flex justify-between font-bold text-red-600 p-3 bg-red-50 rounded-lg border border-red-200">
              <span>Saldo Pendiente (Deuda):</span>
              <span>${pending.toFixed(2)}</span>
            </div>
          )}
          <button
            onClick={handleConfirm}
            disabled={isDelivering}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDelivering ? (
              <>
                <FaSpinner className="animate-spin" /> Marcando...
              </>
            ) : (
              <>
                <FaCheck className="text-xl" /> Marcar como Entregado
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isDelivering}
            className="w-full mt-3 py-3 text-gray-600 dark:text-slate-300 font-semibold hover:bg-gray-100 dark:hover:bg-slate-800/80 dark:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
