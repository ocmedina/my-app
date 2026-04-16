// src/components/StartingFloatModal.tsx
"use client";

import { useState } from "react";
import { FaCashRegister, FaTimes } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

interface StartingFloatModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
}

export default function StartingFloatModal({
  isOpen,
  onClose,
}: StartingFloatModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const floatAmount = parseFloat(amount);
    if (isNaN(floatAmount) || floatAmount < 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    setLoading(true);

    try {
      // Obtener fecha en zona horaria Argentina (UTC-3)
      const now = new Date();
      const argDate = new Date(
        now.toLocaleString("en-US", {
          timeZone: "America/Argentina/Buenos_Aires",
        })
      );
      const today = argDate.toISOString().split("T")[0];

      // Verificar si ya existe un fondo inicial para hoy
      const { data: existingMovement } = await supabase
        .from("cash_movements")
        .select("id")
        .eq("type", "fondo_inicial")
        .gte("created_at", `${today}T00:00:00-03:00`)
        .lte("created_at", `${today}T23:59:59.999-03:00`)
        .maybeSingle();

      if (existingMovement) {
        toast.error("Ya existe un fondo inicial registrado para hoy");
        setLoading(false);
        return;
      }

      // Obtener el usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Usuario no autenticado");
        setLoading(false);
        return;
      }

      // Registrar el fondo inicial con zona horaria Argentina
      const { error } = await supabase.from("cash_movements").insert({
        profile_id: user.id,
        type: "fondo_inicial",
        amount: floatAmount,
        description: "Fondo inicial del día",
        created_at: argDate.toISOString(),
      });

      if (error) throw error;

      toast.success(
        `✅ Fondo inicial de $${floatAmount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} registrado`
      );
      setAmount("");
      onClose();
    } catch (error: any) {
      console.error("Error registering starting float:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6 relative animate-slideDown">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-slate-300 transition-colors"
          disabled={loading}
          title="Cerrar"
          aria-label="Cerrar modal"
        >
          <FaTimes size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <FaCashRegister className="text-green-600 text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">
              Apertura de Caja
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {new Date().toLocaleDateString("es-AR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            💡 <strong>Fondo Inicial:</strong> Es el dinero en efectivo con el
            que se inicia el día en la caja registradora.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="startingFloat"
              className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2"
            >
              ¿Con cuánto dinero abre la caja hoy?
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 text-lg">
                $
              </span>
              <input
                id="startingFloat"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                autoFocus
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
              Ejemplo: billetes y monedas en la caja al iniciar
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !amount}
              className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : "Confirmar Apertura"}
            </button>
          </div>
        </form>

        <style jsx>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-slideDown {
            animation: slideDown 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}
