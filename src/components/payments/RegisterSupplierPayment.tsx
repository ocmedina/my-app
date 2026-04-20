"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { registerSupplierPayment } from "@/app/actions/supplierActions";

export default function RegisterSupplierPayment({
  supplierId,
  currentDebt: _currentDebt,
}: {
  supplierId: string;
  currentDebt: number;
}) {
  const router = useRouter();
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

    try {
      const result = await registerSupplierPayment(
        supplierId,
        paymentAmount,
        comment || "Pago a cuenta"
      );

      if (!result.success) {
        throw new Error(result.error || "Error desconocido");
      }

      toast.success("¡Pago registrado exitosamente!");
      setAmount("");
      setComment("");
      router.refresh();
    } catch (error: unknown) {
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
            className="mt-1 block w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50"
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
            Comentario
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50"
            placeholder="Ej: Pago factura #123"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? "Registrando..." : "Registrar Pago"}
        </button>
      </form>
    </div>
  );
}

