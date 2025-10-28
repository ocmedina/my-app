'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDFDocument from '@/components/InvoicePDFDocument';
import { FaPrint, FaFileInvoiceDollar, FaSpinner } from 'react-icons/fa';
import { createInvoiceFromSale } from '@/app/actions/invoiceActions';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';

export default function SaleDetailsClient({ sale }: { sale: any }) {
  const [invoiceData, setInvoiceData] = useState<any | null>(null);
  const [loadingCheck, setLoadingCheck] = useState(true);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoadingCheck(true);

      // 1. Verificar sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error("Tu sesión expiró. Por favor, vuelve a iniciar sesión.");
        setLoadingCheck(false);
        return;
      }

      // 2. Traer configuración
      const { data: settingsData } = await supabase.from('settings').select('*');
      if (isMounted && settingsData) {
        const settingsMap = settingsData.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
        setSettings(settingsMap);
      }

      // 3. Verificar si ya existe factura
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('sale_id', sale.id)
        .maybeSingle();

      if (isMounted) {
        setInvoiceData(existingInvoice);
        setLoadingCheck(false);
      }
    };

    fetchData();
    return () => { isMounted = false; }
  }, [sale.id]);

  const handleGenerateInvoice = async () => {
    setLoadingGenerate(true);

    // 1. Chequear sesión antes de generar
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      toast.error("Tu sesión expiró. Por favor, vuelve a iniciar sesión.");
      setLoadingGenerate(false);
      return;
    }

    // 2. Generar factura
    const result = await createInvoiceFromSale(sale.id);
    if (result.success) {
      toast.success(result.message);
      setInvoiceData(result.invoiceData);
    } else {
      toast.error(result.message);
    }

    setLoadingGenerate(false);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Detalle de Venta</h1>
          <p className="text-sm text-gray-500">ID: {sale.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/ventas" className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 whitespace-nowrap">
            &larr; Volver al Historial
          </Link>

          {loadingCheck ? (
            <span className="px-4 py-2 text-sm text-gray-500 flex items-center gap-2"><FaSpinner className="animate-spin" /> Cargando...</span>
          ) : invoiceData ? (
            <PDFDownloadLink
              document={<InvoicePDFDocument invoiceData={invoiceData} settings={settings} />}
              fileName={`factura_${invoiceData.invoice_number}.pdf`}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 whitespace-nowrap"
            >
              {({ loading: pdfLoading }) =>
                pdfLoading ? <FaSpinner className="animate-spin" /> : <><FaPrint /> Descargar Factura</>
              }
            </PDFDownloadLink>
          ) : (
            <button
              onClick={handleGenerateInvoice}
              disabled={loadingGenerate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap"
            >
              {loadingGenerate ? <FaSpinner className="animate-spin" /> : <FaFileInvoiceDollar />}
              {loadingGenerate ? 'Generando...' : 'Generar Factura'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-b pb-6">
        <div><p className="text-sm text-gray-500">Fecha de Venta</p><p className="font-semibold">{new Date(sale.created_at).toLocaleString()}</p></div>
        <div><p className="text-sm text-gray-500">Cliente</p><p className="font-semibold">{sale.customers?.full_name ?? 'N/A'}</p></div>
        <div><p className="text-sm text-gray-500">Vendedor</p><p className="font-semibold">{sale.profiles?.full_name ?? 'N/A'}</p></div>
      </div>

      <h2 className="text-xl font-bold mb-4">Productos</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(sale.sale_items || []).map((item: any, index: number) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.products?.name ?? 'Producto borrado'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.price?.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold text-gray-900">TOTAL</td>
              <td className="px-6 py-3 text-left text-sm font-bold text-gray-900">${sale.total_amount?.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
