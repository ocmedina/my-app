// src/components/DashboardWrapper.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import StartingFloatModal from "./StartingFloatModal";

const CACHE_KEY = "frontstock_starting_float_check";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

function getTodayArg(): string {
  const now = new Date();
  const argDate = new Date(
    now.toLocaleString("en-US", {
      timeZone: "America/Argentina/Buenos_Aires",
    })
  );
  return argDate.toISOString().split("T")[0];
}

function getCachedResult(): { date: string; needsFloat: boolean } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    const now = Date.now();
    if (now - cached.timestamp > CACHE_TTL_MS) return null;
    if (cached.date !== getTodayArg()) return null;
    return cached;
  } catch {
    return null;
  }
}

function setCachedResult(date: string, needsFloat: boolean) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ date, needsFloat, timestamp: Date.now() })
    );
  } catch {
    // sessionStorage may not be available
  }
}

export default function DashboardWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showStartingFloatModal, setShowStartingFloatModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const hasChecked = useRef(false);
  const workerRef = useRef<Worker | null>(null);
  const lastPingRef = useRef<number>(Date.now());
  const pingInProgressRef = useRef(false);

  // ─── PING FUNCTION ────────────────────────────────────────────────────
  // Hace un ping liviano a Supabase para mantener la conexión TCP activa.
  const pingSupabase = useCallback(async () => {
    if (pingInProgressRef.current) return;
    pingInProgressRef.current = true;
    try {
      await supabase.from("profiles").select("id").limit(1);
      lastPingRef.current = Date.now();
    } catch {
      // Ignorar errores del ping — la reconexión la maneja useResumeRefresh
    } finally {
      pingInProgressRef.current = false;
    }
  }, []);

  // ─── WEB WORKER KEEP-ALIVE ────────────────────────────────────────────
  // El Web Worker corre en un hilo separado NO throttleado por el browser,
  // incluso cuando la pestaña está en background. Envía un mensaje cada 20s
  // y el hilo principal hace el ping real a Supabase.
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const worker = new Worker("/keepalive.worker.js");
      workerRef.current = worker;

      worker.onmessage = (event) => {
        if (event.data?.type === "ping") {
          pingSupabase();
        }
      };

      worker.onerror = (err) => {
        console.warn("[KeepAlive] Worker error:", err);
      };

      return () => {
        worker.postMessage({ type: "stop" });
        worker.terminate();
        workerRef.current = null;
      };
    } catch (err) {
      // Fallback si los Workers no están disponibles: interval normal
      console.warn("[KeepAlive] Worker no disponible, usando interval:", err);
      const fallbackInterval = setInterval(pingSupabase, 25000);
      return () => clearInterval(fallbackInterval);
    }
  }, [pingSupabase]);

  // ─── VISIBILITYCHANGE HANDLER ─────────────────────────────────────────
  // Cuando el usuario vuelve a la pestaña:
  // - Si estuvo > 3 minutos: recargar de inmediato (conexión TCP muerta)
  // - Si estuvo < 3 minutos: ping inmediato para despertar la conexión
  useEffect(() => {
    let hiddenAt: number | null = null;
    const STALE_MS = 3 * 60 * 1000; // 3 minutos

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }

      if (document.visibilityState === "visible") {
        if (hiddenAt !== null && Date.now() - hiddenAt > STALE_MS) {
          // Conexión muerta — recargar inmediatamente
          window.location.reload();
          return;
        }
        hiddenAt = null;
        // Conexión probablemente viva — ping inmediato
        pingSupabase();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", pingSupabase);
    window.addEventListener("online", pingSupabase);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", pingSupabase);
      window.removeEventListener("online", pingSupabase);
    };
  }, [pingSupabase]);

  // ─── STARTING FLOAT CHECK ─────────────────────────────────────────────
  useEffect(() => {
    if (hasChecked.current) {
      setIsChecking(false);
      return;
    }
    hasChecked.current = true;
    checkStartingFloat();
  }, []);

  const checkStartingFloat = async () => {
    try {
      const today = getTodayArg();

      const cached = getCachedResult();
      if (cached) {
        if (cached.needsFloat) {
          setShowStartingFloatModal(true);
        }
        setIsChecking(false);
        return;
      }

      const yesterdayDate = new Date(
        new Date().toLocaleString("en-US", {
          timeZone: "America/Argentina/Buenos_Aires",
        })
      );
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split("T")[0];

      const { data: todayFloat } = await supabase
        .from("cash_movements")
        .select("id")
        .eq("type", "fondo_inicial")
        .gte("created_at", `${today}T00:00:00-03:00`)
        .lte("created_at", `${today}T23:59:59.999-03:00`)
        .maybeSingle();

      if (todayFloat) {
        setCachedResult(today, false);
        setIsChecking(false);
        return;
      }

      const { data: yesterdayReport } = await supabase
        .from("daily_reports")
        .select("id")
        .eq("report_date", yesterday)
        .maybeSingle();

      if (!yesterdayReport) {
        setCachedResult(today, false);
        setIsChecking(false);
        return;
      }

      setCachedResult(today, true);
      setShowStartingFloatModal(true);
    } catch (error) {
      console.error("Error checking starting float:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCloseModal = () => {
    setShowStartingFloatModal(false);
    setCachedResult(getTodayArg(), false);
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
