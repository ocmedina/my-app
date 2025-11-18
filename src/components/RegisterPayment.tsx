// src/components/RegisterPayment.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface RegisterPaymentProps {
  customerId: string;
  currentDebt: number;
  onSuccess?: () => void;
}

export default function RegisterPayment({
  customerId,
  currentDebt,
  onSuccess,
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

      // 1. Obtener pedidos pendientes del cliente (cualquier método de pago)
      const { data: orders } = await supabase
        .from("orders")
        .select("id, amount_pending")
        .eq("customer_id", customerId)
        .gt("amount_pending", 0)
        .neq("status", "cancelado")
        .order("created_at", { ascending: true }); // Más antiguos primero

      // 2. Obtener ventas en cuenta corriente pendientes
      const { data: sales } = await supabase
        .from("sales")
        .select("id, amount_pending")
        .eq("customer_id", customerId)
        .eq("payment_method", "cuenta_corriente")
        .eq("is_cancelled", false)
        .gt("amount_pending", 0)
        .order("created_at", { ascending: true });

      // 3. Distribuir el pago entre pedidos y ventas
      let remainingAmount = paymentAmount;

      // Primero pagar pedidos pendientes (cualquier método de pago)
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
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh(); // Recarga la página para mostrar los datos actualizados
      }
    } catch (error: any) {
      console.error("Error al registrar pago:", error);
      alert(`Error al registrar el pago: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <form
        onSubmit={handleRegisterPayment}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Monto a Pagar
          </label>
          <input
            type="number"
            step="0.01"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full px-3 py-2 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
            placeholder="0.00"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Deuda actual: ${currentDebt.toFixed(2)}
          </p>
        </div>
        <div>
          <label
            htmlFor="comment"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Comentario (Opcional)
          </label>
          <input
            type="text"
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="block w-full px-3 py-2 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
            placeholder="Ej: Entrega semanal"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 shadow-lg transition-all text-base"
        >
          {loading ? "Registrando..." : "Registrar Pago"}
        </button>
      </form>
    </div>
  );
}
