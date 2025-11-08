"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  FaSearch,
  FaPlus,
  FaFilter,
  FaTimes,
  FaInfoCircle,
  FaUser,
  FaBox,
  FaCalendarAlt,
  FaHashtag,
  FaPhone,
  FaMapMarkerAlt,
  FaSpinner,
  FaClock,
  FaCheckCircle,
  FaBan,
  FaPrint,
} from "react-icons/fa";
import toast from "react-hot-toast";
import OrderStatusChanger from "@/components/OrderStatusChanger";
import PDFDownloadButton from "@/components/PDFDownloadButton";

const ITEMS_PER_PAGE = 15;

type CustomerRow = {
  id: string;
  full_name: string;
  delivery_day: string | null;
};

type ProductRow = {
  id: string;
  name: string;
  stock: number | null;
};

type OrderItemRow = {
  quantity: number;
  products: ProductRow | null;
};

type OrderRow = {
  id: string;
  created_at: string;
  total_amount: number | null;
  status: "pendiente" | "confirmado" | "enviado" | "entregado" | "cancelado";
  customers: CustomerRow | null;
  order_items: OrderItemRow[];
};

type FullOrderDetails = {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  customers: {
    id: string;
    full_name: string;
    phone?: string | null;
    address?: string | null;
    email?: string | null;
    customer_type?: string;
    delivery_day?: string | null;
  };
  order_items: {
    id: string;
    quantity: number;
    price: number;
    products: {
      name: string;
      sku?: string | null;
    } | null;
  }[];
};

const STATUS_CONFIG = {
  todos: {
    label: "Todos",
    color: "bg-gray-100 text-gray-700",
    activeColor: "bg-gray-600 text-white",
  },
  pendiente: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-700",
    activeColor: "bg-yellow-600 text-white",
  },
  confirmado: {
    label: "Confirmado",
    color: "bg-blue-100 text-blue-700",
    activeColor: "bg-blue-600 text-white",
  },
  enviado: {
    label: "Enviado",
    color: "bg-purple-100 text-purple-700",
    activeColor: "bg-purple-600 text-white",
  },
  entregado: {
    label: "Entregado",
    color: "bg-green-100 text-green-700",
    activeColor: "bg-green-600 text-white",
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-red-100 text-red-700",
    activeColor: "bg-red-600 text-white",
  },
} as const;

