"use client";

import { useState, useEffect } from "react";
import { isChristmasThemeActive } from "@/lib/theme-scheduler";
import ChristmasDecorations from "./ChristmasDecorations";

interface ConditionalChristmasDecorationsProps {
  density?: "light" | "medium" | "heavy";
  showSnow?: boolean;
  showLights?: boolean;
  showFloating?: boolean;
}

/**
 * Componente que muestra decoraciones navideñas solo cuando el tema está activo
 */
export default function ConditionalChristmasDecorations(
  props: ConditionalChristmasDecorationsProps
) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Verificar inicialmente
    setIsActive(isChristmasThemeActive());

    // Verificar cada minuto por si cambia la fecha
    const interval = setInterval(() => {
      setIsActive(isChristmasThemeActive());
    }, 60000); // Cada 60 segundos

    return () => clearInterval(interval);
  }, []);

  if (!isActive) {
    return null;
  }

  return <ChristmasDecorations {...props} />;
}
