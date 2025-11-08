// src/components/DashboardWrapper.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import StartingFloatModal from "./StartingFloatModal";

export default function DashboardWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showStartingFloatModal, setShowStartingFloatModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkStartingFloat();
  }, []);

  const checkStartingFloat = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];

      // 1. Verificar si existe un fondo inicial para hoy
      const { data: todayFloat } = await supabase
        .from("cash_movements")
        .select("id")
        .eq("type", "fondo_inicial")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59.999`)
        .maybeSingle();

      // Si ya hay fondo inicial de hoy, no mostrar modal
      if (todayFloat) {
        setIsChecking(false);
        return;
      }

      // 2. Verificar si existe un cierre de caja de ayer
      const { data: yesterdayReport } = await supabase
        .from("daily_reports")
        .select("id")
        .eq("report_date", yesterday)
        .maybeSingle();

      // Si NO hay cierre de ayer, es el primer día o no se cerró ayer
      // En este caso NO mostramos el modal
      if (!yesterdayReport) {
        setIsChecking(false);
        return;
      }

      // 3. Si hay cierre de ayer pero NO hay fondo inicial de hoy, mostrar modal
      setShowStartingFloatModal(true);
    } catch (error) {
      console.error("Error checking starting float:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCloseModal = () => {
    setShowStartingFloatModal(false);
  };

  if (isChecking) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <StartingFloatModal
        isOpen={showStartingFloatModal}
        onClose={handleCloseModal}
        date={new Date().toISOString().split("T")[0]}
      />
    </>
  );
}