const DAYS_OF_WEEK = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

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
  const [orderData, setOrderData] = useState<FullOrderDetails | null>(null);
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
            setOrderData(order as FullOrderDetails);
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
    const statusConfig: Record<
      string,
      { label: string; color: string; icon: React.ReactNode }
    > = {
      pendiente: {
        label: "Pendiente",
        color: "bg-yellow-100 text-yellow-800",
        icon: <FaClock />,
      },
      confirmado: {
        label: "Confirmado",
        color: "bg-blue-100 text-blue-800",
        icon: <FaCheckCircle />,
      },
      enviado: {
        label: "Enviado",
        color: "bg-purple-100 text-purple-800",
        icon: <FaBox />,
      },
      entregado: {
        label: "Entregado",
        color: "bg-green-100 text-green-800",
        icon: <FaCheckCircle />,
      },
      cancelado: {
        label: "Cancelado",
        color: "bg-red-100 text-red-800",
        icon: <FaBan />,
      },
    };

    const config = statusConfig[status] || statusConfig.pendiente;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${config.color}`}
      >
        {config.icon} {config.label}
      </span>
    );
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
                  <div className="col-span-2">
                    <p className="text-gray-600 mb-1">Método de Pago:</p>
                    {(orderData as any).payment_method === "fiado" ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                        📋 Fiado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        💵 Efectivo
                      </span>
                    )}
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
                  {orderData.customers.phone && (
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-purple-600" />
                      <span className="font-medium text-gray-700">
                        {orderData.customers.phone}
                      </span>
                    </div>
                  )}
                  {orderData.customers.address && (
                    <div className="flex items-start gap-2">
                      <FaMapMarkerAlt className="text-purple-600 mt-1" />
                      <span className="font-medium text-gray-700">
                        {orderData.customers.address}
                      </span>
                    </div>
                  )}
                  {orderData.customers.delivery_day && (
                    <div>
                      <p className="text-gray-600 mb-1">Día de Reparto:</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        📅 {orderData.customers.delivery_day}
                      </span>
                    </div>
                  )}
                  {orderData.customers.customer_type && (
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                          orderData.customers.customer_type === "mayorista"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {orderData.customers.customer_type === "mayorista"
                          ? "🏢 Cliente Mayorista"
                          : "👤 Cliente Minorista"}
                      </span>
                    </div>
                  )}
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

              {/* Estado de Pago */}
              {(orderData as any).amount_paid !== undefined &&
                (orderData as any).amount_paid !== null && (
                  <div className="space-y-2">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-green-700 font-semibold">
                          Entrega Recibida:
                        </span>
                        <span className="text-xl font-bold text-green-700">
                          ${((orderData as any).amount_paid || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {((orderData as any).amount_pending || 0) > 0 && (
                      <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-300">
                        <div className="flex items-center justify-between">
                          <span className="text-orange-700 font-bold">
                            Saldo Pendiente:
                          </span>
                          <span className="text-2xl font-bold text-orange-700">
                            $
                            {((orderData as any).amount_pending || 0).toFixed(
                              2
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {((orderData as any).amount_pending || 0) === 0 &&
                      (orderData as any).amount_paid > 0 && (
                        <div className="bg-green-50 rounded-xl p-3 border-2 border-green-300 flex items-center justify-center gap-2">
                          <FaCheckCircle className="text-green-700" />
                          <span className="text-green-700 font-bold">
                            Pago Completo
                          </span>
                        </div>
                      )}
                  </div>
                )}
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
  const [orderData, setOrderData] = useState<FullOrderDetails | null>(null);
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
            setOrderData(order as FullOrderDetails);
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
                  {orderData.customers.full_name}
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
                    className={`p-3 rounded-lg border-2 transition-all ${
                      printFormat === "thermal"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🧾</div>
                      <div className="font-semibold text-sm">80mm</div>
                      <div className="text-xs">Térmica</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPrintFormat("A4")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      printFormat === "A4"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">📄</div>
                      <div className="font-semibold text-sm">A4</div>
                      <div className="text-xs">Estándar</div>
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [selectedOrderIdForDetails, setSelectedOrderIdForDetails] = useState<
    string | null
  >(null);
  const [isRemitoModalOpen, setIsRemitoModalOpen] = useState(false);
  const [selectedOrderIdForRemito, setSelectedOrderIdForRemito] = useState<
    string | null
  >(null);

  const [statusFilter, setStatusFilter] = useState<
    "todos" | OrderRow["status"]
  >("todos");
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryDayFilter, setDeliveryDayFilter] = useState("todos");

  const hasActiveFilters =
    statusFilter !== "todos" ||
    dateFilter ||
    searchQuery ||
    deliveryDayFilter !== "todos";

  const clearFilters = () => {
    setStatusFilter("todos");
    setDateFilter("");
    setSearchQuery("");
    setDeliveryDayFilter("todos");
    setCurrentPage(1);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from("orders")
      .select(
        `
        id, created_at, total_amount, status,
        customers ( id, full_name, delivery_day ),
        order_items ( quantity, products ( id, name, stock ) )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (statusFilter !== "todos") query = query.eq("status", statusFilter);
    if (dateFilter) {
      const startDate = new Date(dateFilter);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(dateFilter);
      endDate.setUTCHours(23, 59, 59, 999);
      query = query
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
    }
    if (searchQuery.length > 2)
      query = query.ilike("customers.full_name", `%${searchQuery}%`);
    if (deliveryDayFilter !== "todos")
      query = query.eq("customers.delivery_day", deliveryDayFilter);

    const { data, error, count } = await query;

    if (error) {
      toast.error("Error al cargar los pedidos.");
      console.error(error);
    } else {
      setOrders((data || []) as unknown as OrderRow[]);
      setTotalCount(count || 0);
    }

    setLoading(false);
  }, [currentPage, statusFilter, dateFilter, searchQuery, deliveryDayFilter]);

  useEffect(() => {
    const debounce = setTimeout(fetchOrders, 300);
    return () => clearTimeout(debounce);
  }, [fetchOrders]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getStatusBadge = (status: OrderRow["status"]) => {
    const config = STATUS_CONFIG[status];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Modal de Detalles */}
      <OrderDetailsModal
        isOpen={isOrderDetailsModalOpen}
        onClose={() => setIsOrderDetailsModalOpen(false)}
        orderId={selectedOrderIdForDetails}
      />

      {/* Modal de Remito */}
      <RemitoModal
        isOpen={isRemitoModalOpen}
        onClose={() => setIsRemitoModalOpen(false)}
        orderId={selectedOrderIdForRemito}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Gestión de Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {totalCount} pedido{totalCount !== 1 ? "s" : ""} en total
          </p>
        </div>
        <Link
          href="/dashboard/pedidos/nuevo"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <FaPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo Pedido</span>
          <span className="sm:hidden">Nuevo</span>
        </Link>
      </div>

      {/* Filtros de Estado */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs sm:text-sm font-semibold text-gray-700">
            Filtrar por Estado
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <FaFilter className="w-3 h-3" />
            {showFilters ? "Ocultar" : "Más"} Filtros
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {(
            Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>
          ).map((status) => {
            const config = STATUS_CONFIG[status];
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status as any);
                  setCurrentPage(1);
                }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? config.activeColor
                    : `${config.color} hover:opacity-80`
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtros Avanzados */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 space-y-4 animate-slideDown">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-700">
              Filtros Avanzados
            </h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
              >
                <FaTimes className="w-3 h-3" />
                <span className="hidden sm:inline">Limpiar Filtros</span>
                <span className="sm:hidden">Limpiar</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar Cliente
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Nombre del cliente..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha del Pedido
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Día de Reparto
              </label>
              <select
                value={deliveryDayFilter}
                onChange={(e) => {
                  setDeliveryDayFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos los Días</option>
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Pedidos - Desktop */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Día de Reparto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pago
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center gap-2 text-gray-500">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Cargando pedidos...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FaSearch className="w-8 h-8 text-gray-300" />
                      <p>No se encontraron pedidos con los filtros aplicados</p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customers?.full_name ?? "Sin cliente"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {order.customers?.delivery_day ?? "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        $
                        {order.total_amount?.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) ?? "0.00"}
                      </div>
                      {((order as any).amount_pending || 0) > 0 && (
                        <div className="text-xs text-orange-600 font-semibold mt-1">
                          Pendiente: $
                          {((order as any).amount_pending || 0).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="space-y-1">
                        {(order as any).payment_method === "fiado" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                            📋 Fiado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            💵 Efectivo
                          </span>
                        )}
                        {((order as any).amount_pending || 0) === 0 &&
                          ((order as any).amount_paid || 0) > 0 && (
                            <div className="text-xs text-green-600 font-semibold flex items-center gap-1">
                              <FaCheckCircle className="w-3 h-3" /> Pagado
                            </div>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <OrderStatusChanger
                        order={order}
                        onStatusUpdate={fetchOrders}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrderIdForDetails(order.id);
                            setIsOrderDetailsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-all"
                        >
                          <FaInfoCircle /> Ver
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrderIdForRemito(order.id);
                            setIsRemitoModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-all"
                        >
                          <FaPrint /> Remito
                        </button>
                        <Link
                          href={`/dashboard/pedidos/${order.id}`}
                          className="text-blue-600 hover:text-blue-700 hover:underline text-xs"
                        >
                          Detalle Completo
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista de Tarjetas - Mobile y Tablet */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Cargando pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-gray-400 mb-2">
              <FaBoxOpen className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-600 mb-4">No se encontraron pedidos con los filtros aplicados.</p>
            {(filterCustomer || filterStatus || filterDeliveryDay || filterDate) && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm p-4 space-y-3"
            >
              {/* Header con fecha y estado */}
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(order.created_at).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {order.customers?.full_name ?? "Sin cliente"}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Reparto: {order.customers?.delivery_day ?? "N/A"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <OrderStatusChanger
                    order={order}
                    onStatusUpdate={fetchOrders}
                  />
                  {(order as any).payment_method === "fiado" ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                      📋 Fiado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      💵 Efectivo
                    </span>
                  )}
                </div>
              </div>

              {/* Total y pago */}
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total:</span>
                  <span className="text-base font-bold text-gray-900">
                    $
                    {order.total_amount?.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) ?? "0.00"}
                  </span>
                </div>
                {((order as any).amount_pending || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-orange-600">Pendiente:</span>
                    <span className="text-sm font-semibold text-orange-600">
                      ${((order as any).amount_pending || 0).toFixed(2)}
                    </span>
                  </div>
                )}
                {((order as any).amount_pending || 0) === 0 &&
                  ((order as any).amount_paid || 0) > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="text-xs">Estado:</span>
                      <span className="text-xs font-semibold flex items-center gap-1">
                        <FaCheckCircle className="w-3 h-3" /> Pagado
                      </span>
                    </div>
                  )}
              </div>

              {/* Acciones */}
              <div className="border-t pt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedOrderIdForDetails(order.id);
                    setIsOrderDetailsModalOpen(true);
                  }}
                  className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-all"
                >
                  <FaInfoCircle /> Ver Detalles
                </button>
                <button
                  onClick={() => {
                    setSelectedOrderIdForRemito(order.id);
                    setIsRemitoModalOpen(true);
                  }}
                  className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-all"
                >
                  <FaPrint /> Remito
                </button>
                <Link
                  href={`/dashboard/pedidos/${order.id}`}
                  className="flex-1 min-w-[120px] inline-flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-all"
                >
                  Detalle Completo
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 bg-white rounded-lg shadow-sm p-3 sm:p-4">
          <span className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
            Mostrando <span className="font-medium">{orders.length}</span> de{" "}
            <span className="font-medium">{totalCount}</span> pedidos
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">
              Pág. <span className="font-medium">{currentPage}</span> / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
