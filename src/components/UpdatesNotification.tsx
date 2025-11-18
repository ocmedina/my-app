// src/components/UpdatesNotification.tsx
"use client";

import { useState, useEffect } from "react";
import { FaBell, FaTimes, FaCheckCircle, FaStar } from "react-icons/fa";

interface Update {
  id: string;
  date: string;
  title: string;
  description: string;
  icon?: string;
  isNew?: boolean;
}

const UPDATES: Update[] = [
  {
    id: "2025-11-18-pagos-pendientes",
    date: "18 Nov 2025",
    title: "💳 Registro de Pagos desde Pendientes",
    description:
      "Ahora puedes registrar pagos directamente desde las páginas de Ventas Pendientes y Pedidos Pendientes, incluso si el pedido ya fue entregado. Cada registro incluye botón 'Pagar' con modal intuitivo que actualiza automáticamente el saldo y registra el movimiento en el historial de pagos del cliente.",
    icon: "💳",
    isNew: true,
  },
  {
    id: "2025-11-18-deuda-completa",
    date: "18 Nov 2025",
    title: "📊 Sistema de Deuda Completo y Transparente",
    description:
      "Sistema de deuda completamente rediseñado: ahora muestra TODA la deuda sin restricciones. Incluye pedidos con cualquier método de pago (no solo fiado), ventas en cuenta corriente, clientes activos e inactivos. Tres páginas dedicadas: Deudores, Ventas Pendientes y Pedidos con Saldo Pendiente. Dashboard corregido con cálculos precisos.",
    icon: "📊",
    isNew: true,
  },
  {
    id: "2025-11-18-responsive-total",
    date: "18 Nov 2025",
    title: "📱 Diseño 100% Responsive",
    description:
      "Todas las páginas de gestión de deudas ahora son completamente responsive. En móviles se muestran tarjetas intuitivas con toda la información, en tablets vista optimizada y en desktop tablas completas. Headers, modales y estadísticas adaptados para cualquier dispositivo. Componente de registro de pagos rediseñado para mejor usabilidad en móviles.",
    icon: "📱",
    isNew: true,
  },
  {
    id: "2025-11-18-consumidor-final",
    date: "18 Nov 2025",
    title: "🧾 Remitos: Consumidor Final",
    description:
      "Los remitos ahora muestran 'Consumidor Final' en lugar de 'Minorista' para clientes minoristas, dando una presentación más profesional y acorde a términos fiscales. Aplicado tanto en remitos A4 como térmicos.",
    icon: "🧾",
    isNew: true,
  },
  {
    id: "2025-11-14-remitos-mejorados",
    date: "14 Nov 2025",
    title: "🧾 Remitos con Información Completa del Cliente",
    description:
      "Los remitos (A4 y térmicos) ahora incluyen información completa del cliente: dirección, referencia para entregas, teléfono y tipo de cliente. Diseño profesional rediseñado con mejor jerarquía visual, logo del negocio y secciones claramente delimitadas para facilitar las entregas.",
    icon: "🧾",
    isNew: false,
  },
  {
    id: "2025-11-13-fix-compras-precios",
    date: "13 Nov 2025",
    title: "🔧 Corrección: Creación de Productos en Compras",
    description:
      "Corregido error al crear productos desde nueva compra. Ahora permite ingresar precio minorista y mayorista por separado. Eliminados campos obsoletos (categoría en texto) y adaptado a la estructura correcta de la base de datos. Generación automática de SKU si no se proporciona.",
    icon: "🔧",
    isNew: false,
  },
  {
    id: "2025-11-13-fix-pedidos-metodo-pago",
    date: "13 Nov 2025",
    title: "🐛 Corrección: Método de Pago en Detalle de Pedido",
    description:
      "Solucionado problema donde el detalle del pedido mostraba siempre 'efectivo' independientemente del método de pago real. Ahora muestra correctamente: efectivo, transferencia, mixto o fiado con sus respectivos badges de colores.",
    icon: "🐛",
    isNew: false,
  },
  {
    id: "2025-11-13-filtros-stock",
    date: "13 Nov 2025",
    title: "📊 Filtros y Estadísticas de Stock en Productos",
    description:
      "Panel de estadísticas visuales con tarjetas clickeables para filtrar productos sin stock, stock bajo (1-10) y con stock (>10). Tabla mejorada mostrando precio mayorista, descripciones y badges coloridos según nivel de stock. Sistema completo de filtros con indicadores activos.",
    icon: "📊",
    isNew: false,
  },
  {
    id: "2025-11-13-pago-proveedores",
    date: "13 Nov 2025",
    title: "💰 Pago Directo a Proveedores desde Ventas",
    description:
      "Nueva funcionalidad que permite pagar directamente a proveedores desde una venta. El dinero de la venta se envía al proveedor para reducir su deuda. Soporta pagos mayores a la deuda (crédito a favor) y se registra automáticamente en el historial del proveedor.",
    icon: "💰",
    isNew: false,
  },
  {
    id: "2025-11-13-creditos-favor",
    date: "13 Nov 2025",
    title: "✅ Sistema de Créditos a Favor",
    description:
      "Los proveedores ahora pueden tener créditos a favor (deuda negativa) cuando se les paga más de lo que se les debe. Visualización mejorada con colores: rojo para deudas, verde para créditos a favor. Incluye filtro específico para ver proveedores con crédito.",
    icon: "✅",
    isNew: false,
  },
  {
    id: "2025-11-13-historial-pagos",
    date: "13 Nov 2025",
    title: "📋 Historial de Pagos a Proveedores",
    description:
      "Nueva tabla supplier_payments que registra todos los pagos realizados a proveedores. El historial en la gestión de proveedores ahora muestra tanto compras como pagos con notas descriptivas, fechas y montos diferenciados por colores.",
    icon: "📋",
    isNew: false,
  },
  {
    id: "2025-11-11-rediseno-completo",
    date: "11 Nov 2025",
    title: "🎨 Rediseño Completo de la Aplicación",
    description:
      "Renovación total del diseño con gradientes modernos, tarjetas con sombras, iconos coloridos, mejoras en la experiencia de usuario y una interfaz más intuitiva y profesional en todas las secciones.",
    icon: "🎨",
    isNew: false,
  },
  {
    id: "2025-11-11-atajos-teclado",
    date: "11 Nov 2025",
    title: "⌨️ Mejoras en Atajos de Teclado",
    description:
      "Corrección en la navegación con flechas (↑↓) en el buscador de productos (F10). Ahora el selector se mantiene visible y hace scroll automático al producto seleccionado.",
    icon: "⌨️",
    isNew: false,
  },
  {
    id: "2025-11-11-notificaciones",
    date: "11 Nov 2025",
    title: "🔔 Sistema de Notificaciones",
    description:
      "Nueva campanita flotante que te notifica sobre todas las actualizaciones y mejoras implementadas en FrontStock. ¡Nunca te pierdas una novedad!",
    icon: "🔔",
    isNew: false,
  },
  {
    id: "2025-11-11-graficos",
    date: "11 Nov 2025",
    title: "📊 Dashboard de Análisis Completo",
    description:
      "Nueva página de gráficos con 6 visualizaciones: evolución diaria, balance Local vs Reparto, métodos de pago, top productos, tendencia mensual y selector de rangos.",
    icon: "📊",
    isNew: false,
  },
  {
    id: "2025-11-11-balance",
    date: "11 Nov 2025",
    title: "⚖️ Balance Local vs Reparto",
    description:
      "Nuevo panel en el dashboard principal que muestra el balance entre ventas del local y ventas de reparto/pedidos con indicador de dominancia.",
    icon: "⚖️",
    isNew: false,
  },
  {
    id: "2025-11-11-busqueda",
    date: "11 Nov 2025",
    title: "🔍 Búsqueda de Clientes en Pedidos",
    description:
      "Barra de búsqueda en nuevo pedido para encontrar clientes rápidamente por nombre o tipo (mayorista/minorista).",
    icon: "🔍",
    isNew: false,
  },
  {
    id: "2025-11-11-fix-datepicker",
    date: "11 Nov 2025",
    title: "🐛 Corrección en Selector de Fechas",
    description:
      "Solucionado el problema donde el selector de fechas causaba que la página saltara hacia arriba al navegar entre fechas en ventas.",
    icon: "🐛",
    isNew: false,
  },
  {
    id: "2025-11-10-detalle-pedido",
    date: "10 Nov 2025",
    title: "📦 Mejora en Detalle de Pedido",
    description:
      "Rediseño completo del detalle de pedido con tarjetas informativas, tabla moderna y vista móvil optimizada.",
    icon: "📦",
    isNew: false,
  },
];

