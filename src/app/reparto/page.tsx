"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { User } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";
import { useRouter } from "next/navigation";
import {
  FaTimes,
  FaPlus,
  FaMinus,
  FaSearch,
  FaUserCircle,
  FaSignOutAlt,
  FaClipboardList,
  FaEdit,
  FaShoppingCart,
  FaUser,
  FaTruck,
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaPrint,
  FaSpinner,
  FaUserPlus,
  FaHistory,
  FaPhone,
  FaMapMarkerAlt,
  FaIdCard,
  FaBan,
  FaExclamationTriangle,
  FaInfoCircle,
  FaBox,
  FaCalendarAlt,
  FaHashtag,
} from "react-icons/fa";
import PDFDownloadButton from "@/components/PDFDownloadButton";

// --- Tipos de Datos ---
type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type CartItem = Product & { quantity: number };
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

// --- Modal para Agregar Cliente ---
function AddCustomerModal({
  isOpen,
  onClose,
  onCustomerAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded: (customer: Customer) => void;
}) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    customer_type: "minorista" as "minorista" | "mayorista",
    delivery_day: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysOfWeek = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          customer_type: formData.customer_type,
          delivery_day: formData.delivery_day || null,
          is_active: true,
          debt: 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("¡Cliente agregado exitosamente!");
      onCustomerAdded(data);
      setFormData({
        full_name: "",
        phone: "",
        email: "",
        address: "",
        customer_type: "minorista",
        delivery_day: "",
      });
      onClose();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg flex justify-between items-center sticky top-0">
          <h2 className="text-xl font-bold text-white">
            Agregar Nuevo Cliente
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Primera fila: Nombre y Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre Completo *
              </label>
              <input
                type="text"
                id="fullName"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>

            <div>
              <label
                htmlFor="customerType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tipo de Cliente *
              </label>
              <select
                id="customerType"
                value={formData.customer_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer_type: e.target.value as "minorista" | "mayorista",
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                required
              >
                <option value="minorista">Minorista</option>
                <option value="mayorista">Mayorista</option>
              </select>
            </div>
          </div>

          {/* Segunda fila: Teléfono y Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Ej: 2612345678"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Ej: cliente@email.com"
              />
            </div>
          </div>

          {/* Tercera fila: Dirección y DNI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Dirección
              </label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Ej: Calle 123, Mendoza"
              />
            </div>
          </div>

          {/* Cuarta fila: Día de Reparto */}
          <div>
            <label
              htmlFor="deliveryDay"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Día de Reparto (Opcional)
            </label>
            <select
              id="deliveryDay"
              value={formData.delivery_day}
              onChange={(e) =>
                setFormData({ ...formData, delivery_day: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">Ninguno</option>
              {daysOfWeek.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" /> Guardando...
                </>
              ) : (
                "Guardar Cliente"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Modal para Agregar Productos ---
function AddProductModal({
  isOpen,
  onClose,
  onProductAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onProductAdd: (product: Product) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      return;
    }
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const fetchProducts = async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .ilike("name", `%${query}%`)
          .eq("is_active", true)
          .gt("stock", 0)
          .limit(10);

        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        toast.error("Error al buscar productos");
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Agregar Producto</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 border-b">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto por nombre..."
              className="w-full py-3 pl-12 pr-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              autoFocus
            />
            {isSearching && (
              <FaSpinner className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {query.length < 2 ? (
            <p className="text-center text-gray-400 py-8">
              Escribe al menos 2 caracteres para buscar
            </p>
          ) : isSearching ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FaSpinner className="animate-spin text-4xl text-blue-600 mb-2" />
              <p className="text-gray-400">Buscando productos...</p>
            </div>
          ) : results.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              No se encontraron productos con stock
            </p>
          ) : (
            <ul className="space-y-2">
              {results.map((product) => (
                <li
                  key={product.id}
                  onClick={() => {
                    onProductAdd(product);
                    onClose();
                  }}
                  className="p-4 border-2 border-gray-200 rounded-xl flex justify-between items-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:text-blue-600">
                      {product.name}
                    </p>
                    <p className="text-sm text-green-600 font-medium mt-1">
                      ${product.price_minorista}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      Stock: {product.stock}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Modal de Confirmación de Entrega ---
function DeliveryConfirmationModal({
  isOpen,
  order,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirm: (
    orderId: string,
    amountPaid: number,
    paymentMethod: string
  ) => void;
}) {
  const [isDelivering, setIsDelivering] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");

  useEffect(() => {
    if (order) {
      setAmountPaid(order.total_amount.toFixed(2));
      setPaymentMethod("efectivo");
    }
  }, [order]);

  useEffect(() => {
    if (paymentMethod === "cuenta_corriente") {
      setAmountPaid("0.00");
    } else if (order) {
      setAmountPaid(order.total_amount.toFixed(2));
    }
  }, [paymentMethod, order]);

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
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 rounded-t-3xl flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaTruck /> Confirmar Entrega y Pago
          </h2>
          <button
            onClick={onClose}
            disabled={isDelivering}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className="p-8 space-y-5">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Cliente</p>
            <p className="text-xl font-bold text-gray-800">
              {order.customers.full_name}
            </p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              ${order.total_amount.toFixed(2)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Método de Pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-1 w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50"
            >
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">🏦 Transferencia</option>
              <option value="mercado_pago">📱 Mercado Pago</option>
              <option value="cuenta_corriente">
                📋 Cuenta Corriente (Fiado)
              </option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Monto Recibido
            </label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              step="0.01"
              min="0"
              className="mt-1 w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50"
            />
          </div>
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
            className="w-full mt-3 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Modal de REMITO PDF ---
function RemitoModal({
  isOpen,
  onClose,
  orderId,
}: {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}) {
  const [orderData, setOrderData] = useState<FullOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [printFormat, setPrintFormat] = useState<"A4" | "thermal">("thermal");

  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true);
      const fetchFullOrder = async () => {
        try {
          const { data: order, error } = await supabase
            .from("orders")
            .select("*, customers(*), order_items(*, products(*))")
            .eq("id", orderId)
            .single();

          if (error) throw error;

          if (order) {
            setOrderData(order as FullOrder);
          }
        } catch (error: any) {
          toast.error("No se pudieron cargar los datos del remito.");
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-5 rounded-t-3xl flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaPrint /> Generar Remito
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className="p-8">
          {loading || !orderData ? (
            <div className="flex flex-col items-center justify-center h-48">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
              <p className="mt-4 text-gray-600">Cargando datos del pedido...</p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-gray-700 text-center">
                El remito para{" "}
                <span className="font-bold">
                  {orderData.customers?.full_name}
                </span>{" "}
                está listo.
              </p>

              {/* Selector de formato */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato de Impresión:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPrintFormat("thermal")}
                    className={`py-3 px-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                      printFormat === "thermal"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <FaPrint className="text-xl" />
                      <span>Térmica 80mm</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setPrintFormat("A4")}
                    className={`py-3 px-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                      printFormat === "A4"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <FaPrint className="text-xl" />
                      <span>A4 Normal</span>
                    </div>
                  </button>
                </div>
              </div>

              <PDFDownloadButton
                orderData={orderData}
                printFormat={printFormat}
              />

              <button
                onClick={onClose}
                className="w-full mt-3 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl"
              >
                Cerrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Modal de Confirmación de Cancelación ---
function CancelOrderModal({
  isOpen,
  order,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirm: (orderId: string) => void;
}) {
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
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 rounded-t-3xl flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaExclamationTriangle /> Cancelar Pedido
          </h2>
          <button
            onClick={onClose}
            disabled={isCanceling}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className="p-8 space-y-5">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <FaBan className="text-red-600 text-3xl" />
            </div>
            <p className="text-lg font-semibold text-gray-800 mb-2">
              ¿Estás seguro de cancelar este pedido?
            </p>
            <p className="text-sm text-gray-600 mb-2">
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
            className="w-full mt-3 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
          >
            No, Mantener Pedido
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Modal de Detalles del Pedido ---
function OrderDetailsModal({
  isOpen,
  onClose,
  orderId,
}: {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}) {
  const [orderData, setOrderData] = useState<FullOrder | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true);
      const fetchFullOrder = async () => {
        try {
          const { data: order, error } = await supabase
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
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-3xl flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaInfoCircle /> Detalles del Pedido
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {loading || !orderData ? (
            <div className="flex flex-col items-center justify-center h-64">
              <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
              <p className="text-gray-600">Cargando detalles del pedido...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Información del Pedido */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <FaHashtag className="text-blue-600" /> Información del
                    Pedido
                  </h3>
                  {getStatusBadge(orderData.status)}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">ID del Pedido:</p>
                    <p className="font-mono font-semibold text-gray-800">
                      {orderData.id.substring(0, 8)}...
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1 flex items-center gap-1">
                      <FaCalendarAlt className="text-blue-600" /> Fecha:
                    </p>
                    <p className="font-semibold text-gray-800">
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
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FaUser className="text-purple-600" /> Información del Cliente
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Nombre Completo:</p>
                    <p className="font-semibold text-gray-800 text-lg">
                      {orderData.customers.full_name}
                    </p>
                  </div>
                  {(orderData.customers as Customer).phone && (
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-purple-600" />
                      <span className="font-medium text-gray-700">
                        {(orderData.customers as Customer).phone}
                      </span>
                    </div>
                  )}
                  {(orderData.customers as Customer).address && (
                    <div className="flex items-start gap-2">
                      <FaMapMarkerAlt className="text-purple-600 mt-1" />
                      <span className="font-medium text-gray-700">
                        {(orderData.customers as Customer).address}
                      </span>
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
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FaBox className="text-green-600" /> Productos (
                  {orderData.order_items.length})
                </h3>
                <div className="space-y-2">
                  {orderData.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {item.products?.name || "Producto desconocido"}
                        </p>
                        {item.products?.sku && (
                          <p className="text-xs text-gray-500 font-mono">
                            SKU: {item.products.sku}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          Cantidad:{" "}
                          <span className="font-bold">{item.quantity}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Precio Unit.</p>
                        <p className="font-bold text-gray-800">
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

        <div className="p-6 border-t bg-gray-50 rounded-b-3xl">
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

// --- Modal de Edición de Pedido ---
function EditOrderModal({
  isOpen,
  onClose,
  orderId,
  onOrderUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  onOrderUpdated: () => void;
}) {
  const [orderData, setOrderData] = useState<FullOrder | null>(null);
  const [editedItems, setEditedItems] = useState<
    {
      id: string;
      product_id: string;
      product_name: string;
      quantity: number;
      price: number;
      original_quantity: number;
      stock: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true);
      const fetchFullOrder = async () => {
        try {
          const { data: order, error } = await supabase
            .from("orders")
            .select("*, customers(*), order_items(*, products(*))")
            .eq("id", orderId)
            .single();

          if (error) throw error;

          if (order) {
            setOrderData(order as FullOrder);
            const items = order.order_items.map((item: any) => ({
              id: item.id,
              product_id: item.product_id,
              product_name: item.products?.name || "Producto desconocido",
              quantity: item.quantity,
              price: item.price,
              original_quantity: item.quantity,
              stock: item.products?.stock || 0,
            }));
            setEditedItems(items);
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

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    setEditedItems(
      editedItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setEditedItems(editedItems.filter((item) => item.id !== itemId));
  };

  const calculateNewTotal = () => {
    return editedItems.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );
  };

  const handleSave = async () => {
    if (!orderData) return;

    setIsSaving(true);
    const loadingToast = toast.loading("Actualizando pedido...");

    try {
      const newTotal = calculateNewTotal();

      // 1. Actualizar el total del pedido
      const { error: orderError } = await supabase
        .from("orders")
        .update({ total_amount: newTotal })
        .eq("id", orderId);

      if (orderError) throw orderError;

      // 2. Procesar cambios en los items
      for (const item of editedItems) {
        const quantityDiff = item.quantity - item.original_quantity;

        if (quantityDiff !== 0) {
          // Actualizar cantidad en order_items
          const { error: itemError } = await supabase
            .from("order_items")
            .update({ quantity: item.quantity })
            .eq("id", item.id);

          if (itemError) throw itemError;

          // Ajustar stock del producto
          const { data: productData } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();

          if (productData) {
            const newStock = productData.stock - quantityDiff;
            await supabase
              .from("products")
              .update({ stock: Math.max(0, newStock) })
              .eq("id", item.product_id);
          }
        }
      }

      // 3. Eliminar items que fueron removidos
      const removedItems = orderData.order_items.filter(
        (original: any) =>
          !editedItems.find((edited) => edited.id === original.id)
      );

      for (const removedItem of removedItems) {
        // Devolver stock
        const { data: productData } = await supabase
          .from("products")
          .select("stock")
          .eq("id", removedItem.product_id)
          .single();

        if (productData) {
          const newStock = productData.stock + removedItem.quantity;
          await supabase
            .from("products")
            .update({ stock: newStock })
            .eq("id", removedItem.product_id);
        }

        // Eliminar item
        await supabase.from("order_items").delete().eq("id", removedItem.id);
      }

      toast.dismiss(loadingToast);
      toast.success("¡Pedido actualizado exitosamente!");
      onOrderUpdated();
      onClose();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "Error al actualizar el pedido");
      console.error("Error updating order:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-3xl flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaEdit /> Editar Pedido
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          {loading || !orderData ? (
            <div className="flex flex-col items-center justify-center h-48">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
              <p className="mt-4 text-gray-600">Cargando datos del pedido...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="text-lg font-bold text-gray-800">
                  {orderData.customers?.full_name}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <FaShoppingCart /> Productos
                </h3>
                {editedItems.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">
                    No hay productos en este pedido
                  </p>
                ) : (
                  editedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {item.product_name}
                        </p>
                        <p className="text-sm text-green-600 font-medium mt-1">
                          ${item.price.toFixed(2)} c/u
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Stock disponible:{" "}
                          {item.stock + item.original_quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 flex items-center justify-center bg-white border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all font-bold"
                        >
                          <FaMinus size={12} />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            handleQuantityChange(item.id, val);
                          }}
                          className="w-16 text-center font-bold text-lg border-2 border-gray-200 rounded-lg"
                        />
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center bg-white border-2 border-green-200 text-green-600 rounded-lg hover:bg-green-50 transition-all font-bold"
                        >
                          <FaPlus size={12} />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="ml-2 w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                          title="Eliminar producto"
                        >
                          <FaTimes size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Total Original:</span>
                  <span className="font-medium line-through text-gray-400">
                    ${orderData.total_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-800">
                    Nuevo Total:
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    ${calculateNewTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="p-6 border-t bg-gray-50 rounded-b-3xl flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3 text-gray-600 font-semibold hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || loading || editedItems.length === 0}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <FaSpinner className="animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <FaCheck /> Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Componente Principal ---
export default function RepartoPage() {
  const [view, setView] = useState("new_order");
  const [dailyOrders, setDailyOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isRemitoModalOpen, setIsRemitoModalOpen] = useState(false);
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isCancelOrderModalOpen, setIsCancelOrderModalOpen] = useState(false);
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] =
    useState<Order | null>(null);
  const [selectedOrderForCancel, setSelectedOrderForCancel] =
    useState<Order | null>(null);
  const [selectedOrderIdForRemito, setSelectedOrderIdForRemito] = useState<
    string | null
  >(null);
  const [selectedOrderIdForEdit, setSelectedOrderIdForEdit] = useState<
    string | null
  >(null);
  const [selectedOrderIdForDetails, setSelectedOrderIdForDetails] = useState<
    string | null
  >(null);
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [historyFilter, setHistoryFilter] = useState("all");

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("is_active", true)
        .order("full_name");

      if (error) throw error;

      if (data) {
        setCustomers(data);
        if (data.length > 0 && !selectedCustomer) {
          setSelectedCustomer(data[0]);
        }
      }
    } catch (error: any) {
      toast.error("Error al cargar clientes");
    }
  }, [selectedCustomer]);

  // Fetch daily orders
  const fetchDailyHistory = useCallback(async (userId: string) => {
    try {
      // Obtener fecha en zona horaria Argentina
      const now = new Date();
      const argDate = new Date(
        now.toLocaleString("en-US", {
          timeZone: "America/Argentina/Buenos_Aires",
        })
      );
      const today = argDate.toISOString().split("T")[0];

      const tomorrowDate = new Date(argDate);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrow = tomorrowDate.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, total_amount, status, created_at, customer_id, profile_id, customers(full_name)"
        )
        .eq("profile_id", userId)
        .gte("created_at", `${today}T00:00:00-03:00`)
        .lt("created_at", `${tomorrow}T00:00:00-03:00`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDailyOrders((data || []) as unknown as Order[]);
    } catch (error: any) {
      toast.error("No se pudo cargar el historial.");
    }
  }, []);

  // Fetch all orders history
  const fetchAllOrdersHistory = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, total_amount, status, created_at, customer_id, profile_id, customers(full_name)"
        )
        .eq("profile_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setAllOrders((data || []) as unknown as Order[]);
    } catch (error: any) {
      toast.error("No se pudo cargar el historial completo.");
    }
  }, []);

  // Load initial data
  useEffect(() => {
    async function loadInitialData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        fetchDailyHistory(session.user.id);
        fetchAllOrdersHistory(session.user.id);
      } else {
        router.push("/login");
      }
      fetchCustomers();
    }
    loadInitialData();
  }, [fetchDailyHistory, fetchAllOrdersHistory, fetchCustomers, router]);

  // Real-time subscription for orders
  useEffect(() => {
    if (!currentUser) return;

    const ordersChannel = supabase
      .channel("realtime-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `profile_id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log("Order change detected:", payload);
          fetchDailyHistory(currentUser.id);
          fetchAllOrdersHistory(currentUser.id);
        }
      )
      .subscribe();

    return () => {
      ordersChannel.unsubscribe();
    };
  }, [currentUser, fetchDailyHistory, fetchAllOrdersHistory]);

  // Calculate subtotal and total
  const subTotal = useMemo(() => {
    if (!selectedCustomer) return 0;
    return cart.reduce((acc, item) => {
      const price =
        selectedCustomer.customer_type === "mayorista"
          ? item.price_mayorista
          : item.price_minorista;
      const numericPrice = parseFloat(String(price)) || 0;
      const quantity = parseInt(String(item.quantity)) || 0;
      return acc + numericPrice * quantity;
    }, 0);
  }, [cart, selectedCustomer]);

  const total = useMemo(() => {
    const numericSubTotal = parseFloat(String(subTotal)) || 0;
    const numericDiscount = parseFloat(String(discount)) || 0;
    const numericShipping = parseFloat(String(shipping)) || 0;
    return (
      numericSubTotal -
      numericSubTotal * (numericDiscount / 100) +
      numericShipping
    );
  }, [subTotal, discount, shipping]);

  // Handle add product to cart
  const handleAddProduct = useCallback(
    (productToAdd: Product) => {
      if (!selectedCustomer) {
        toast.error("Por favor, selecciona un cliente.");
        return;
      }

      const existingItem = cart.find((item) => item.id === productToAdd.id);

      if (existingItem) {
        if (existingItem.quantity < (productToAdd.stock || 0)) {
          setCart(
            cart.map((item) =>
              item.id === productToAdd.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          );
          toast.success("Cantidad actualizada");
        } else {
          toast.error("No hay más stock disponible.");
        }
      } else {
        if ((productToAdd.stock || 0) > 0) {
          setCart([...cart, { ...productToAdd, quantity: 1 }]);
          toast.success("Producto agregado");
        } else {
          toast.error("Este producto no tiene stock.");
        }
      }
    },
    [cart, selectedCustomer]
  );

  // Handle update quantity
  const handleUpdateQuantity = useCallback(
    (productId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
        setCart(cart.filter((item) => item.id !== productId));
        toast.success("Producto eliminado");
      } else {
        const product = cart.find((item) => item.id === productId);
        if (product && newQuantity > (product.stock || 0)) {
          toast.error("No hay más stock disponible.");
          return;
        }
        setCart(
          cart.map((item) =>
            item.id === productId ? { ...item, quantity: newQuantity } : item
          )
        );
      }
    },
    [cart]
  );

  // Handle finalize order
  const handleFinalizeOrder = async () => {
    if (!selectedCustomer || cart.length === 0 || !currentUser?.id) {
      toast.error("Faltan datos para completar el pedido.");
      return;
    }

    if (total <= 0) {
      toast.error("El total debe ser mayor a 0.");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Guardando pedido...");

    try {
      // 1. Verificar stock actual en tiempo real
      for (const item of cart) {
        const { data: productData, error: stockError } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.id)
          .single();

        if (stockError)
          throw new Error(`Error al verificar stock de ${item.name}`);

        if (!productData || item.quantity > productData.stock) {
          throw new Error(
            `Stock insuficiente para "${item.name}". Solo quedan ${
              productData?.stock || 0
            }.`
          );
        }
      }

      // 2. Crear el pedido
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: selectedCustomer.id,
          profile_id: currentUser.id,
          total_amount: total,
          status: "pendiente",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Guardar items del pedido
      const orderItems = cart.map((item) => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        price:
          selectedCustomer.customer_type === "mayorista"
            ? item.price_mayorista
            : item.price_minorista,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        // Rollback: eliminar el pedido creado
        await supabase.from("orders").delete().eq("id", orderData.id);
        throw itemsError;
      }

      // 4. Descontar el stock
      for (const item of cart) {
        const { data: currentProduct } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.id)
          .single();

        const newStock = (currentProduct?.stock || 0) - item.quantity;

        await supabase
          .from("products")
          .update({ stock: Math.max(0, newStock) })
          .eq("id", item.id);
      }

      toast.dismiss(loadingToast);
      toast.success("¡Pedido registrado exitosamente!");

      // Refrescar datos
      if (currentUser) {
        fetchDailyHistory(currentUser.id);
        fetchAllOrdersHistory(currentUser.id);
      }

      // Limpiar formulario
      setCart([]);
      if (customers.length > 0) setSelectedCustomer(customers[0]);
      setDiscount(0);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "Error al registrar el pedido");
      console.error("Error creating order:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle confirm delivery
  const handleConfirmDelivery = async (
    orderId: string,
    amountPaid: number,
    paymentMethod: string
  ) => {
    const order = dailyOrders.find((o) => o.id === orderId);
    if (!order) return;

    const total = order.total_amount;
    const debtGenerated = total - amountPaid;

    try {
      // 1. Actualizar la deuda del cliente (si es necesario)
      if (debtGenerated > 0) {
        const { data: customerData } = await supabase
          .from("customers")
          .select("debt")
          .eq("id", order.customer_id)
          .single();

        const currentDebt = (customerData?.debt as number) || 0;
        const newDebt = currentDebt + debtGenerated;

        await supabase
          .from("customers")
          .update({ debt: newDebt })
          .eq("id", order.customer_id);
      }

      // 2. Registrar movimientos en la cuenta corriente
      const movements = [
        {
          customer_id: order.customer_id,
          order_id: order.id,
          type: "compra",
          amount: total,
          comment: `Pedido ${order.id.substring(0, 8)}`,
        },
      ];

      if (amountPaid > 0) {
        movements.push({
          customer_id: order.customer_id,
          order_id: order.id,
          type: "pago",
          amount: amountPaid,
          comment: `Pago en entrega (${paymentMethod})`,
        });
      }

      await supabase.from("payments").insert(movements);

      // 3. Marcar pedido como 'entregado'
      const { error } = await supabase
        .from("orders")
        .update({ status: "entregado" })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("✅ Pedido marcado como entregado.");

      // Refrescar datos
      if (currentUser) {
        fetchDailyHistory(currentUser.id);
        fetchAllOrdersHistory(currentUser.id);
      }
    } catch (error: any) {
      toast.error("Error al marcar el pedido como entregado");
      console.error(error);
    }
  };

  // Handle cancel order
  const handleCancelOrder = async (orderId: string) => {
    try {
      // 1. Obtener los items del pedido para devolver el stock
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      // 2. Devolver el stock de cada producto
      if (orderItems) {
        for (const item of orderItems) {
          const { data: productData } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();

          if (productData) {
            const newStock = productData.stock + item.quantity;
            await supabase
              .from("products")
              .update({ stock: newStock })
              .eq("id", item.product_id);
          }
        }
      }

      // 3. Marcar el pedido como 'cancelado'
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelado" })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("🚫 Pedido cancelado exitosamente. Stock devuelto.");

      // Refrescar datos
      if (currentUser) {
        fetchDailyHistory(currentUser.id);
        fetchAllOrdersHistory(currentUser.id);
      }
    } catch (error: any) {
      toast.error("Error al cancelar el pedido");
      console.error(error);
    }
  };

  // Handle customer added
  const handleCustomerAdded = (newCustomer: Customer) => {
    setCustomers((prev) =>
      [...prev, newCustomer].sort((a, b) =>
        a.full_name.localeCompare(b.full_name)
      )
    );
    setSelectedCustomer(newCustomer);
    toast.success(`Cliente ${newCustomer.full_name} seleccionado`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const pendingOrdersCount = dailyOrders.filter(
    (o) => o.status === "pendiente"
  ).length;
  const deliveredOrdersCount = dailyOrders.filter(
    (o) => o.status === "entregado"
  ).length;

  // Filter orders for history view
  const filteredHistoryOrders = useMemo(() => {
    if (historyFilter === "all") return allOrders;
    return allOrders.filter((o) => o.status === historyFilter);
  }, [allOrders, historyFilter]);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen font-sans">
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductAdd={handleAddProduct}
      />
      <DeliveryConfirmationModal
        isOpen={isDeliveryModalOpen}
        order={selectedOrderForDelivery}
        onClose={() => setIsDeliveryModalOpen(false)}
        onConfirm={handleConfirmDelivery}
      />
      <RemitoModal
        isOpen={isRemitoModalOpen}
        onClose={() => setIsRemitoModalOpen(false)}
        orderId={selectedOrderIdForRemito}
      />
      <EditOrderModal
        isOpen={isEditOrderModalOpen}
        onClose={() => setIsEditOrderModalOpen(false)}
        orderId={selectedOrderIdForEdit}
        onOrderUpdated={() => {
          if (currentUser) {
            fetchDailyHistory(currentUser.id);
            fetchAllOrdersHistory(currentUser.id);
          }
        }}
      />
      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        onCustomerAdded={handleCustomerAdded}
      />
      <CancelOrderModal
        isOpen={isCancelOrderModalOpen}
        order={selectedOrderForCancel}
        onClose={() => setIsCancelOrderModalOpen(false)}
        onConfirm={handleCancelOrder}
      />
      <OrderDetailsModal
        isOpen={isOrderDetailsModalOpen}
        onClose={() => setIsOrderDetailsModalOpen(false)}
        orderId={selectedOrderIdForDetails}
      />

      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FaTruck className="text-blue-600 text-2xl" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FrontStock
              </h1>
              <p className="text-xs text-gray-500 font-medium">Modo Reparto</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <FaUserCircle className="text-white text-lg" />
              </div>
              <span className="font-semibold text-sm text-gray-700 max-w-[120px] truncate">
                {currentUser?.email?.split("@")[0]}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors"
            >
              <FaSignOutAlt />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => setView("new_order")}
            className={`flex-1 py-3 text-center font-semibold transition-all flex items-center justify-center gap-2 ${
              view === "new_order"
                ? "bg-blue-50 border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <FaEdit className="text-lg" />
            <span className="hidden sm:inline">Tomar Pedido</span>
            <span className="sm:hidden">Pedido</span>
          </button>
          <button
            onClick={() => setView("daily")}
            className={`flex-1 py-3 text-center font-semibold transition-all flex items-center justify-center gap-2 relative ${
              view === "daily"
                ? "bg-blue-50 border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <FaClipboardList className="text-lg" />
            <span className="hidden sm:inline">Hoy</span>
            {pendingOrdersCount > 0 && (
              <span className="absolute top-1 right-2 sm:right-1/4 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {pendingOrdersCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setView("history")}
            className={`flex-1 py-3 text-center font-semibold transition-all flex items-center justify-center gap-2 ${
              view === "history"
                ? "bg-blue-50 border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <FaHistory className="text-lg" />
            <span className="hidden sm:inline">Historial</span>
            <span className="sm:hidden">Hist.</span>
          </button>
        </div>
      </header>

      {view === "new_order" && (
        <main className="p-4 space-y-4 pb-32">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-white">
                <FaUser /> Cliente Seleccionado
              </label>
            </div>
            <div className="p-5">
              <select
                value={selectedCustomer?.id || ""}
                onChange={(e) =>
                  setSelectedCustomer(
                    customers.find((c) => c.id === e.target.value) || null
                  )
                }
                className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg font-semibold bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-gray-800"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
              <div className="mt-4 flex items-center justify-between gap-2">
                {selectedCustomer && (
                  <span
                    className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                      selectedCustomer.customer_type === "mayorista"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {selectedCustomer.customer_type === "mayorista"
                      ? "🏢 Mayorista"
                      : "👤 Minorista"}
                  </span>
                )}
                <button
                  onClick={() => setIsAddCustomerModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
                >
                  <FaUserPlus /> Nuevo Cliente
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <FaShoppingCart className="text-blue-600" /> Productos del
                Pedido
              </h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
              >
                <FaPlus /> Añadir
              </button>
            </div>
            <div className="space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <FaShoppingCart className="text-5xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">
                    El pedido está vacío
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Agrega productos para comenzar
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-sm text-green-600 font-medium mt-1">
                        $
                        {selectedCustomer?.customer_type === "mayorista"
                          ? item.price_mayorista
                          : item.price_minorista}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item.id, item.quantity - 1)
                        }
                        className="w-8 h-8 flex items-center justify-center bg-white border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all font-bold"
                      >
                        <FaMinus size={12} />
                      </button>
                      <span className="font-bold text-lg w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item.id, item.quantity + 1)
                        }
                        className="w-8 h-8 flex items-center justify-center bg-white border-2 border-green-200 text-green-600 rounded-lg hover:bg-green-50 transition-all font-bold"
                      >
                        <FaPlus size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      )}

      {view === "daily" && (
        <main className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 font-medium">Pendientes</p>
                  <p className="text-3xl font-bold mt-1">
                    {pendingOrdersCount}
                  </p>
                </div>
                <FaClock className="text-4xl opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 font-medium">Entregados</p>
                  <p className="text-3xl font-bold mt-1">
                    {deliveredOrdersCount}
                  </p>
                </div>
                <FaCheckCircle className="text-4xl opacity-80" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
              <FaClipboardList className="text-blue-600" /> Pedidos de Hoy (
              {dailyOrders.length})
            </h2>
            <ul className="space-y-3">
              {dailyOrders.length > 0 ? (
                dailyOrders.map((order) => (
                  <li
                    key={order.id}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {order.customers.full_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(order.created_at).toLocaleTimeString(
                            "es-AR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                      <p className="font-bold text-xl text-green-600">
                        ${order.total_amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                          order.status === "pendiente"
                            ? "bg-yellow-100 text-yellow-700"
                            : order.status === "cancelado"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {order.status === "pendiente" ? (
                          <FaClock />
                        ) : order.status === "cancelado" ? (
                          <FaBan />
                        ) : (
                          <FaCheckCircle />
                        )}
                        {order.status === "pendiente"
                          ? "Pendiente"
                          : order.status === "cancelado"
                          ? "Cancelado"
                          : "Entregado"}
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedOrderIdForDetails(order.id);
                            setIsOrderDetailsModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-all"
                        >
                          <FaInfoCircle /> Ver
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrderIdForEdit(order.id);
                            setIsEditOrderModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all"
                        >
                          <FaEdit /> Editar
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrderIdForRemito(order.id);
                            setIsRemitoModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 bg-gray-600 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-all"
                        >
                          <FaPrint /> Remito
                        </button>
                        {order.status === "pendiente" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedOrderForDelivery(order);
                                setIsDeliveryModalOpen(true);
                              }}
                              className="flex items-center gap-1 px-2 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-all"
                            >
                              <FaTruck /> Entregar
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrderForCancel(order);
                                setIsCancelOrderModalOpen(true);
                              }}
                              className="flex items-center gap-1 px-2 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-all"
                            >
                              <FaBan /> Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <div className="text-center py-12">
                  <FaClipboardList className="text-5xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">
                    Aún no has tomado pedidos hoy
                  </p>
                </div>
              )}
            </ul>
          </div>
        </main>
      )}

      {view === "history" && (
        <main className="p-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                <FaHistory className="text-blue-600" /> Historial Completo
              </h2>
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              >
                <option value="all">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="entregado">Entregados</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              Mostrando {filteredHistoryOrders.length} pedido(s)
            </div>

            <ul className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
              {filteredHistoryOrders.length > 0 ? (
                filteredHistoryOrders.map((order) => (
                  <li
                    key={order.id}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {order.customers.full_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(order.created_at).toLocaleString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <p className="font-bold text-xl text-green-600">
                        ${order.total_amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                          order.status === "pendiente"
                            ? "bg-yellow-100 text-yellow-700"
                            : order.status === "cancelado"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {order.status === "pendiente" ? (
                          <FaClock />
                        ) : order.status === "cancelado" ? (
                          <FaBan />
                        ) : (
                          <FaCheckCircle />
                        )}
                        {order.status === "pendiente"
                          ? "Pendiente"
                          : order.status === "cancelado"
                          ? "Cancelado"
                          : "Entregado"}
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedOrderIdForDetails(order.id);
                            setIsOrderDetailsModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-all"
                        >
                          <FaInfoCircle /> Ver
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrderIdForEdit(order.id);
                            setIsEditOrderModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all"
                        >
                          <FaEdit /> Editar
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrderIdForRemito(order.id);
                            setIsRemitoModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 bg-gray-600 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-all"
                        >
                          <FaPrint /> Remito
                        </button>
                        {order.status === "pendiente" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedOrderForDelivery(order);
                                setIsDeliveryModalOpen(true);
                              }}
                              className="flex items-center gap-1 px-2 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-all"
                            >
                              <FaTruck /> Entregar
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrderForCancel(order);
                                setIsCancelOrderModalOpen(true);
                              }}
                              className="flex items-center gap-1 px-2 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-all"
                            >
                              <FaBan /> Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <div className="text-center py-12">
                  <FaHistory className="text-5xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">
                    No hay pedidos en el historial
                  </p>
                </div>
              )}
            </ul>
          </div>
        </main>
      )}

      {view === "new_order" && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-2xl">
          <div className="max-w-lg mx-auto">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${subTotal.toFixed(2)}</span>
            </div>

            {/* Campo de Descuento */}
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm font-medium text-gray-600">
                Descuento:
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={discount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.-]/g, "");
                  setDiscount(parseFloat(value) || 0);
                }}
                className="w-20 p-1 border-2 border-gray-200 rounded-lg text-right font-semibold"
                placeholder="0"
              />
              <span className="text-lg font-medium text-gray-600">%</span>
            </div>

            {/* Campo de Envío / Extra */}
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm font-medium text-gray-600">
                Envío:
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={shipping}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.-]/g, "");
                  setShipping(parseFloat(value) || 0);
                }}
                className="w-24 p-1 border-2 border-gray-200 rounded-lg text-right font-semibold"
                placeholder="0.00"
              />
              <span className="text-sm text-gray-600">+$</span>
            </div>

            <div className="flex justify-between items-center font-bold text-2xl mb-4">
              <span className="text-gray-700">Total:</span>
              <span className="text-green-600">${total.toFixed(2)}</span>
            </div>

            <button
              onClick={handleFinalizeOrder}
              disabled={loading || cart.length === 0 || !selectedCustomer}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 hover:from-green-700 hover:to-green-800"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <FaCheck className="text-xl" /> Guardar Pedido
                </>
              )}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
