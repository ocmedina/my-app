"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { PDFDownloadLink } from "@react-pdf/renderer";
import OrderPDFDocument from "@/components/OrderPDFDocument";
import { FaPrint, FaEdit } from "react-icons/fa";

export default function OrderDetailsClient({
  initialOrder,
}: {
  initialOrder: any;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    const loadingToast = toast.loading("Actualizando estado...");

    if (newStatus === "confirmado" && order.status === "pendiente") {
      for (const item of order.order_items) {
        if (!item.products || item.products.stock < item.quantity) {
          toast.error(`Stock insuficiente para "${item.products?.name}".`);
          setLoading(false);
          toast.dismiss(loadingToast);
          return;
        }
      }
      for (const item of order.order_items) {
        const newStock = item.products.stock - item.quantity;
        await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", item.products.id);
      }
      toast.success("Stock descontado correctamente.");
    }

    if (newStatus === "cancelado" && order.status === "confirmado") {
      for (const item of order.order_items) {
        const newStock = (item.products.stock || 0) + item.quantity;
        await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", item.products.id);
      }
      toast.success("Stock devuelto al inventario.");
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", order.id)
      .select()
      .single();

    toast.dismiss(loadingToast);

    if (error) {
      toast.error(`Error al cambiar el estado: ${error.message}`);
    } else if (data) {
      setOrder((prevOrder: typeof order) => ({ ...prevOrder, ...data }));
      toast.success(`Pedido actualizado a "${newStatus}".`);
    }

    setLoading(false);
    router.refresh();
  };

  const statusOptions: { [key: string]: string } = {
    pendiente: "confirmado",
    confirmado: "enviado",
    enviado: "entregado",
  };
  const nextStatus = statusOptions[order.status];

  return (
    <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-md max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Detalle de Pedido</h1>
          <p className="text-xs sm:text-sm text-gray-500">ID: {order.id.substring(0, 8)}...</p>
        </div>
        <Link
          href="/dashboard/pedidos"
          className="text-sm sm:text-base text-blue-600 hover:underline"
        >
          &larr; Volver al listado
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 border-b pb-4 sm:pb-6">
        <div>
          <p className="text-xs sm:text-sm text-gray-500">Fecha</p>
          <p className="text-sm sm:text-base font-semibold">
            {new Date(order.created_at).toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-500">Cliente</p>
          <p className="text-sm sm:text-base font-semibold">{order.customers?.full_name ?? "N/A"}</p>
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-500">Estado Actual</p>
          <p className="text-sm sm:text-base font-semibold capitalize">{order.status}</p>
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-500">Método de Pago</p>
          <p className="font-semibold">
            {order.payment_method === "fiado" ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                📋 Fiado
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                💵 Efectivo
              </span>
            )}
          </p>
        </div>
      </div>

      <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Productos</h2>
      
      {/* Tabla Desktop */}
      <div className="hidden sm:block overflow-x-auto mb-6 sm:mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio Unit.
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {order.order_items?.map((item: any, index: number) => (
              <tr key={index}>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">
                  {item.products?.name ?? "Producto no disponible"}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500">
                  {item.quantity}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500">
                  ${item.price?.toFixed(2)}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500">
                  ${(item.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td
                colSpan={3}
                className="px-4 sm:px-6 py-3 text-right text-sm font-bold text-gray-900"
              >
                TOTAL
              </td>
              <td className="px-4 sm:px-6 py-3 text-left text-sm font-bold text-gray-900">
                ${order.total_amount?.toFixed(2)}
              </td>
            </tr>
            {(order as any).amount_paid !== undefined &&
              (order as any).amount_paid !== null && (
                <>
                  <tr className="bg-green-50">
                    <td
                      colSpan={3}
                      className="px-4 sm:px-6 py-2 text-right text-sm font-semibold text-green-700"
                    >
                      Entrega Recibida
                    </td>
                    <td className="px-4 sm:px-6 py-2 text-left text-sm font-semibold text-green-700">
                      ${((order as any).amount_paid || 0).toFixed(2)}
                    </td>
                  </tr>
                  {((order as any).amount_pending || 0) > 0 && (
                    <tr className="bg-orange-50">
                      <td
                        colSpan={3}
                        className="px-4 sm:px-6 py-2 text-right text-sm font-bold text-orange-700"
                      >
                        Saldo Pendiente
                      </td>
                      <td className="px-4 sm:px-6 py-2 text-left text-sm font-bold text-orange-700">
                        ${((order as any).amount_pending || 0).toFixed(2)}
                      </td>
                    </tr>
                  )}
                </>
              )}
          </tfoot>
        </table>
      </div>

      {/* Vista de Tarjetas - Mobile */}
      <div className="sm:hidden space-y-3 mb-6">
        {order.order_items?.map((item: any, index: number) => (
          <div key={index} className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="font-semibold text-sm text-gray-900">
              {item.products?.name ?? "Producto no disponible"}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Cantidad:</span>
                <span className="ml-1 font-semibold">{item.quantity}</span>
              </div>
              <div>
                <span className="text-gray-500">Precio Unit:</span>
                <span className="ml-1 font-semibold">${item.price?.toFixed(2)}</span>
              </div>
            </div>
            <div className="pt-2 border-t">
              <span className="text-xs text-gray-500">Subtotal:</span>
              <span className="ml-2 font-bold text-gray-900">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        ))}

        {/* Totales Mobile */}
        <div className="bg-gray-100 rounded-lg p-3 space-y-2 border-2 border-gray-300">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900">TOTAL</span>
            <span className="font-bold text-lg text-gray-900">
              ${order.total_amount?.toFixed(2)}
            </span>
          </div>
          {(order as any).amount_paid !== undefined &&
            (order as any).amount_paid !== null && (
              <>
                <div className="flex justify-between items-center pt-2 border-t border-green-200 bg-green-50 -mx-3 px-3 py-2">
                  <span className="text-sm font-semibold text-green-700">
                    Entrega Recibida
                  </span>
                  <span className="text-sm font-semibold text-green-700">
                    ${((order as any).amount_paid || 0).toFixed(2)}
                  </span>
                </div>
                {((order as any).amount_pending || 0) > 0 && (
                  <div className="flex justify-between items-center bg-orange-50 -mx-3 px-3 py-2">
                    <span className="text-sm font-bold text-orange-700">
                      Saldo Pendiente
                    </span>
                    <span className="text-sm font-bold text-orange-700">
                      ${((order as any).amount_pending || 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          {order.status === "pendiente" && (
            <Link
              href={`/dashboard/pedidos/edit/${order.id}`}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600"
            >
              <FaEdit /> Editar Pedido
            </Link>
          )}
          {nextStatus && (
            <button
              onClick={() => handleStatusChange(nextStatus)}
              disabled={loading}
              className="px-3 sm:px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Procesando..." : `Marcar como '${nextStatus}'`}
            </button>
          )}
          {order.status !== "cancelado" && order.status !== "entregado" && (
            <button
              onClick={() => handleStatusChange("cancelado")}
              disabled={loading}
              className="px-3 sm:px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Cancelar Pedido
            </button>
          )}
        </div>
        <PDFDownloadLink
          document={<OrderPDFDocument order={order} />}
          fileName={`pedido_${order.id.substring(0, 8)}.pdf`}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-700 text-white text-sm font-bold rounded-md hover:bg-gray-800"
        >
          {({ loading }) =>
            loading ? (
              "Generando Remito..."
            ) : (
              <>
                <FaPrint /> <span className="hidden sm:inline">Descargar</span> Remito
              </>
            )
          }
        </PDFDownloadLink>
      </div>
    </div>
  );
}
