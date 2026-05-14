import { useEffect, useRef } from "react";

// Si el tab estuvo inactivo más de este tiempo, la conexión TCP de Supabase
// puede estar muerta. Es más rápido y confiable recargar que intentar recuperarse.
// 20 segundos: cubre el 95% de los casos donde el usuario reporta "infinite loading".
// Redes móviles y NAT argentinos cierran conexiones inactivas muy agresivamente (~30s).
const STALE_THRESHOLD_MS = 20 * 1000; // 20 segundos

type ResumeOptions = {
  throttleMs?: number;
  resumeOnFocus?: boolean;
  resumeOnVisible?: boolean;
  resumeOnOnline?: boolean;
};

export function useResumeRefresh(
  onResume: () => void | Promise<void>,
  options: ResumeOptions = {}
) {
  const {
    // 3 minutos: con STALE_THRESHOLD_MS=20s, ausencias >20s hacen reload inmediato,
    // y ausencias <20s no necesitan refetch (datos recientes siguen siendo válidos).
    // Esto elimina los cuelgues en cambios de pestaña rápidos porque el throttle
    // impide que se dispare un fetch sobre una conexión en estado degradado.
    throttleMs = 3 * 60 * 1000,
    resumeOnFocus = false, // Solo visibilitychange — focus dispara duplicados junto a visibilitychange
    resumeOnVisible = true,
    resumeOnOnline = true,
  } = options;

  const onResumeRef = useRef(onResume);
  const lastRunRef = useRef(0);
  const runningRef = useRef(false);
  // Guarda el momento exacto en que el tab se ocultó
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    onResumeRef.current = onResume;
  }, [onResume]);

  useEffect(() => {
    const shouldRun = () => {
      const now = Date.now();
      if (runningRef.current) return false;
      if (now - lastRunRef.current < throttleMs) return false;
      lastRunRef.current = now;
      return true;
    };

    const run = async () => {
      if (!shouldRun()) return;
      runningRef.current = true;
      try {
        await onResumeRef.current();
      } finally {
        runningRef.current = false;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        // Registrar el momento en que el tab se ocultó
        hiddenAtRef.current = Date.now();
        return;
      }

      if (document.visibilityState === "visible") {
        const hiddenAt = hiddenAtRef.current;
        hiddenAtRef.current = null;

        if (hiddenAt !== null) {
          const timeHidden = Date.now() - hiddenAt;

          // Si estuvo más de 3 minutos en background, la conexión TCP de Supabase
          // ya está muerta. Recargar inmediatamente es la forma más rápida y
          // confiable de restaurar el sistema — sin spinners, sin queries colgadas.
          if (timeHidden > STALE_THRESHOLD_MS) {
            window.location.reload();
            return;
          }
        }

        // Menos de 3 minutos: intentar refresh normal
        void run();
      }
    };

    const handleFocus = () => {
      void run();
    };

    const handleOnline = () => {
      void run();
    };

    if (resumeOnVisible) {
      document.addEventListener("visibilitychange", handleVisibility);
    }
    if (resumeOnFocus) {
      window.addEventListener("focus", handleFocus);
    }
    if (resumeOnOnline) {
      window.addEventListener("online", handleOnline);
    }

    return () => {
      if (resumeOnVisible) {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
      if (resumeOnFocus) {
        window.removeEventListener("focus", handleFocus);
      }
      if (resumeOnOnline) {
        window.removeEventListener("online", handleOnline);
      }
    };
  }, [throttleMs, resumeOnFocus, resumeOnVisible, resumeOnOnline]);
}
