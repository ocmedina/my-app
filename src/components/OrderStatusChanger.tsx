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

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", order.id);

    toast.dismiss(loadingToast);

    if (error) {
      toast.error("Error al actualizar el estado.");
    } else {
      toast.success(`Pedido actualizado a "${newStatus}".`);
      onStatusUpdate(); // <-- Llama a la función del padre para recargar la lista
    }
    setLoading(false);
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
