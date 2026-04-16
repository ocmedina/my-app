'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import LazyInvoiceDownloadButton from '@/components/pdf/InvoiceDownloadButton';
import { FaPrint, FaSpinner } from 'react-icons/fa';

type SettingsMap = Record<string, string>;

type InvoiceListRow = {
  id: string;
  created_at: string;
  invoice_number: string;
  customer_data: {
    full_name?: string;
  } | null;
  total_amount: number;
};

function InvoiceRowDownloadButton({
  invoiceId,
  settings,
}: {
  invoiceId: string;
  settings: SettingsMap;
}) {
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchInvoice = async () => {
    setLoading(true);

    const { data: invData, error: invError } = await supabase
      .from('invoices')
      .select('id, invoice_number, created_at, customer_data, items_data, total_amount')
      .eq('id', invoiceId)
      .single();

    if (invError) {
      toast.error('Error al cargar la factura para PDF.');
      setLoading(false);
      return;
    }

    setInvoiceData(invData);
    setLoading(false);
  };

  if (invoiceData) {
    return (
      <LazyInvoiceDownloadButton
        invoiceData={invoiceData}
        settings={settings}
        fileName={`factura_${invoiceData.invoice_number}.pdf`}
        readyLabel='Descargar'
        loadingLabel='Generando...'
        className='flex items-center justify-center gap-1 px-3 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors'
      />
    );
  }

  return (
    <button
      onClick={fetchInvoice}
      disabled={loading}
      className='flex items-center justify-center gap-1 px-3 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 transition-colors'
    >
      {loading ? (
        <FaSpinner className='animate-spin' />
      ) : (
        <>
          <FaPrint /> Generar PDF
        </>
      )}
    </button>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListRow[]>([]);
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [invoicesRes, settingsRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, created_at, invoice_number, customer_data, total_amount')
          .order('created_at', { ascending: false }),
        supabase.from('settings').select('key, value'),
      ]);

      if (invoicesRes.error) {
        toast.error('Error al cargar las facturas.');
      } else {
        setInvoices((invoicesRes.data || []) as InvoiceListRow[]);
      }

      if (settingsRes.error) {
        toast.error('Error al cargar configuracion para PDF.');
      } else {
        const map = (settingsRes.data || []).reduce((acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {} as SettingsMap);

        setSettings(map);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold'>Historial de Facturas</h1>
      </div>

      <div className='bg-white dark:bg-slate-900 rounded-lg shadow-md overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200 dark:divide-slate-700'>
          <thead className='bg-gray-50 dark:bg-slate-950'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase'>Fecha</th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase'>Numero</th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase'>Cliente</th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase'>Total</th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase'>Acciones</th>
            </tr>
          </thead>
          <tbody className='bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700'>
            {loading ? (
              <tr>
                <td colSpan={5} className='text-center py-10 text-gray-500 dark:text-slate-400'>
                  Cargando facturas...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className='text-center py-10 text-gray-500 dark:text-slate-400'>
                  No hay facturas generadas.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className='px-6 py-4 text-sm text-gray-500 dark:text-slate-400'>
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </td>
                  <td className='px-6 py-4 text-sm font-semibold text-gray-800 dark:text-slate-100'>
                    {invoice.invoice_number}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-900 dark:text-slate-50'>
                    {invoice.customer_data?.full_name ?? 'N/A'}
                  </td>
                  <td className='px-6 py-4 text-sm font-bold text-gray-800 dark:text-slate-100'>
                    ${invoice.total_amount?.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className='px-6 py-4 text-sm'>
                    <InvoiceRowDownloadButton invoiceId={invoice.id} settings={settings} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
