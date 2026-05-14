"use client";

import { useState, useEffect } from "react";
import { FaTools, FaTimes } from "react-icons/fa";

// Cambiá este ID cuando empiece un nuevo período de mantenimiento.
// Al cambiar el ID, el banner vuelve a aparecer para todos los usuarios
// aunque lo hayan cerrado antes.
const MAINTENANCE_ID = "mantenimiento-2026-05-14";

export default function MaintenanceBanner() {
  const [visible, setVisible] = useState(false); // false hasta confirmar con localStorage

  useEffect(() => {
    // Solo mostrarlo si el usuario NO lo cerró para este mantenimiento
    const dismissed = localStorage.getItem("maintenance-banner-dismissed");
    if (dismissed !== MAINTENANCE_ID) {
      setVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("maintenance-banner-dismissed", MAINTENANCE_ID);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative z-50 w-full bg-amber-500 dark:bg-amber-600 text-white shrink-0">
      <div className="px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FaTools className="flex-shrink-0 animate-pulse" />
          <span>
            🔧 <strong>Mantenimiento en curso (varios días)</strong> — El sistema está
            operativo con normalidad. Podés seguir usándolo sin problema.
          </span>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors"
          aria-label="Cerrar aviso"
        >
          <FaTimes size={14} />
        </button>
      </div>
    </div>
  );
}
