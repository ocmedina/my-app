'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDFDocument from '@/components/InvoicePDFDocument'; // Importamos el template de Factura
import { FaPrint, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';

// Componente para el botón de descarga, maneja estado individual
function DownloadInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchInvoiceAndSettings = async () => {
    setLoading(true);
    // 1. Obtener datos de la factura específica
    const { data: invData, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
      
    // 2. Obtener configuración (para el logo, etc.)
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*');

    if (invError || settingsError) {
      toast.error("Error al cargar datos para el PDF.");
      setLoading(false);
      return;
    }

    if (settingsData) {
      const settingsMap = settingsData.reduce((acc, s) => ({...acc, [s.key]: s.value }), {});
      setSettings(settingsMap);
    }
    setInvoiceData(invData);
    setLoading(false);
  };

  return (
    <button
      onClick={fetchInvoiceAndSettings}
      disabled={loading || !!invoiceData} // Deshabilitar si ya se cargó o está cargando
      className={`flex items-center justify-center gap-1 px-3 py-1 text-xs rounded-md transition-colors ${
        invoiceData 
          ? 'bg-gray-200 text-gray-500 cursor-default' // Estilo diferente si ya está listo para descargar
          : 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300'
      }`}
    >
      {loading ? (
        <FaSpinner className="animate-spin" />
      ) : invoiceData ? (
        // Una vez cargados los datos, se muestra el link de descarga real
        <PDFDownloadLink
          document={<InvoicePDFDocument invoiceData={invoiceData} settings={settings} />}
          fileName={`factura_${invoiceData?.invoice_number}.pdf`}
        >
          {({ loading: pdfLoading }) => 
             pdfLoading ? '...' : <><FaPrint /> Descargar</>
          }
        </PDFDownloadLink>
      ) : (
        // Estado inicial, al hacer clic carga los datos
        <><FaPrint /> Generar PDF</>
      )}
    </button>
  );
}


export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Podríamos añadir paginación y filtros aquí como en las otras tablas

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          created_at,
          invoice_number,
          customer_data,
          total_amount
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Error al cargar las facturas.');
      } else {
        setInvoices(data || []);
      }
      setLoading(false);
    };
    fetchInvoices();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Historial de Facturas</h1>
        {/* Podríamos añadir un botón para crear facturas manuales si fuera necesario */}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-500">Cargando facturas...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-500">No hay facturas generadas.</td></tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(invoice.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">{invoice.invoice_number}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{invoice.customer_data?.full_name ?? 'N/A'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-800">${invoice.total_amount?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">
                    {/* Botón que carga datos y luego permite descargar */}
                    <DownloadInvoiceButton invoiceId={invoice.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Aquí podríamos añadir paginación */}
    </div>
  );
}