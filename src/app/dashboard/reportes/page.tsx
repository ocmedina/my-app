// src/app/dashboard/reportes/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { FaPrint, FaCalculator, FaCashRegister } from 'react-icons/fa';

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

export default function ReportsPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [closingData, setClosingData] = useState<DailyClosingData | null>(null);
  const [savedReport, setSavedReport] = useState<any | null>(null);
  const [countedCash, setCountedCash] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDataForDate = async () => {
      setLoading(true);
      setClosingData(null);
      setSavedReport(null);
      setCountedCash('');

      const selectedDate = new Date(date);
      const startDate = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate(), 0, 0, 0));
      const endDate = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate(), 23, 59, 59, 999));

      // 1. Buscar si ya existe un reporte guardado
      const { data: existingReport } = await supabase
        .from('daily_reports')
        .select('report_data')
        .eq('report_date', date)
        .single();

      if (existingReport) {
        setSavedReport(existingReport.report_data);
        setLoading(false);
        return;
      }

      // 2. Si no hay reporte, calcular los datos para el arqueo
      const { data: sales } = await supabase.from('sales').select('total_amount, payment_method').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
      const { data: movements } = await supabase.from('cash_movements').select('type, amount').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());

      const cashSales = (sales || []).filter(s => s.payment_method === 'efectivo').reduce((sum, s) => sum + (s.total_amount || 0), 0);
      const startingFloat = (movements || []).filter(m => m.type === 'fondo_inicial').reduce((sum, m) => sum + (m.amount || 0), 0);
      const totalExpenses = (movements || []).filter(m => m.type === 'gasto').reduce((sum, m) => sum + (m.amount || 0), 0); // Ya son negativos

      const expectedCash = startingFloat + cashSales + totalExpenses;
      
      // Datos generales del reporte
      const totalSales = (sales || []).reduce((sum, s) => sum + (s.total_amount || 0), 0);
      const transactionCount = (sales || []).length;
      const salesBreakdown = (sales || []).reduce((acc, sale) => {
        const method = sale.payment_method?.replace('_', ' ') || 'No especificado';
        acc[method] = (acc[method] || 0) + (sale.total_amount || 0);
        return acc;
      }, {} as { [key: string]: number });

      setClosingData({
        startingFloat,
        cashSales,
        totalExpenses: Math.abs(totalExpenses),
        expectedCash,
        countedCash: 0, // Se llenará con la entrada del usuario
        difference: 0, // Se calculará después
        salesBreakdown,
        transactionCount,
        totalSales
      });

      setLoading(false);
    };

    fetchDataForDate();
  }, [date]);
  
  const handleFinalizeAndSave = async () => {
    if (!closingData || countedCash === '') {
      toast.error("Debes ingresar el monto de efectivo contado.");
      return;
    }
    setLoading(true);

    const counted = parseFloat(countedCash);
    const finalData: DailyClosingData = {
      ...closingData,
      countedCash: counted,
      difference: counted - closingData.expectedCash,
    };

    const { error } = await supabase.from('daily_reports').insert({
      report_date: date,
      report_data: finalData,
    });

    if (error) {
      toast.error(`Error al guardar el cierre: ${error.message}`);
    } else {
      toast.success("Cierre de caja finalizado y guardado.");
      setSavedReport(finalData);
      setClosingData(null);
    }
    setLoading(false);
  };

  const reportToDisplay = savedReport || closingData;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Arqueo y Cierre de Caja</h1>
      <div className="p-4 bg-white rounded-lg shadow-md flex items-center gap-4">
        <label htmlFor="reportDate" className="text-sm font-medium text-gray-700">Fecha del Cierre:</label>
        <input type="date" id="reportDate" value={date} onChange={e => setDate(e.target.value)} className="p-2 border border-gray-300 rounded-md" />
      </div>

      {loading && <div className="text-center p-10 bg-white rounded-lg shadow-md">Calculando...</div>}

      {!loading && !reportToDisplay && (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">No hay datos de ventas o movimientos para esta fecha.</div>
      )}

      {/* VISTA DEL ARQUEO DE CAJA */}
      {!loading && closingData && !savedReport && (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><FaCalculator /> Arqueo de Caja del Día {new Date(date + 'T00:00:00').toLocaleDateString()}</h2>
          
          <div className="p-4 border rounded-lg space-y-2">
            <div className="flex justify-between"><span className="text-gray-600">Fondo de Caja Inicial</span><span className="font-medium text-green-600">+ ${closingData.startingFloat.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Ventas en Efectivo</span><span className="font-medium text-green-600">+ ${closingData.cashSales.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Gastos y Retiros</span><span className="font-medium text-red-600">- ${closingData.totalExpenses.toFixed(2)}</span></div>
            <hr/>
            <div className="flex justify-between text-lg font-bold"><span className="text-gray-800">Efectivo Esperado en Caja</span><span>${closingData.expectedCash.toFixed(2)}</span></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium">Efectivo Real Contado</label>
              <input type="number" value={countedCash} onChange={e => setCountedCash(e.target.value)} placeholder="Ingresa el monto contado" className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <button onClick={handleFinalizeAndSave} className="w-full px-4 py-2 bg-blue-600 text-white font-bold rounded-md">Finalizar y Guardar Cierre</button>
          </div>
          
          {countedCash !== '' && (
            <div className="text-center font-bold text-xl">
              Diferencia: 
              <span className={parseFloat(countedCash) - closingData.expectedCash >= 0 ? 'text-green-600' : 'text-red-600'}>
                ${(parseFloat(countedCash) - closingData.expectedCash).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* VISTA DEL REPORTE GUARDADO */}
      {!loading && savedReport && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Cierre del Día {new Date(date + 'T00:00:00').toLocaleDateString()} (Guardado)</h2>
              <p className="text-sm text-green-600">Este cierre de caja ya fue finalizado.</p>
            </div>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md"><FaPrint /> Imprimir</button>
          </div>
          <div className="border-t my-4"></div>
          {/* ... (el resto del reporte de ventas y desglose) ... */}
        </div>
      )}
    </div>
  );
}