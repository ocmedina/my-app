// src/components/QuickActionsHeader.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import CashMovementModal from '@/components/CashMovementModal'
import { 
  HiOutlinePlusCircle, 
  HiOutlineUserGroup, 
  HiOutlineShoppingCart, 
  HiOutlineBanknotes,
  HiOutlineCurrencyDollar,
  HiOutlineArchiveBox
} from 'react-icons/hi2'

export default function QuickActionsHeader() {
  const [modalType, setModalType] = useState<'gasto' | 'fondo_inicial' | null>(null)

  const handleMovementLogged = () => {
    // Refrescar si es necesario
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link 
              href="/dashboard/ventas/nueva" 
              className="p-4 bg-gray-50 rounded-lg hover:bg-teal-50 transition-all group"
            >
              <HiOutlineBanknotes className="text-3xl text-gray-400 mx-auto group-hover:text-teal-500 transition-colors" />
              <p className="mt-2 text-sm font-medium text-gray-600 group-hover:text-teal-600 transition-colors text-center">
                Nueva Venta
              </p>
            </Link>

            <Link 
              href="/dashboard/pedidos/nuevo" 
              className="p-4 bg-gray-50 rounded-lg hover:bg-purple-50 transition-all group"
            >
              <HiOutlineShoppingCart className="text-3xl text-gray-400 mx-auto group-hover:text-purple-500 transition-colors" />
              <p className="mt-2 text-sm font-medium text-gray-600 group-hover:text-purple-600 transition-colors text-center">
                Nuevo Pedido
              </p>
            </Link>

            <Link 
              href="/dashboard/products/new" 
              className="p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-all group"
            >
              <HiOutlinePlusCircle className="text-3xl text-gray-400 mx-auto group-hover:text-blue-500 transition-colors" />
              <p className="mt-2 text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors text-center">
                Agregar Producto
              </p>
            </Link>

            <Link 
              href="/dashboard/clientes/new" 
              className="p-4 bg-gray-50 rounded-lg hover:bg-green-50 transition-all group"
            >
              <HiOutlineUserGroup className="text-3xl text-gray-400 mx-auto group-hover:text-green-500 transition-colors" />
              <p className="mt-2 text-sm font-medium text-gray-600 group-hover:text-green-600 transition-colors text-center">
                Agregar Cliente
              </p>
            </Link>

            <button 
              onClick={() => setModalType('fondo_inicial')} 
              className="p-4 bg-gray-50 rounded-lg hover:bg-yellow-50 transition-all group"
            >
              <HiOutlineArchiveBox className="text-3xl text-gray-400 mx-auto group-hover:text-yellow-500 transition-colors" />
              <p className="mt-2 text-sm font-medium text-gray-600 group-hover:text-yellow-600 transition-colors text-center">
                Fondo Inicial
              </p>
            </button>

            <button 
              onClick={() => setModalType('gasto')} 
              className="p-4 bg-gray-50 rounded-lg hover:bg-red-50 transition-all group"
            >
              <HiOutlineCurrencyDollar className="text-3xl text-gray-400 mx-auto group-hover:text-red-500 transition-colors" />
              <p className="mt-2 text-sm font-medium text-gray-600 group-hover:text-red-600 transition-colors text-center">
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
  )
}