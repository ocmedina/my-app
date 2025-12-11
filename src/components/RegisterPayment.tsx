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

  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [mixedPayments, setMixedPayments] = useState([{ method: "efectivo", amount: "" }]);

  const handleAddMixedPayment = () => {
    setMixedPayments([...mixedPayments, { method: "efectivo", amount: "" }]);
  };

  const handleRemoveMixedPayment = (index: number) => {
    setMixedPayments(mixedPayments.filter((_, i) => i !== index));
  };

  const handleMixedPaymentChange = (index: number, field: "method" | "amount", value: string) => {
    const newPayments = [...mixedPayments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setMixedPayments(newPayments);
  };

  const getTotalMixedAmount = () => {
    return mixedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine total amount and methods to process
    let finalAmount = 0;
    let methodsToProcess: { method: string; amount: number }[] = [];

    if (paymentMethod === "mixto") {
      finalAmount = getTotalMixedAmount();

      // Validation for mixed payments
      if (finalAmount <= 0) {
        alert("El monto total debe ser mayor a 0.");
        return;
      }

      // Optional: Check if matches typed amount if we kept the main input, 
      // but usually the main input becomes read-only or validated against this sum.
      // For this implementation, let's use the sum as the source of truth.

      methodsToProcess = mixedPayments.map(p => ({
        method: p.method,
        amount: parseFloat(p.amount) || 0
      })).filter(p => p.amount > 0);

    } else {
      finalAmount = parseFloat(amount);
      if (!finalAmount || finalAmount <= 0) {
        alert("Por favor, ingresa un monto válido.");
        return;
      }
      methodsToProcess = [{ method: paymentMethod, amount: finalAmount }];
    }

    if (finalAmount > currentDebt + 0.01) { // Small tolerance for float math
      alert(
        `El monto ($${finalAmount.toFixed(2)}) no puede ser mayor a la deuda actual ($${currentDebt.toFixed(2)})`
      );
      return;
    }

    setLoading(true);

    try {
      const now = new Date();
      const argentinaTime = new Date(
        now.toLocaleString("en-US", {
          timeZone: "America/Argentina/Buenos_Aires",
        })
      );

      // 1. Fetch pending orders
      const { data: orders } = await supabase
        .from("orders")
        .select("id, amount_pending")
        .eq("customer_id", customerId)
        .gt("amount_pending", 0)
        .neq("status", "cancelado")
        .order("created_at", { ascending: true });

      // 2. Fetch pending sales (current account)
      const { data: sales } = await supabase
        .from("sales")
        .select("id, amount_pending")
        .eq("customer_id", customerId)
        .eq("payment_method", "cuenta_corriente")
        .eq("is_cancelled", false)
        .gt("amount_pending", 0)
        .order("created_at", { ascending: true });

      // 3. Distribute payment
      let remainingGlobalAmount = finalAmount;

      // We process the debt reduction globally first (order agnostic of payment method essentially, 
      // but strictly we should attribute. However, standard logic often just reduces debt.
      // To keep it simple and consistent with previous logic: reduce debt by total amount.)

      // Pay Orders
      if (orders && orders.length > 0) {
        for (const order of orders) {
          if (remainingGlobalAmount <= 0.01) break;

          const orderPending = order.amount_pending || 0;
          const paymentForOrder = Math.min(remainingGlobalAmount, orderPending);
          const newPending = orderPending - paymentForOrder;

          await supabase
            .from("orders")
            .update({ amount_pending: newPending })
            .eq("id", order.id);

          remainingGlobalAmount -= paymentForOrder;
        }
      }

      // Pay Sales
      if (sales && sales.length > 0 && remainingGlobalAmount > 0.01) {
        for (const sale of sales) {
          if (remainingGlobalAmount <= 0.01) break;

          const salePending = sale.amount_pending || 0;
          const paymentForSale = Math.min(remainingGlobalAmount, salePending);
          const newPending = salePending - paymentForSale;

          await supabase
            .from("sales")
            .update({ amount_pending: newPending })
            .eq("id", sale.id);

          remainingGlobalAmount -= paymentForSale;
        }
      }

      // 4. Register payments in 'payments' table
      // We insert one record per method used
      for (const p of methodsToProcess) {
        const { error: paymentError } = await supabase.from("payments").insert({
          customer_id: customerId,
          type: "pago",
          amount: p.amount,
          payment_method: p.method,
          comment: comment || (paymentMethod === "mixto" ? "Pago Mixto" : "Pago a cuenta"),
          created_at: argentinaTime.toISOString(),
        });
        if (paymentError) throw paymentError;
      }

      alert("¡Pago registrado exitosamente!");
      setAmount("");
      setComment("");
      setPaymentMethod("efectivo");
      setMixedPayments([{ method: "efectivo", amount: "" }]);

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (error: any) {
      console.error("Error al registrar pago:", error);
      alert(`Error al registrar el pago: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg">
      <form onSubmit={handleRegisterPayment} className="space-y-4">
        {paymentMethod !== "mixto" && (
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2"
            >
              Monto a Pagar
            </label>
            <input
              type="number"
              step="0.01"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full px-3 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
              placeholder="0.00"
              required={paymentMethod !== "mixto"}
            />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Deuda actual: ${currentDebt.toFixed(2)}
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="paymentMethod"
            className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2"
          >
            Método de Pago
          </label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              if (e.target.value === "mixto" && amount) {
                // Pre-fill first split with current amount if exists
                setMixedPayments([{ method: "efectivo", amount: amount }]);
              }
            }}
            className="block w-full px-3 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base bg-white dark:bg-slate-800"
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="mercado_pago">Mercado Pago</option>
            <option value="cheque">Cheque</option>
            <option value="mixto">Mixto</option>
            <option value="cuenta_corriente">Cuenta Corriente (Fiado)</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        {paymentMethod === "mixto" && (
          <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg space-y-3 border border-gray-200 dark:border-slate-700">
            <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Desglose del Pago</p>

            {mixedPayments.map((p, index) => (
              <div key={index} className="flex gap-2 items-center">
                <select
                  value={p.method}
                  onChange={(e) => handleMixedPaymentChange(index, "method", e.target.value)}
                  className="flex-1 px-2 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="mercado_pago">Mercado Pago</option>
                  <option value="cheque">Cheque</option>
                  <option value="otro">Otro</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={p.amount}
                  onChange={(e) => handleMixedPaymentChange(index, "amount", e.target.value)}
                  className="w-24 px-2 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
                  placeholder="$0.00"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveMixedPayment(index)}
                  className="text-red-500 hover:text-red-700 px-1"
                  disabled={mixedPayments.length <= 1}
                >
                  &times;
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddMixedPayment}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              + Agregar otro método
            </button>

            <div className="pt-2 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center text-sm font-bold">
              <span className="text-gray-700 dark:text-slate-300">Total:</span>
              <span className={getTotalMixedAmount() > currentDebt ? "text-red-500" : "text-green-600"}>
                ${getTotalMixedAmount().toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 text-right">
              Deuda actual: ${currentDebt.toFixed(2)}
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="comment"
            className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2"
          >
            Comentario (Opcional)
          </label>
          <input
            type="text"
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="block w-full px-3 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
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