const STORAGE_KEY = "frontstock_seen_updates";

export default function UpdatesNotification() {
  const [isOpen, setIsOpen] = useState(false);
  const [seenUpdates, setSeenUpdates] = useState<string[]>([]);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);

  useEffect(() => {
    // Cargar actualizaciones vistas del localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const seen = JSON.parse(stored);
      setSeenUpdates(seen);

      // Verificar si hay actualizaciones nuevas no vistas
      const hasNew = UPDATES.some(
        (update) => update.isNew && !seen.includes(update.id)
      );
      setHasNewUpdates(hasNew);
    } else {
      // Si no hay nada guardado, todas las actualizaciones "new" son nuevas
      setHasNewUpdates(UPDATES.some((update) => update.isNew));
    }
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewUpdates(false);

    // Marcar todas las actualizaciones como vistas
    const allIds = UPDATES.map((u) => u.id);
    setSeenUpdates(allIds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
  };

  const handleClose = () => {
    setIsOpen(false);
  };

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
            {
              UPDATES.filter((u) => u.isNew && !seenUpdates.includes(u.id))
                .length
            }
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
                const isNewToUser =
                  update.isNew && !seenUpdates.includes(update.id);

                return (
                  <div
                    key={update.id}
                    className={`border-2 rounded-xl p-5 transition-all hover:shadow-md ${
                      isNewToUser
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icono */}
                      <div
                        className={`text-4xl flex-shrink-0 ${
                          isNewToUser ? "animate-bounce" : ""
                        }`}
                      >
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
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
              <p className="text-center text-sm text-gray-600">
                💡 <strong>Tip:</strong> Haz clic en la campanita en cualquier
                momento para ver las actualizaciones
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
