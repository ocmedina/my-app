// src/components/CashMovementModal.tsx (o puedes dejar LogExpenseModal.tsx y solo pegar el código)
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { FaTimes } from "react-icons/fa";

interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMovementLogged: () => void;
  type: "gasto" | "fondo_inicial"; // Aceptamos un tipo para saber qué registrar
}

export default function CashMovementModal({
  isOpen,
  onClose,
  onMovementLogged,
  type,
}: CashMovementModalProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const isExpense = type === "gasto";
  const title = isExpense
    ? "Registrar Gasto de Caja"
    : "Registrar Fondo Inicial";
  const amountLabel = isExpense ? "Monto del Gasto" : "Monto Inicial";
  const descriptionLabel = isExpense
    ? "Descripción del Gasto"
    : "Descripción (Opcional)";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const movementAmount = parseFloat(amount);
    if (!movementAmount || movementAmount <= 0) {
      toast.error("Por favor, ingresa un monto válido.");
      return;
    }
    if (isExpense && !description) {
      toast.error("La descripción es obligatoria para los gastos.");
      return;
    }
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const amountToInsert = isExpense ? -movementAmount : movementAmount; // Gastos son negativos, fondos iniciales positivos

    // Obtener timestamp en zona horaria Argentina
    const now = new Date();
    const argentinaTime = new Date(
      now.toLocaleString("en-US", {
        timeZone: "America/Argentina/Buenos_Aires",
      })
    );

    const { error } = await supabase.from("cash_movements").insert({
      profile_id: user?.id,
      type: type,
      amount: amountToInsert,
      description: description || `Fondo inicial del día`,
      created_at: argentinaTime.toISOString(),
    });

    if (error) {
      toast.error(`Error al registrar el movimiento: ${error.message}`);
    } else {
      toast.success(
        `'${isExpense ? "Gasto" : "Fondo inicial"}' registrado exitosamente.`
      );
      onMovementLogged();
      onClose();
      setAmount("");
      setDescription("");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-slideUp">
        {/* Header con gradiente */}
        <div
          className={`${
            isExpense
              ? "bg-gradient-to-r from-rose-500 to-pink-600"
              : "bg-gradient-to-r from-amber-500 to-yellow-600"
          } p-6 rounded-t-2xl`}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {isExpense ? "💸" : "💰"} {title}
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {amountLabel}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-lg font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {descriptionLabel}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required={isExpense}
              placeholder={isExpense ? "Ej: Compra de insumos" : "Opcional"}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-3 ${
                isExpense
                  ? "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
                  : "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
              } text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
            >
              {loading ? "Guardando..." : "Guardar Movimiento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
