"use client";

import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { useState } from "react";

export default function OrderStatusChanger({
  order,
  onStatusUpdate,
}: {
  order: any;
  onStatusUpdate: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === order.status) return;

    const confirmation = confirm(
      `¿Estás seguro de que quieres cambiar el estado a "${newStatus}"?`
    );
    if (!confirmation) {
      const selectElement = document.getElementById(
        `status-changer-${order.id}`
      ) as HTMLSelectElement;
      if (selectElement) selectElement.value = order.status;
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Actualizando estado...");

    try {
      const { error } = await supabase.rpc("handle_order_status_change", {
        order_id_param: order.id,
        new_status_param: newStatus,
      });

      if (error) throw error;

      toast.success(`Pedido actualizado a "${newStatus}".`);
      onStatusUpdate();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar el estado: " + error.message);

      // Revertir selección visual si hubo error
      const selectElement = document.getElementById(
        `status-changer-${order.id}`
      ) as HTMLSelectElement;
      if (selectElement) selectElement.value = order.status;
    } finally {
      toast.dismiss(loadingToast);
      setLoading(false);
    }
  };

  return (
    <select
      id={`status-changer-${order.id}`}
      value={order.status}
      onChange={(e) => handleStatusChange(e.target.value)}
      disabled={loading}
      className="p-1 border rounded-md text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
    >
      <option value="pendiente">Pendiente</option>
      <option value="entregado">Entregado</option>
      <option value="cancelado">Cancelado</option>
    </select>
  );
}
