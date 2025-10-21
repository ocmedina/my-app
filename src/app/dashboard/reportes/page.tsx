// src/app/dashboard/reportes/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { FaPrint, FaCalculator, FaCashRegister, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';

interface DailyClosingData {
  startingFloat: number;
  cashSales: number;
  totalExpenses: number;
  expectedCash: number;
  countedCash: number;
  difference: number;
  salesBreakdown: { [key: string]: number };
  transactionCount: number;
  totalSales: number;
}

interface Sale {
  total_amount: number;
  payment_method: string;
}

interface CashMovement {
  type: string;
  amount: number;
}

export default function ReportsPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [closingData, setClosingData] = useState<DailyClosingData | null>(null);
  const [savedReport, setSavedReport] = useState<any | null>(null);
  const [countedCash, setCountedCash] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Calcular la diferencia en tiempo real
  const realTimeDifference = useMemo(() => {
    if (!closingData || countedCash === '') return null;
    return parseFloat(countedCash) - closingData.expectedCash;
  }, [countedCash, closingData]);

  useEffect(() => {
    fetchDataForDate();
  }, [date]);

  const fetchDataForDate = async () => {
    setLoading(true);
    setClosingData(null);
    setSavedReport(null);
    setCountedCash('');

    try {
      // 1. Verificar si existe un reporte guardado
      const { data: existingReport, error: reportError } = await supabase
        .from('daily_reports')
        .select('report_data')
        .eq('report_date', date)
        .maybeSingle();

      if (reportError) throw reportError;

      if (existingReport) {
        setSavedReport(existingReport.report_data);
        setLoading(false);
        return;
      }

      // 2. Calcular datos para el arqueo
      const selectedDate = new Date(date);
      const startDate = new Date(Date.UTC(
        selectedDate.getUTCFullYear(),
        selectedDate.getUTCMonth(),
        selectedDate.getUTCDate(),
        0, 0, 0
      ));
      const endDate = new Date(Date.UTC(
        selectedDate.getUTCFullYear(),
        selectedDate.getUTCMonth(),
        selectedDate.getUTCDate(),
        23, 59, 59, 999
      ));

      // Obtener ventas y movimientos en paralelo
      const [salesResult, movementsResult] = await Promise.all([
        supabase
          .from('sales')
          .select('total_amount, payment_method')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('cash_movements')
          .select('type, amount')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
      ]);

      if (salesResult.error) throw salesResult.error;
      if (movementsResult.error) throw movementsResult.error;

      const sales: Sale[] = salesResult.data || [];
      const movements: CashMovement[] = movementsResult.data || [];

      // Cálculos
      const cashSales = sales
        .filter(s => s.payment_method === 'efectivo')
        .reduce((sum, s) => sum + (s.total_amount || 0), 0);

      const startingFloat = movements
        .filter(m => m.type === 'fondo_inicial')
        .reduce((sum, m) => sum + (m.amount || 0), 0);

      const totalExpenses = Math.abs(
        movements
          .filter(m => m.type === 'gasto')
          .reduce((sum, m) => sum + (m.amount || 0), 0)
      );

      const expectedCash = startingFloat + cashSales - totalExpenses;

      // Desglose de ventas por método de pago
      const salesBreakdown = sales.reduce((acc, sale) => {
        const method = sale.payment_method || 'no_especificado';
        const displayMethod = method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        acc[displayMethod] = (acc[displayMethod] || 0) + (sale.total_amount || 0);
        return acc;
      }, {} as { [key: string]: number });

      const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);

      setClosingData({
        startingFloat,
        cashSales,
        totalExpenses,
        expectedCash,
        countedCash: 0,
        difference: 0,
        salesBreakdown,
        transactionCount: sales.length,
        totalSales
      });

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeAndSave = async () => {
    if (!closingData) {
      toast.error("No hay datos para guardar.");
      return;
    }

    if (countedCash === '' || isNaN(parseFloat(countedCash))) {
      toast.error("Debes ingresar un monto válido de efectivo contado.");
      return;
    }

    const counted = parseFloat(countedCash);
    const difference = counted - closingData.expectedCash;

    // Confirmar si hay diferencias significativas
    if (Math.abs(difference) > 100) {
      const confirm = window.confirm(
        `Hay una diferencia de $${difference.toFixed(2)}. ¿Estás seguro de continuar?`
      );
      if (!confirm) return;
    }

    setIsSaving(true);

    try {
      const finalData: DailyClosingData = {
        ...closingData,
        countedCash: counted,
        difference
      };

      const { error } = await supabase.from('daily_reports').insert({
        report_date: date,
        report_data: finalData,
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      toast.success("✅ Cierre de caja finalizado y guardado correctamente.");
      setSavedReport(finalData);
      setClosingData(null);
      setCountedCash('');

    } catch (error: any) {
      console.error('Error saving report:', error);
      toast.error(`Error al guardar el cierre: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const reportToDisplay = savedReport || closingData;

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="print:hidden">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaCashRegister className="text-blue-600" />
          Arqueo y Cierre de Caja
        </h1>
      </div>

      {/* Selector de fecha */}
      <div className="p-4 bg-white rounded-lg shadow-md flex items-center gap-4 print:shadow-none">
        <label htmlFor="reportDate" className="text-sm font-medium text-gray-700">
          Fecha del Cierre:
        </label>
        <input
          type="date"
          id="reportDate"
          value={date}
          onChange={e => setDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading || isSaving}
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Calculando datos del día...</p>
        </div>
      )}

      {/* No data state */}
      {!loading && !reportToDisplay && (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">
          <FaExclamationTriangle className="mx-auto text-4xl text-yellow-500 mb-4" />
          <p className="text-gray-600">No hay datos de ventas o movimientos para esta fecha.</p>
        </div>
      )}

      {/* VISTA DEL ARQUEO DE CAJA (Pendiente de finalizar) */}
      {!loading && closingData && !savedReport && (
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
              <FaCalculator className="text-blue-600" />
              Arqueo de Caja
            </h2>
            <span className="text-sm text-gray-500">
              {new Date(date + 'T00:00:00').toLocaleDateString('es-AR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>

          {/* Resumen de ventas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 font-medium">Total Ventas</p>
              <p className="text-2xl font-bold text-blue-700">${closingData.totalSales.toFixed(2)}</p>
              <p className="text-xs text-blue-500">{closingData.transactionCount} transacciones</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-600 font-medium">Ventas en Efectivo</p>
              <p className="text-2xl font-bold text-green-700">${closingData.cashSales.toFixed(2)}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-600 font-medium">Fondo Inicial</p>
              <p className="text-2xl font-bold text-purple-700">${closingData.startingFloat.toFixed(2)}</p>
            </div>
          </div>

          {/* Desglose por método de pago */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FaChartLine /> Desglose por Método de Pago
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(closingData.salesBreakdown).map(([method, amount]) => (
                <div key={method} className="flex justify-between items-center bg-white p-3 rounded border">
                  <span className="text-sm text-gray-600">{method}</span>
                  <span className="font-semibold text-gray-800">${amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cálculo de efectivo esperado */}
          <div className="p-5 border-2 border-gray-300 rounded-lg space-y-3 bg-gradient-to-br from-gray-50 to-white">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Cálculo de Efectivo Esperado</h3>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Fondo de Caja Inicial</span>
              <span className="font-medium text-green-600 text-lg">+ ${closingData.startingFloat.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ventas en Efectivo</span>
              <span className="font-medium text-green-600 text-lg">+ ${closingData.cashSales.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Gastos y Retiros</span>
              <span className="font-medium text-red-600 text-lg">- ${closingData.totalExpenses.toFixed(2)}</span>
            </div>
            
            <hr className="my-3 border-gray-300" />
            
            <div className="flex justify-between items-center text-xl font-bold bg-blue-100 p-3 rounded-lg">
              <span className="text-gray-800">Efectivo Esperado en Caja</span>
              <span className="text-blue-700">${closingData.expectedCash.toFixed(2)}</span>
            </div>
          </div>

          {/* Input para efectivo contado */}
          <div className="bg-yellow-50 p-5 rounded-lg border-2 border-yellow-300">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              💰 Efectivo Real Contado en Caja
            </label>
            <input
              type="number"
              step="0.01"
              value={countedCash}
              onChange={e => setCountedCash(e.target.value)}
              placeholder="Ingresa el monto contado físicamente"
              className="w-full p-3 text-lg border-2 border-yellow-400 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              disabled={isSaving}
            />
            
            {/* Diferencia en tiempo real */}
            {realTimeDifference !== null && (
              <div className="mt-4 p-4 rounded-lg text-center bg-white border-2" style={{
                borderColor: realTimeDifference >= 0 ? '#10b981' : '#ef4444'
              }}>
                <p className="text-sm text-gray-600 mb-1">Diferencia</p>
                <p className={`text-3xl font-bold ${realTimeDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {realTimeDifference >= 0 ? '+' : ''}{realTimeDifference.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {realTimeDifference > 0 ? 'Sobrante' : realTimeDifference < 0 ? 'Faltante' : 'Exacto'}
                </p>
              </div>
            )}
          </div>

          {/* Botón de finalizar */}
          <button
            onClick={handleFinalizeAndSave}
            disabled={isSaving || countedCash === ''}
            className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-lg text-lg transition-colors shadow-md"
          >
            {isSaving ? 'Guardando...' : '✓ Finalizar y Guardar Cierre de Caja'}
          </button>
        </div>
      )}

      {/* VISTA DEL REPORTE GUARDADO */}
      {!loading && savedReport && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-start mb-6 print:mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Cierre de Caja - {new Date(date + 'T00:00:00').toLocaleDateString('es-AR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
              <p className="text-sm text-green-600 font-medium mt-1">
                ✓ Cierre finalizado y guardado
              </p>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-sm border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 rounded-md transition-colors print:hidden"
            >
              <FaPrint /> Imprimir
            </button>
          </div>

          <div className="border-t-2 my-4"></div>

          {/* Resumen del reporte guardado */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Resumen de Ventas</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Ventas:</span>
                    <span className="font-bold">${savedReport.totalSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transacciones:</span>
                    <span className="font-bold">{savedReport.transactionCount}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Métodos de Pago</h3>
                <div className="space-y-2">
                  {Object.entries(savedReport.salesBreakdown).map(([method, amount]: [string, any]) => (
                    <div key={method} className="flex justify-between text-sm">
                      <span className="text-gray-600">{method}:</span>
                      <span className="font-medium">${amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-700 mb-4">Arqueo de Efectivo</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fondo Inicial:</span>
                  <span className="font-medium text-green-600">+ ${savedReport.startingFloat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ventas en Efectivo:</span>
                  <span className="font-medium text-green-600">+ ${savedReport.cashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gastos y Retiros:</span>
                  <span className="font-medium text-red-600">- ${savedReport.totalExpenses.toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Efectivo Esperado:</span>
                  <span>${savedReport.expectedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Efectivo Contado:</span>
                  <span>${savedReport.countedCash.toFixed(2)}</span>
                </div>
                <hr className="my-2 border-t-2" />
                <div className="flex justify-between text-xl font-bold">
                  <span>Diferencia:</span>
                  <span className={savedReport.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {savedReport.difference >= 0 ? '+' : ''}{savedReport.difference.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}