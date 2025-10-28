'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { PDFDownloadLink, Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { FaPrint, FaSpinner } from 'react-icons/fa';

// ---- Registro de fuente Roboto para PDF ----
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ]
});

// ---- Estilos para el PDF ----
const styles = StyleSheet.create({
  page: { fontFamily: 'Roboto', fontSize: 10, padding: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, alignItems: 'flex-start' },
  logo: { width: 60 },
  companyInfo: { textAlign: 'right' },
  companyName: { fontSize: 16, fontWeight: 'bold' },
  invoiceTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  invoiceSubtitle: { fontSize: 10, textAlign: 'center', marginBottom: 20, color: 'grey' },
  metaInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, fontSize: 9, borderBottomWidth: 1, borderBottomColor: '#eee', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 8 },
  metaLabel: { fontWeight: 'bold' },
  customerInfo: { marginBottom: 20, fontSize: 10 },
  table: { width: '100%' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 5, paddingHorizontal: 8, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center', minHeight: 24 },
  colProduct: { width: '50%', padding: 8 },
  colQty: { width: '15%', padding: 8, textAlign: 'center' },
  colPrice: { width: '15%', padding: 8, textAlign: 'right' },
  colTotal: { width: '20%', padding: 8, textAlign: 'right' },
  summaryContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  summaryBox: { width: 200, borderTopWidth: 1, borderTopColor: '#aaa', paddingTop: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  summaryTotal: { fontWeight: 'bold', fontSize: 14 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: '#888' },
});

// ---- Componente PDF de Factura ----
function InvoicePDFDocument({ invoiceData, settings }: { invoiceData: any, settings: any }) {
  const logoUrl = settings?.logo_url || 'https://via.placeholder.com/150';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image style={styles.logo} src={logoUrl} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{settings?.business_name || 'Tu Negocio'}</Text>
            <Text style={{ fontSize: 9, color: '#666' }}>{settings?.business_address || 'Dirección'}</Text>
            <Text style={{ fontSize: 9, color: '#666' }}>{settings?.business_phone || 'Teléfono'}</Text>
          </View>
        </View>

        <Text style={styles.invoiceTitle}>FACTURA</Text>
        <Text style={styles.invoiceSubtitle}>Documento no válido como factura fiscal</Text>

        <View style={styles.metaInfo}>
          <Text><Text style={styles.metaLabel}>Factura Nº:</Text> {invoiceData.invoice_number}</Text>
          <Text><Text style={styles.metaLabel}>Fecha:</Text> {new Date(invoiceData.created_at).toLocaleDateString()}</Text>
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.metaLabel}>Cliente:</Text>
          <Text>{invoiceData.customer_data?.full_name ?? 'N/A'}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colProduct}>Descripción</Text>
            <Text style={styles.colQty}>Cant.</Text>
            <Text style={styles.colPrice}>P. Unit.</Text>
            <Text style={styles.colTotal}>Subtotal</Text>
          </View>
          {invoiceData.items_data?.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colProduct}>{item.name ?? 'N/A'}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>${item.price?.toFixed(2)}</Text>
              <Text style={styles.colTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text>TOTAL</Text>
              <Text>${invoiceData.total_amount?.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Gracias por su compra.</Text>
        </View>
      </Page>
    </Document>
  );
}

// ---- Botón de descarga PDF ----
function DownloadInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchInvoiceAndSettings = async () => {
    setLoading(true);
    const { data: invData, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*');

    if (invError || settingsError) {
      toast.error("Error al cargar datos para el PDF.");
      setLoading(false);
      return;
    }

    if (settingsData) {
      const settingsMap = settingsData.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
      setSettings(settingsMap);
    }
    setInvoiceData(invData);
    setLoading(false);
  };

  return (
    <button
      onClick={fetchInvoiceAndSettings}
      disabled={loading || !!invoiceData}
      className={`flex items-center justify-center gap-1 px-3 py-1 text-xs rounded-md transition-colors ${
        invoiceData 
          ? 'bg-gray-200 text-gray-500 cursor-default' 
          : 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300'
      }`}
    >
      {loading ? (
        <FaSpinner className="animate-spin" />
      ) : invoiceData ? (
        <PDFDownloadLink
          document={<InvoicePDFDocument invoiceData={invoiceData} settings={settings} />}
          fileName={`factura_${invoiceData?.invoice_number}.pdf`}
        >
          {({ loading: pdfLoading }) => pdfLoading ? '...' : <><FaPrint /> Descargar</>}
        </PDFDownloadLink>
      ) : (
        <><FaPrint /> Generar PDF</>
      )}
    </button>
  );
}

// ---- Página principal de facturas ----
export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
                    <DownloadInvoiceButton invoiceId={invoice.id} />
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
