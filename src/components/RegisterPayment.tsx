// src/components/RegisterPayment.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface RegisterPaymentProps {
  customerId: string;
  currentDebt: number;
}

export default function RegisterPayment({
  customerId,
  currentDebt,
}: RegisterPaymentProps) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);

    if (!paymentAmount || paymentAmount <= 0) {
      alert("Por favor, ingresa un monto válido.");
      return;
    }

    if (paymentAmount > currentDebt) {
      alert(
        `El monto no puede ser mayor a la deuda actual ($${currentDebt.toFixed(
          2
        )})`
      );
      return;
    }

    setLoading(true);

    try {
      // Obtener timestamp en zona horaria Argentina
      const now = new Date();
      const argentinaTime = new Date(
        now.toLocaleString("en-US", {
          timeZone: "America/Argentina/Buenos_Aires",
        })
      );

      // 1. Obtener pedidos fiados pendientes del cliente
      const { data: orders } = await supabase
        .from("orders")
        .select("id, amount_pending")
        .eq("customer_id", customerId)
        .eq("payment_method", "fiado")
        .not("status", "eq", "cancelado")
        .gt("amount_pending", 0)
        .order("created_at", { ascending: true }); // Más antiguos primero

      // 2. Obtener ventas en cuenta corriente pendientes
      const { data: sales } = await supabase
        .from("sales")
        .select("id, amount_pending")
        .eq("customer_id", customerId)
        .eq("payment_method", "cuenta_corriente")
        .gt("amount_pending", 0)
        .order("created_at", { ascending: true });

      // 3. Distribuir el pago entre pedidos y ventas
      let remainingAmount = paymentAmount;

      // Primero pagar pedidos fiados
      if (orders && orders.length > 0) {
        for (const order of orders) {
          if (remainingAmount <= 0) break;

          const orderPending = order.amount_pending || 0;
          const paymentForOrder = Math.min(remainingAmount, orderPending);
          const newPending = orderPending - paymentForOrder;

          await supabase
            .from("orders")
            .update({ amount_pending: newPending })
            .eq("id", order.id);

          remainingAmount -= paymentForOrder;
        }
      }

      // Luego pagar ventas en cuenta corriente si queda saldo
      if (sales && sales.length > 0 && remainingAmount > 0) {
        for (const sale of sales) {
          if (remainingAmount <= 0) break;

          const salePending = sale.amount_pending || 0;
          const paymentForSale = Math.min(remainingAmount, salePending);
          const newPending = salePending - paymentForSale;

          await supabase
            .from("sales")
            .update({ amount_pending: newPending })
            .eq("id", sale.id);

          remainingAmount -= paymentForSale;
        }
      }

      // 4. Registrar el movimiento en la tabla 'payments'
      const { error: paymentError } = await supabase.from("payments").insert({
        customer_id: customerId,
        type: "pago",
        amount: paymentAmount,
        comment: comment || "Pago a cuenta",
        created_at: argentinaTime.toISOString(),
      });

      if (paymentError) throw paymentError;

      alert("¡Pago registrado exitosamente!");
      setAmount("");
      setComment("");
      router.refresh(); // Recarga la página para mostrar los datos actualizados
    } catch (error: any) {
      console.error("Error al registrar pago:", error);
      alert(`Error al registrar el pago: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">Registrar un Pago</h2>
      <form
        onSubmit={handleRegisterPayment}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
      >
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700"
          >
            Monto a Pagar
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            placeholder="0.00"
            required
          />
        </div>
        <div className="md:col-span-1">
          <label
            htmlFor="comment"
            className="block text-sm font-medium text-gray-700"
          >
            Comentario (Opcional)
          </label>
          <input
            type="text"
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            placeholder="Ej: Entrega semanal"
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
