// src/lib/theme-scheduler.ts
// Sistema de activación automática del tema navideño

export interface ThemeSchedule {
  startDate: Date;
  endDate: Date;
  themeName: string;
}

// Configuración de fechas para el tema navideño
export const christmasSchedule: ThemeSchedule = {
  // Inicia el 20 de diciembre de 2025
  startDate: new Date('2025-12-20T00:00:00-03:00'),
  // Termina el 6 de enero de 2026 (Día de Reyes)
  endDate: new Date('2026-01-06T23:59:59-03:00'),
  themeName: 'christmas'
};

/**
 * Verifica si el tema navideño debe estar activo
 */
export function isChristmasThemeActive(): boolean {
  const now = new Date();
  return now >= christmasSchedule.startDate && now <= christmasSchedule.endDate;
}

/**
 * Obtiene el tiempo restante hasta que se active el tema navideño
 */
export function getTimeUntilChristmas(): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isActive: boolean;
} {
  const now = new Date();
  const start = christmasSchedule.startDate;
  
  if (now >= start) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isActive: true
    };
  }
  
  const diff = start.getTime() - now.getTime();
  
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    isActive: false
  };
}

/**
 * Obtiene el tiempo restante hasta que termine el tema navideño
 */
export function getTimeUntilChristmasEnds(): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const end = christmasSchedule.endDate;
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000)
  };
}
