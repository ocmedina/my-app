"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type SupplierPaymentInsertResult = {
  id: number | string;
};

const DEFAULT_PAYMENT_METHOD = "efectivo";

const isRpcMissingError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const message = String((error as { message?: string }).message || "").toLowerCase();
  const details = String((error as { details?: string }).details || "").toLowerCase();
  return (
    message.includes("increment_supplier_debt") ||
    details.includes("increment_supplier_debt") ||
    message.includes("function")
  );
};

export default function RegisterSupplierPayment({
  supplierId,
  currentDebt,
}: {
  supplierId: string;
  currentDebt: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const updateSupplierDebt = async (paymentAmount: number) => {
    const { error: debtError } = await supabase.rpc("increment_supplier_debt", {
      supplier_id_in: supplierId,
      amount_in: -paymentAmount,
    });

    if (!debtError) return;

    if (!isRpcMissingError(debtError)) {
      throw debtError;
    }

    // Fallback para bases que aun no tienen el RPC increment_supplier_debt.
    const { data: supplierData, error: supplierError } = await supabase
      .from("suppliers")
      .select("debt")
      .eq("id", supplierId)
      .single();

    if (supplierError) {
      throw supplierError;
    }

    const liveDebt = Number(supplierData?.debt || currentDebt || 0);
    const { error: updateError } = await supabase
      .from("suppliers")
      .update({ debt: liveDebt - paymentAmount })
      .eq("id", supplierId);

    if (updateError) {
      throw updateError;
    }
  };

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

    let insertedPaymentId: number | string | null = null;

    try {
      // 1. Registrar el pago (payment_method es obligatorio en varias instalaciones).
      const { data: paymentData, error: paymentError } = await supabase
        .from("supplier_payments")
        .insert({
          supplier_id: supplierId,
          amount: paymentAmount,
          payment_method: DEFAULT_PAYMENT_METHOD,
          notes: comment || "Pago a cuenta",
          created_at: argentinaTime.toISOString(),
        })
        .select("id")
        .single();

      if (paymentError || !paymentData) {
        throw paymentError || new Error("No se pudo registrar el pago");
      }

      insertedPaymentId = (paymentData as SupplierPaymentInsertResult).id;

      // 2. Descontar el pago de la deuda del proveedor.
      await updateSupplierDebt(paymentAmount);

      toast.success("¡Pago registrado exitosamente!");
      setAmount("");
      setComment("");
      router.refresh(); // Recarga la página

    } catch (error: unknown) {
      // Si falla el paso 2, intentamos deshacer el pago para no dejar datos inconsistentes.
      if (insertedPaymentId !== null) {
        await supabase.from("supplier_payments").delete().eq("id", insertedPaymentId);
      }

      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error(`Error al registrar el pago: ${errorMessage}`);
    }

    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Registrar Pago a Proveedor</h2>
      <form
        onSubmit={handleRegisterPayment}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
            Monto Pagado
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md"
            placeholder="0.00"
            required
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
            Comentario
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md"
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
