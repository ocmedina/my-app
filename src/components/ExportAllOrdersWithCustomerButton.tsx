"use client";

import toast from "react-hot-toast";
import { FaFileExcel } from "react-icons/fa";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient.js";

type CustomerRow = {
  id: string;
  full_name: string | null;
};

type OrderRow = {
  id: string;
  created_at: string;
  customer_id: string;
  amount_pending: number | null;
  payment_method: string | null;
  status: string | null;
};

export default function ExportAllOrdersWithCustomerButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const XLSX = await import("xlsx");

      // 1. Obtener todos los clientes (activos e inactivos)
      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("id, full_name");
      if (customersError) throw customersError;
      const customerMap = Object.fromEntries(
        ((customers || []) as CustomerRow[]).map((c: CustomerRow) => [c.id, c.full_name])
      );

      // 2. Obtener todos los pedidos
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, created_at, customer_id, amount_pending, payment_method, status")
        .order("created_at", { ascending: true });
      if (ordersError) throw ordersError;
      if (!orders || orders.length === 0) {
        toast.error("No hay pedidos para exportar");
        setLoading(false);
        return;
      }

      // 3. Formatear filas para exportar
      const rows = ((orders || []) as OrderRow[]).map((order: OrderRow) => {
        let nombreCliente = customerMap[order.customer_id];
        if (!nombreCliente || typeof nombreCliente !== "string" || !nombreCliente.trim()) {
          nombreCliente = "Sin nombre";
        }
        return {
          "ID Pedido": order.id,
          "Nombre del Cliente": nombreCliente,
          Fecha: new Date(order.created_at).toLocaleString("es-AR"),
          "Monto Pendiente": Number(order.amount_pending ?? 0),
          "Método de Pago": order.payment_method || "No especificado",
          Estado: order.status,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows, {
        header: [
          "ID Pedido",
          "Nombre del Cliente",
          "Fecha",
          "Monto Pendiente",
          "Método de Pago",
          "Estado",
        ],
      });
      worksheet["!cols"] = [
        { wch: 18 },
        { wch: 30 },
        { wch: 22 },
        { wch: 16 },
        { wch: 20 },
        { wch: 14 },
      ];
      const exportDate = new Date().toISOString().split("T")[0];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");
      XLSX.writeFile(workbook, `pedidos_con_clientes_${exportDate}.xlsx`);
      toast.success("Pedidos exportados correctamente");
    } catch (error: any) {
      console.error(error);
      toast.error("No se pudo exportar los pedidos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-lg hover:from-emerald-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all font-semibold flex items-center gap-2"
    >
      <FaFileExcel /> {loading ? "Exportando..." : "Exportar pedidos con clientes"}
    </button>
  );
}
