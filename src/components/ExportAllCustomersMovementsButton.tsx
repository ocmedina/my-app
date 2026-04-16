"use client";

import toast from "react-hot-toast";
import { FaFileExcel } from "react-icons/fa";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient.js";

type CustomerRow = {
  id: string;
  full_name: string | null;
};

type PaymentRow = {
  id: number;
  amount: number;
  created_at: string;
  type: string;
  payment_method: string | null;
  comment: string | null;
  customer_id: string;
};

export default function ExportAllCustomersMovementsButton() {
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

      // 2. Obtener todos los pagos de todos los clientes
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("id, amount, created_at, type, payment_method, comment, customer_id")
        .order("created_at", { ascending: true });
      if (paymentsError) throw paymentsError;

      // 3. Unir pagos con nombre de cliente (si no existe, poner "Sin nombre")
      const rows = ((payments || []) as PaymentRow[]).map((movement: PaymentRow) => {
        const isPurchase = movement.type === "compra";
        const isCancelled = movement.payment_method === "anulado";
        const movementType = isPurchase ? "Compra a credito" : "Pago recibido";
        const stateText = isCancelled ? " (Anulado)" : "";
        const methodText = movement.payment_method || "No especificado";
        const commentText = movement.comment ? ` - ${movement.comment}` : "";
        let nombreCliente = customerMap[movement.customer_id];
        if (!nombreCliente || typeof nombreCliente !== "string" || !nombreCliente.trim()) {
          nombreCliente = "Sin nombre";
        }
        return {
          "DNI o CUIT (Opcional si hay nombre)": "",
          "Nombre del Cliente": nombreCliente,
          Fecha: new Date(movement.created_at).toLocaleString("es-AR"),
          "Tipo de Movimiento": `${movementType}${stateText}`,
          Monto: Number(Math.abs(movement.amount).toFixed(2)),
          "Descripción": `Metodo: ${methodText}${commentText}`,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows, {
        header: [
          "DNI o CUIT (Opcional si hay nombre)",
          "Nombre del Cliente",
          "Fecha",
          "Tipo de Movimiento",
          "Monto",
          "Descripción",
        ],
      });
      worksheet["!cols"] = [
        { wch: 34 },
        { wch: 30 },
        { wch: 22 },
        { wch: 22 },
        { wch: 12 },
        { wch: 40 },
      ];
      const exportDate = new Date().toISOString().split("T")[0];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "HistorialClientes");
      XLSX.writeFile(workbook, `historial_todos_los_clientes_${exportDate}.xlsx`);
      toast.success("Historial de todos los clientes exportado correctamente");
    } catch (error: any) {
      console.error(error);
      toast.error("No se pudo exportar el historial");
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
      <FaFileExcel /> {loading ? "Exportando..." : "Exportar historial de todos"}
    </button>
  );
}
