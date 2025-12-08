// src/components/QuickActionsHeader.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import CashMovementModal from "@/components/CashMovementModal";
import {
  HiOutlinePlusCircle,
  HiOutlineUserGroup,
  HiOutlineShoppingCart,
  HiOutlineBanknotes,
  HiOutlineCurrencyDollar,
  HiOutlineArchiveBox,
} from "react-icons/hi2";

export default function QuickActionsHeader() {
  const [modalType, setModalType] = useState<"gasto" | "fondo_inicial" | null>(
    null
  );

  const handleMovementLogged = () => {
    // Refrescar si es necesario
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link
              href="/dashboard/ventas/nueva"
              className="relative p-5 bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl hover:shadow-md hover:scale-105 transition-all duration-200 group border border-teal-200/50"
            >
              <div className="bg-white dark:bg-slate-900 rounded-lg p-2 w-fit mx-auto shadow-sm">
                <HiOutlineBanknotes className="text-3xl text-teal-500" />
              </div>
              <p className="mt-3 text-sm font-semibold text-teal-700 text-center">
                Nueva Venta
              </p>
            </Link>

            <Link
              href="/dashboard/pedidos/nuevo"
              className="relative p-5 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl hover:shadow-md hover:scale-105 transition-all duration-200 group border border-purple-200/50"
            >
              <div className="bg-white dark:bg-slate-900 rounded-lg p-2 w-fit mx-auto shadow-sm">
                <HiOutlineShoppingCart className="text-3xl text-purple-500" />
              </div>
              <p className="mt-3 text-sm font-semibold text-purple-700 text-center">
                Nuevo Pedido
              </p>
            </Link>

            <Link
              href="/dashboard/products/new"
              className="relative p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl hover:shadow-md hover:scale-105 transition-all duration-200 group border border-blue-200/50"
            >
              <div className="bg-white dark:bg-slate-900 rounded-lg p-2 w-fit mx-auto shadow-sm">
                <HiOutlinePlusCircle className="text-3xl text-blue-500" />
              </div>
              <p className="mt-3 text-sm font-semibold text-blue-700 text-center">
                Agregar Producto
              </p>
            </Link>

            <Link
              href="/dashboard/clientes/new"
              className="relative p-5 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl hover:shadow-md hover:scale-105 transition-all duration-200 group border border-green-200/50"
            >
              <div className="bg-white dark:bg-slate-900 rounded-lg p-2 w-fit mx-auto shadow-sm">
                <HiOutlineUserGroup className="text-3xl text-green-500" />
              </div>
              <p className="mt-3 text-sm font-semibold text-green-700 text-center">
                Agregar Cliente
              </p>
            </Link>

            <button
              onClick={() => setModalType("fondo_inicial")}
              className="relative p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl hover:shadow-md hover:scale-105 transition-all duration-200 group border border-amber-200/50"
            >
              <div className="bg-white dark:bg-slate-900 rounded-lg p-2 w-fit mx-auto shadow-sm">
                <HiOutlineArchiveBox className="text-3xl text-amber-500" />
              </div>
              <p className="mt-3 text-sm font-semibold text-amber-700 text-center">
                Fondo Inicial
              </p>
            </button>

            <button
              onClick={() => setModalType("gasto")}
              className="relative p-5 bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl hover:shadow-md hover:scale-105 transition-all duration-200 group border border-rose-200/50"
            >
              <div className="bg-white dark:bg-slate-900 rounded-lg p-2 w-fit mx-auto shadow-sm">
                <HiOutlineCurrencyDollar className="text-3xl text-rose-500" />
              </div>
              <p className="mt-3 text-sm font-semibold text-rose-700 text-center">
                Registrar Gasto
              </p>
            </button>
          </div>
        </div>
      </div>

      {modalType && (
        <CashMovementModal
          isOpen={!!modalType}
          onClose={() => setModalType(null)}
          onMovementLogged={handleMovementLogged}
          type={modalType}
        />
      )}
    </>
  );
}
