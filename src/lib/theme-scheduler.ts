// src/lib/theme-scheduler.ts
/**
 * Theme Scheduler Module
 * 
 * Provides automated theme activation based on date ranges.
 * Currently supports Christmas theme with configurable date boundaries.
 * 
 * @module theme-scheduler
 */

export interface ThemeSchedule {
  readonly startDate: Date;
  readonly endDate: Date;
  readonly themeName: string;
}

interface TimeRemaining {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly isActive: boolean;
}

// Christmas theme configuration
export const christmasSchedule: Readonly<ThemeSchedule> = {
  startDate: new Date('2025-12-20T00:00:00-03:00'),
  endDate: new Date('2026-01-06T23:59:59-03:00'),
  themeName: 'christmas'
} as const;

/**
 * Checks if the Christmas theme should be currently active
 * based on the configured date range.
 * 
 * @returns {boolean} True if current date is within theme period
 */
export function isChristmasThemeActive(): boolean {
  const now = new Date();
  return now >= christmasSchedule.startDate && now <= christmasSchedule.endDate;
}

/**
 * Calculates time remaining until Christmas theme activation.
 * Returns zero values if theme is already active.
 * 
 * @returns {TimeRemaining} Object containing remaining time breakdown
 */
export function getTimeUntilChristmas(): TimeRemaining {
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
 * Calculates time remaining until Christmas theme deactivation.
 * Returns zero values if theme period has ended.
 * 
 * @returns {Omit<TimeRemaining, 'isActive'>} Object containing remaining time breakdown
 */
export function getTimeUntilChristmasEnds(): Omit<TimeRemaining, 'isActive'> {
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
