"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { isChristmasThemeActive } from "@/lib/theme-scheduler";
import ChristmasDecorations from "./ChristmasDecorations";

interface ConditionalChristmasDecorationsProps {
  density?: "light" | "medium" | "heavy";
  showSnow?: boolean;
  showLights?: boolean;
  showFloating?: boolean;
  checkInterval?: number;
}

const DEFAULT_CHECK_INTERVAL = 60000; // 1 minute

/**
 * Conditional wrapper component that renders Christmas decorations
 * only when the theme is active based on the configured schedule.
 *
 * Uses memoization to prevent unnecessary re-renders and implements
 * a configurable interval check for theme activation status.
 *
 * @component
 * @example
 * ```tsx
 * <ConditionalChristmasDecorations
 *   density="heavy"
 *   showSnow={true}
 *   checkInterval={30000}
 * />
 * ```
 */
export default function ConditionalChristmasDecorations({
  density = "heavy",
  showSnow = true,
  showLights = true,
  showFloating = false,
  checkInterval = DEFAULT_CHECK_INTERVAL,
}: ConditionalChristmasDecorationsProps) {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const checkThemeStatus = useCallback(() => {
    setIsActive(isChristmasThemeActive());
  }, []);

  useEffect(() => {
    setIsMounted(true);
    checkThemeStatus();

    const intervalId = setInterval(checkThemeStatus, checkInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [checkInterval, checkThemeStatus]);

  const decorationProps = useMemo(
    () => ({
      density,
      showSnow,
      showLights,
      showFloating,
    }),
    [density, showSnow, showLights, showFloating]
  );

  // Prevent hydration mismatch
  if (!isMounted || !isActive) {
    return null;
  }

  return <ChristmasDecorations {...decorationProps} />;
}
