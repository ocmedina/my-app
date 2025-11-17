"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterSupplierPayment({
  supplierId,
  currentDebt,
}: {
  supplierId: string;
  currentDebt: number;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error("Ingresa un monto válido.");
      return;
    }
    setLoading(true);

    // Obtener timestamp en zona horaria Argentina
    const now = new Date();
    const argentinaTime = new Date(
      now.toLocaleString("en-US", {
        timeZone: "America/Argentina/Buenos_Aires",
      })
    );

    // 1. Registrar el pago
    const { error: paymentError } = await supabase
      .from("supplier_payments")
      .insert({
        supplier_id: supplierId,
        amount: paymentAmount,
        notes: comment || "Pago a cuenta",
        created_at: argentinaTime.toISOString(),
      });

    if (paymentError) {
      toast.error(`Error al registrar el pago: ${paymentError.message}`);
      setLoading(false);
      return;
    }

    // 2. Descontar el pago de la deuda del proveedor (usando la función RPC)
    const { error: debtError } = await supabase.rpc("increment_supplier_debt", {
      supplier_id_in: supplierId,
      amount_in: -paymentAmount, // Restamos el pago
    });

    if (debtError) {
      toast.error(`Error al actualizar la deuda: ${debtError.message}`);
    } else {
      toast.success("¡Pago registrado exitosamente!");
      setAmount("");
      setComment("");
      router.refresh(); // Recarga la página
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Registrar Pago a Proveedor</h2>
      <form
        onSubmit={handleRegisterPayment}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Monto Pagado
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            placeholder="0.00"
            required
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Comentario
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            placeholder="Ej: Pago factura #123"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? "Registrando..." : "Registrar Pago"}
        </button>
      </form>
    </div>
  );
}
