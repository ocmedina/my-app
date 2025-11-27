"use client";

import { useState, useEffect } from 'react';
import { isChristmasThemeActive } from '@/lib/theme-scheduler';

/**
 * Hook personalizado para detectar si el tema navideño está activo
 */
export function useChristmasTheme() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Verificar inicialmente
    setIsActive(isChristmasThemeActive());

    // Verificar cada minuto
    const interval = setInterval(() => {
      const newState = isChristmasThemeActive();
      if (newState !== isActive) {
        setIsActive(newState);
        // Recargar la página cuando cambie el estado para aplicar todos los estilos
        window.location.reload();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isActive]);

  return isActive;
}

/**
 * Función helper para obtener clases CSS condicionales según el tema
 */
export function getThemeClasses(
  defaultClasses: string,
  christmasClasses: string
): string {
  if (typeof window === 'undefined') {
    return defaultClasses;
  }
  
  return isChristmasThemeActive() ? christmasClasses : defaultClasses;
}
