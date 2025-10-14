// src/components/QuickActions.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import CashMovementModal from '@/components/CashMovementModal' // Asegúrate de que el nombre coincida
import { 
  HiOutlinePlusCircle, 
  HiOutlineUserGroup, 
  HiOutlineShoppingCart, 
  HiOutlineBanknotes,
  HiOutlineCurrencyDollar,
  HiOutlineArchiveBox // Nuevo ícono para Fondo Inicial
} from 'react-icons/hi2';

export default function QuickActions() {
  const [modalType, setModalType] = useState<'gasto' | 'fondo_inicial' | null>(null);

  const handleMovementLogged = () => {
    // Aquí podríamos refrescar los datos del dashboard si fuera necesario
    // Por ejemplo: router.refresh();
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
          <Link href="/dashboard/ventas/nueva" className="p-4 bg-gray-50 rounded-lg hover:bg-teal-50 hover:shadow-sm transition-all group">
              <HiOutlineBanknotes className="text-3xl text-gray-400 mx-auto group-hover:text-teal-500 transition-colors" />
              <p className="mt-2 text-sm font-medium text-gray-600 group-hover:text-teal-600 transition-colors">Nueva Venta</p>
          </Link>
          <Link href="/dashboard/pedidos/nuevo" className="p-4 bg-gray-50 rounded-lg hover:bg-purple-50 hover:shadow-sm transition-all group">
              <HiOutlineShoppingCart className="text-3xl text-gray-400 mx-auto group-hover:text-purple-500 transition-colors" />
              <p className="mt-2 text-sm font-medium text-gray-600 group-hover:text-purple-600 transition-colors">Nuevo Pedido</p>
          </Link>
          <Link href="/dashboard/products/new" className="p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:shadow-sm transition-all group">
              <HiOutlinePlusCircle className="text-3xl text-gray-400 mx-auto group-hover:text-blue-500 transition-colors" />
              <p className="mt-2 text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">Agregar Producto</p>
          </Link>
          <Link href="/dashboard/clientes/new" className="p-4 bg-gray-50 rounded-lg hover:bg-green-50 hover:shadow-sm transition-all group">
              <HiOutlineUserGroup className="text-3xl text-gray-400 mx-auto group-hover:text-green-500 transition-colors" />
              <p className="mt-2 text-sm font-medium text-gray-600 group-hover:text-green-600 transition-colors">Agregar Cliente</p>
          </Link>
          
          {/* Botón para Fondo Inicial */}
          <button onClick={() => setModalType('fondo_inicial')} className="p-4 bg-gray-50 rounded-lg hover:bg-yellow-50 hover:shadow-sm transition-all group">
              <HiOutlineArchiveBox className="text-3xl text-gray-400 mx-auto group-hover:text-yellow-500 transition-colors" />
              <p className="mt-2 text-sm font-medium text-gray-600 group-hover:text-yellow-600 transition-colors">Fondo Inicial</p>
          </button>
          
          {/* Botón para Registrar Gasto */}
          <button onClick={() => setModalType('gasto')} className="p-4 bg-gray-50 rounded-lg hover:bg-red-50 hover:shadow-sm transition-all group">
              <HiOutlineCurrencyDollar className="text-3xl text-gray-400 mx-auto group-hover:text-red-500 transition-colors" />
              <p className="mt-2 text-sm font-medium text-gray-600 group-hover:text-red-600 transition-colors">Registrar Gasto</p>
          </button>
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