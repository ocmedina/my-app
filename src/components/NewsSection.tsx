"use client";

import { useState } from "react";
import { FaChevronDown, FaChevronUp, FaArrowRight } from "react-icons/fa";
import Link from "next/link";

export default function NewsSection() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg overflow-hidden">
      {/* Header - Siempre visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/10 dark:hover:bg-slate-900/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white dark:bg-slate-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-xl">🚀</span>
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">
              Actualizaciones en desarrollo
            </h3>
            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
              NUEVO
            </span>
          </div>
        </div>
        <div className="text-white">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </div>
      </button>

      {/* Contenido - Colapsable */}
      {isExpanded && (
        <div className="px-6 pb-6 text-white">
          <p className="text-sm text-blue-50 mb-4">
            Próximamente: Sistema completo de gestión de órdenes de compra a
            proveedores
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-white/20 dark:bg-slate-900/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📦</span>
                <p className="font-semibold text-sm text-white">Gestión de Órdenes</p>
              </div>
              <p className="text-xs text-blue-50">
                Crea, edita y gestiona órdenes de compra con seguimiento de
                estados (Borrador → Enviada → Recibida)
              </p>
            </div>
            <div className="bg-white/20 dark:bg-slate-900/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📊</span>
                <p className="font-semibold text-sm text-white">Stock Automático</p>
              </div>
              <p className="text-xs text-blue-50">
                Al recibir una orden, el inventario se actualiza automáticamente
                y se registra en el Kardex
              </p>
            </div>
            <div className="bg-white/20 dark:bg-slate-900/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📱</span>
                <p className="font-semibold text-sm text-white">Envío por WhatsApp</p>
              </div>
              <p className="text-xs text-blue-50">
                Envía las órdenes directamente a tus proveedores por WhatsApp
                con un solo clic
              </p>
            </div>
          </div>

          {/* Botón para ver más detalles */}
          <Link
            href="/dashboard/compras/generar"
            className="w-full bg-white/20 dark:bg-slate-900/20 hover:bg-white/30 text-white font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 backdrop-blur-sm border border-white/30"
          >
            Ver detalles del desarrollo <FaArrowRight className="text-sm" />
          </Link>
        </div>
      )}
    </div>
  );
}
