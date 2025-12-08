import { useState } from "react";
import {
  FaExclamationTriangle,
  FaTimes,
  FaBan,
  FaSpinner,
} from "react-icons/fa";

type Order = {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  profile_id: string;
  customers: {
    full_name: string;
  };
};

interface CancelOrderModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirm: (orderId: string) => void;
}

export default function CancelOrderModal({
  isOpen,
  order,
  onClose,
  onConfirm,
}: CancelOrderModalProps) {
  const [isCanceling, setIsCanceling] = useState(false);

  if (!isOpen || !order) return null;

  const handleConfirm = async () => {
    setIsCanceling(true);
    await onConfirm(order.id);
    setIsCanceling(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 rounded-t-3xl flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaExclamationTriangle /> Cancelar Pedido
          </h2>
          <button
            onClick={onClose}
            disabled={isCanceling}
            className="text-white hover:bg-white dark:bg-slate-900 hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className="p-8 space-y-5">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <FaBan className="text-red-600 text-3xl" />
            </div>
            <p className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-2">
              ¿Estás seguro de cancelar este pedido?
            </p>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">
              Cliente:{" "}
              <span className="font-bold">{order.customers.full_name}</span>
            </p>
            <p className="text-2xl font-bold text-red-600 mb-4">
              ${order.total_amount.toFixed(2)}
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <p className="font-semibold mb-1">⚠️ Importante:</p>
              <p>El stock de los productos será devuelto al inventario.</p>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={isCanceling}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCanceling ? (
              <>
                <FaSpinner className="animate-spin" /> Cancelando...
              </>
            ) : (
              <>
                <FaBan className="text-xl" /> Sí, Cancelar Pedido
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isCanceling}
            className="w-full mt-3 py-3 text-gray-600 dark:text-slate-300 font-semibold hover:bg-gray-100 dark:hover:bg-slate-800/80 dark:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
          >
            No, Mantener Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
