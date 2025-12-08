import { useState, useEffect } from "react";
import {
  FaInfoCircle,
  FaTimes,
  FaSpinner,
  FaHashtag,
  FaCalendarAlt,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaBox,
  FaClock,
  FaBan,
  FaCheckCircle,
} from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { Database } from "@/lib/database.types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type FullOrder = {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  profile_id: string;
  customers: Customer;
  order_items: {
    id: string;
    quantity: number;
    price: number;
    product_id: string;
    products: { name: string; sku: string; stock: number } | null;
  }[];
};

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

export default function OrderDetailsModal({
  isOpen,
  onClose,
  orderId,
}: OrderDetailsModalProps) {
  const [orderData, setOrderData] = useState<FullOrder | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true);
      const fetchFullOrder = async () => {
        try {
          const { data: order, error } = await (supabase as any)
            .from("orders")
            .select("*, customers(*), order_items(*, products(*))")
            .eq("id", orderId)
            .single();

          if (error) throw error;

          if (order) {
            setOrderData(order as FullOrder);
          }
        } catch (error: any) {
          toast.error("No se pudieron cargar los datos del pedido.");
          console.error(error);
          onClose();
        } finally {
          setLoading(false);
        }
      };
      fetchFullOrder();
    }
  }, [isOpen, orderId, onClose]);

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    if (status === "pendiente") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
          <FaClock /> Pendiente
        </span>
      );
    } else if (status === "cancelado") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
          <FaBan /> Cancelado
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
          <FaCheckCircle /> Entregado
        </span>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-3xl flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaInfoCircle /> Detalles del Pedido
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white dark:bg-slate-900 hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {loading || !orderData ? (
            <div className="flex flex-col items-center justify-center h-64">
              <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
              <p className="text-gray-600 dark:text-slate-300">Cargando detalles del pedido...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Información del Pedido */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                    <FaHashtag className="text-blue-600" /> Información del
                    Pedido
                  </h3>
                  {getStatusBadge(orderData.status)}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-slate-300 mb-1">ID del Pedido:</p>
                    <p className="font-mono font-semibold text-gray-800 dark:text-slate-100">
                      {orderData.id.substring(0, 8)}...
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <FaCalendarAlt className="text-blue-600" /> Fecha:
                    </p>
                    <p className="font-semibold text-gray-800 dark:text-slate-100">
                      {new Date(orderData.created_at).toLocaleDateString(
                        "es-AR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información del Cliente */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <FaUser className="text-purple-600" /> Información del Cliente
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-slate-300 mb-1">Nombre Completo:</p>
                    <p className="font-semibold text-gray-800 dark:text-slate-100 text-lg">
                      {orderData.customers.full_name}
                    </p>
                  </div>
                  {(orderData.customers as Customer).phone && (
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-purple-600" />
                      <span className="font-medium text-gray-700 dark:text-slate-200">
                        {(orderData.customers as Customer).phone}
                      </span>
                    </div>
                  )}
                  {(orderData.customers as Customer).address && (
                    <div className="space-y-1">
                      <div className="flex items-start gap-2">
                        <FaMapMarkerAlt className="text-purple-600 mt-1" />
                        <span className="font-medium text-gray-700 dark:text-slate-200">
                          {(orderData.customers as Customer).address}
                        </span>
                      </div>
                      {(orderData.customers as Customer).reference && (
                        <div className="ml-6 text-sm text-gray-600 dark:text-slate-300 italic">
                          <FaInfoCircle className="inline mr-1 text-gray-400" />
                          Ref: {(orderData.customers as Customer).reference}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        (orderData.customers as Customer).customer_type ===
                        "mayorista"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {(orderData.customers as Customer).customer_type ===
                      "mayorista"
                        ? "🏢 Cliente Mayorista"
                        : "👤 Cliente Minorista"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Productos del Pedido */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <FaBox className="text-green-600" /> Productos (
                  {orderData.order_items.length})
                </h3>
                <div className="space-y-2">
                  {orderData.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-green-200"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 dark:text-slate-100">
                          {item.products?.name || "Producto desconocido"}
                        </p>
                        {item.products?.sku && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">
                            SKU: {item.products.sku}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
                          Cantidad:{" "}
                          <span className="font-bold">{item.quantity}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-slate-300">Precio Unit.</p>
                        <p className="font-bold text-gray-800 dark:text-slate-100">
                          ${item.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-green-600 font-semibold mt-1">
                          Subtotal: ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total del Pedido */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">Total del Pedido:</span>
                  <span className="text-3xl font-bold">
                    ${orderData.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 dark:bg-slate-950 rounded-b-3xl">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
