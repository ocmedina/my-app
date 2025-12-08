// src/app/dashboard/debug/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export default function DebugPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  const testTimezones = async () => {
    setLoading(true);
    const testDate = new Date().toISOString().split("T")[0]; // Hoy

    try {
      // 1. Obtener fecha en zona horaria Argentina
      const now = new Date();
      const argDate = new Date(
        now.toLocaleString("en-US", {
          timeZone: "America/Argentina/Buenos_Aires",
        })
      );

      // 2. Probar consulta CON zona horaria argentina
      const startDateArg = `${testDate}T00:00:00-03:00`;
      const endDateArg = `${testDate}T23:59:59.999-03:00`;

      const { data: salesWithTZ, error: error1 } = await supabase
        .from("sales")
        .select("id, created_at, total_amount")
        .gte("created_at", startDateArg)
        .lte("created_at", endDateArg)
        .limit(5);

      // 3. Probar consulta SIN zona horaria (método antiguo)
      const startDateOld = new Date(testDate);
      startDateOld.setUTCHours(0, 0, 0, 0);
      const endDateOld = new Date(testDate);
      endDateOld.setUTCHours(23, 59, 59, 999);

      const { data: salesWithoutTZ, error: error2 } = await supabase
        .from("sales")
        .select("id, created_at, total_amount")
        .gte("created_at", startDateOld.toISOString())
        .lte("created_at", endDateOld.toISOString())
        .limit(5);

      // 4. Obtener una venta reciente para ver su timestamp
      const { data: recentSale } = await supabase
        .from("sales")
        .select("id, created_at, total_amount")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setResults({
        currentTimeUTC: new Date().toISOString(),
        currentTimeArgentina: argDate.toISOString(),
        testDate,
        filters: {
          withTimezone: {
            start: startDateArg,
            end: endDateArg,
            count: salesWithTZ?.length || 0,
            sales: salesWithTZ || [],
          },
          withoutTimezone: {
            start: startDateOld.toISOString(),
            end: endDateOld.toISOString(),
            count: salesWithoutTZ?.length || 0,
            sales: salesWithoutTZ || [],
          },
        },
        recentSale: recentSale
          ? {
              id: recentSale.id,
              created_at: recentSale.created_at,
              created_at_local: new Date(recentSale.created_at).toLocaleString(
                "es-AR",
                { timeZone: "America/Argentina/Buenos_Aires" }
              ),
              total: recentSale.total_amount,
            }
          : null,
        errors: [error1, error2].filter(Boolean),
      });
    } catch (error) {
      console.error("Error en prueba:", error);
      setResults({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          🧪 Verificación de Zona Horaria Argentina
        </h1>
        <p className="text-blue-100">
          Esta página verifica que los filtros de fecha funcionen correctamente
          con la zona horaria de Argentina (UTC-3)
        </p>
      </div>

      {/* Botón de prueba */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
        <button
          onClick={testTimezones}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-md"
        >
          {loading
            ? "⏳ Ejecutando pruebas..."
            : "🔬 Ejecutar Pruebas de Zona Horaria"}
        </button>
      </div>

      {results && !results.error && (
        <div className="space-y-4">
          {/* Información de tiempo actual */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-4 sm:p-6 border-2 border-blue-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              🕐 Tiempo Actual
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-white dark:bg-slate-900 p-3 rounded">
                <p className="text-gray-600 dark:text-slate-300 font-medium">Hora UTC:</p>
                <p className="text-gray-900 dark:text-slate-50 font-mono mt-1">
                  {results.currentTimeUTC}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded">
                <p className="text-gray-600 dark:text-slate-300 font-medium">Hora Argentina:</p>
                <p className="text-gray-900 dark:text-slate-50 font-mono mt-1">
                  {results.currentTimeArgentina}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-slate-300 mt-3">
              Fecha de prueba: <strong>{results.testDate}</strong>
            </p>
          </div>

          {/* Comparación de filtros */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* CON zona horaria */}
            <div className="bg-green-50 rounded-lg shadow-md p-4 sm:p-6 border-2 border-green-300">
              <div className="flex items-center gap-2 mb-4">
                <FaCheckCircle className="text-green-600 text-xl" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                  CON Zona Horaria 🇦🇷
                </h3>
              </div>
              <div className="space-y-3">
                <div className="bg-white dark:bg-slate-900 p-3 rounded text-xs">
                  <p className="text-gray-600 dark:text-slate-300 font-medium mb-1">Inicio:</p>
                  <code className="text-green-700 break-all">
                    {results.filters.withTimezone.start}
                  </code>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded text-xs">
                  <p className="text-gray-600 dark:text-slate-300 font-medium mb-1">Fin:</p>
                  <code className="text-green-700 break-all">
                    {results.filters.withTimezone.end}
                  </code>
                </div>
                <div className="bg-green-100 p-3 rounded border border-green-300">
                  <p className="text-green-800 font-bold text-lg">
                    ✅ {results.filters.withTimezone.count} ventas encontradas
                  </p>
                </div>
              </div>
            </div>

            {/* SIN zona horaria */}
            <div className="bg-orange-50 rounded-lg shadow-md p-4 sm:p-6 border-2 border-orange-300">
              <div className="flex items-center gap-2 mb-4">
                <FaTimesCircle className="text-orange-600 text-xl" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                  SIN Zona Horaria (Antiguo)
                </h3>
              </div>
              <div className="space-y-3">
                <div className="bg-white dark:bg-slate-900 p-3 rounded text-xs">
                  <p className="text-gray-600 dark:text-slate-300 font-medium mb-1">Inicio:</p>
                  <code className="text-orange-700 break-all">
                    {results.filters.withoutTimezone.start}
                  </code>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded text-xs">
                  <p className="text-gray-600 dark:text-slate-300 font-medium mb-1">Fin:</p>
                  <code className="text-orange-700 break-all">
                    {results.filters.withoutTimezone.end}
                  </code>
                </div>
                <div className="bg-orange-100 p-3 rounded border border-orange-300">
                  <p className="text-orange-800 font-bold text-lg">
                    ⚠️ {results.filters.withoutTimezone.count} ventas
                    encontradas
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Venta más reciente */}
          {results.recentSale && (
            <div className="bg-purple-50 rounded-lg shadow-md p-4 sm:p-6 border-2 border-purple-300">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                📝 Venta Más Reciente
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-white dark:bg-slate-900 p-3 rounded">
                  <p className="text-gray-600 dark:text-slate-300 font-medium">ID:</p>
                  <p className="text-gray-900 dark:text-slate-50 font-mono mt-1">
                    {results.recentSale.id.substring(0, 8)}...
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded">
                  <p className="text-gray-600 dark:text-slate-300 font-medium">Total:</p>
                  <p className="text-gray-900 dark:text-slate-50 font-bold mt-1">
                    ${results.recentSale.total.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded">
                  <p className="text-gray-600 dark:text-slate-300 font-medium">
                    Timestamp UTC (BD):
                  </p>
                  <p className="text-gray-900 dark:text-slate-50 font-mono text-xs mt-1">
                    {results.recentSale.created_at}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded">
                  <p className="text-gray-600 dark:text-slate-300 font-medium">Hora Argentina:</p>
                  <p className="text-gray-900 dark:text-slate-50 font-bold mt-1">
                    {results.recentSale.created_at_local}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Explicación */}
          <div className="bg-blue-50 rounded-lg shadow-md p-4 sm:p-6 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-3">
              💡 Explicación
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-slate-200">
              <li className="flex gap-2">
                <span>✅</span>
                <span>
                  <strong>CON zona horaria (-03:00):</strong> Filtra
                  correctamente por día argentino. PostgreSQL convierte
                  automáticamente a UTC para comparar.
                </span>
              </li>
              <li className="flex gap-2">
                <span>⚠️</span>
                <span>
                  <strong>SIN zona horaria:</strong> Usa UTC puro, puede dividir
                  datos cuando se trabaja cerca de medianoche.
                </span>
              </li>
              <li className="flex gap-2">
                <span>🗄️</span>
                <span>
                  <strong>Base de datos:</strong> Los timestamps se guardan en
                  UTC (estándar internacional). Las conversiones son automáticas
                  y seguras.
                </span>
              </li>
              <li className="flex gap-2">
                <span>🇦🇷</span>
                <span>
                  <strong>Resultado:</strong> Todos los reportes, ventas y
                  pedidos se agrupan correctamente por día argentino, sin
                  importar la hora.
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {results?.error && (
        <div className="bg-red-50 rounded-lg shadow-md p-6 border-2 border-red-300">
          <h3 className="text-lg font-bold text-red-800 mb-2">❌ Error</h3>
          <p className="text-red-700">{results.error}</p>
        </div>
      )}
    </div>
  );
}
