// src/components/UpdatesNotification.tsx
'use client'

import { useState, useEffect } from 'react'
import { FaBell, FaTimes, FaCheckCircle, FaStar } from 'react-icons/fa'

interface Update {
  id: string
  date: string
  title: string
  description: string
  icon?: string
  isNew?: boolean
}

const UPDATES: Update[] = [
  {
    id: '2025-11-11-rediseno-completo',
    date: '11 Nov 2025',
    title: '🎨 Rediseño Completo de la Aplicación',
    description: 'Renovación total del diseño con gradientes modernos, tarjetas con sombras, iconos coloridos, mejoras en la experiencia de usuario y una interfaz más intuitiva y profesional en todas las secciones.',
    icon: '🎨',
    isNew: true
  },
  {
    id: '2025-11-11-atajos-teclado',
    date: '11 Nov 2025',
    title: '⌨️ Mejoras en Atajos de Teclado',
    description: 'Corrección en la navegación con flechas (↑↓) en el buscador de productos (F10). Ahora el selector se mantiene visible y hace scroll automático al producto seleccionado.',
    icon: '⌨️',
    isNew: true
  },
  {
    id: '2025-11-11-notificaciones',
    date: '11 Nov 2025',
    title: '🔔 Sistema de Notificaciones',
    description: 'Nueva campanita flotante que te notifica sobre todas las actualizaciones y mejoras implementadas en FrontStock. ¡Nunca te pierdas una novedad!',
    icon: '🔔',
    isNew: true
  },
  {
    id: '2025-11-11-graficos',
    date: '11 Nov 2025',
    title: '� Dashboard de Análisis Completo',
    description: 'Nueva página de gráficos con 6 visualizaciones: evolución diaria, balance Local vs Reparto, métodos de pago, top productos, tendencia mensual y selector de rangos.',
    icon: '📊',
    isNew: true
  },
  {
    id: '2025-11-11-balance',
    date: '11 Nov 2025',
    title: '⚖️ Balance Local vs Reparto',
    description: 'Nuevo panel en el dashboard principal que muestra el balance entre ventas del local y ventas de reparto/pedidos con indicador de dominancia.',
    icon: '⚖️',
    isNew: true
  },
  {
    id: '2025-11-11-busqueda',
    date: '11 Nov 2025',
    title: '🔍 Búsqueda de Clientes en Pedidos',
    description: 'Barra de búsqueda en nuevo pedido para encontrar clientes rápidamente por nombre o tipo (mayorista/minorista).',
    icon: '🔍',
    isNew: true
  },
  {
    id: '2025-11-11-fix-datepicker',
    date: '11 Nov 2025',
    title: '🐛 Corrección en Selector de Fechas',
    description: 'Solucionado el problema donde el selector de fechas causaba que la página saltara hacia arriba al navegar entre fechas en ventas.',
    icon: '🐛',
    isNew: true
  },
  {
    id: '2025-11-10-detalle-pedido',
    date: '10 Nov 2025',
    title: '📦 Mejora en Detalle de Pedido',
    description: 'Rediseño completo del detalle de pedido con tarjetas informativas, tabla moderna y vista móvil optimizada.',
    icon: '📦',
    isNew: false
  },
]

const STORAGE_KEY = 'frontstock_seen_updates'

export default function UpdatesNotification() {
  const [isOpen, setIsOpen] = useState(false)
  const [seenUpdates, setSeenUpdates] = useState<string[]>([])
  const [hasNewUpdates, setHasNewUpdates] = useState(false)

  useEffect(() => {
    // Cargar actualizaciones vistas del localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const seen = JSON.parse(stored)
      setSeenUpdates(seen)
      
      // Verificar si hay actualizaciones nuevas no vistas
      const hasNew = UPDATES.some(update => update.isNew && !seen.includes(update.id))
      setHasNewUpdates(hasNew)
    } else {
      // Si no hay nada guardado, todas las actualizaciones "new" son nuevas
      setHasNewUpdates(UPDATES.some(update => update.isNew))
    }
  }, [])

  const handleOpen = () => {
    setIsOpen(true)
    setHasNewUpdates(false)
    
    // Marcar todas las actualizaciones como vistas
    const allIds = UPDATES.map(u => u.id)
    setSeenUpdates(allIds)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds))
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Botón flotante de la campanita */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 z-50 group"
        aria-label="Ver actualizaciones"
      >
        <FaBell className="w-6 h-6" />
        
        {/* Badge de notificación */}
        {hasNewUpdates && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold animate-pulse">
            {UPDATES.filter(u => u.isNew && !seenUpdates.includes(u.id)).length}
          </span>
        )}

        {/* Tooltip */}
        <span className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          ¿Qué hay de nuevo? 🎉
        </span>
      </button>

      {/* Modal de actualizaciones */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaStar className="w-6 h-6 text-yellow-300" />
                <div>
                  <h2 className="text-2xl font-bold">¿Qué hay de nuevo?</h2>
                  <p className="text-blue-100 text-sm">
                    Últimas actualizaciones de FrontStock
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="bg-white hover:bg-gray-100 p-2 rounded-lg transition-all"
                aria-label="Cerrar"
              >
                <FaTimes className="w-5 h-5 text-blue-600" />
              </button>
            </div>

            {/* Lista de actualizaciones */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {UPDATES.map((update) => {
                const isNewToUser = update.isNew && !seenUpdates.includes(update.id)
                
                return (
                  <div
                    key={update.id}
                    className={`border-2 rounded-xl p-5 transition-all hover:shadow-md ${
                      isNewToUser
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icono */}
                      <div className={`text-4xl flex-shrink-0 ${isNewToUser ? 'animate-bounce' : ''}`}>
                        {update.icon}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">
                            {update.title}
                          </h3>
                          {isNewToUser && (
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                              NUEVO
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                          {update.description}
                        </p>
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                          <FaCheckCircle className="text-green-500" />
                          {update.date}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
              <p className="text-center text-sm text-gray-600">
                💡 <strong>Tip:</strong> Haz clic en la campanita en cualquier momento para ver las actualizaciones
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
