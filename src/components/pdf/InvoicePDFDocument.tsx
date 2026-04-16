'use client'

import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Asegúrate de tener la fuente Roboto registrada como en los otros PDFs
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ]
});

// Estilos (puedes personalizarlos mucho más)
const styles = StyleSheet.create({
  page: { fontFamily: 'Roboto', fontSize: 10, padding: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, alignItems: 'flex-start' },
  logo: { width: 60 },
  companyInfo: { textAlign: 'right' },
  companyName: { fontSize: 16, fontWeight: 'bold' },
  invoiceTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  invoiceSubtitle: { fontSize: 10, textAlign: 'center', marginBottom: 20, color: 'grey' },
  metaInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, fontSize: 9, borderBottom: 1, borderTop: 1, paddingVertical: 8, borderColor: '#eee' },
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

// Componente del Documento PDF
export default function InvoicePDFDocument({ invoiceData, settings }: { invoiceData: any, settings: any }) {
  const logoUrl = settings?.logo_url || 'https://via.placeholder.com/150'; // Usa el logo de la config

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
        {/* Aquí podrías añadir el tipo de factura (B/C) si tuvieras esa info */}
        <Text style={styles.invoiceSubtitle}>Documento no válido como factura fiscal</Text>

        <View style={styles.metaInfo}>
          <Text><Text style={styles.metaLabel}>Factura Nº:</Text> {invoiceData.invoice_number}</Text>
          <Text><Text style={styles.metaLabel}>Fecha:</Text> {new Date(invoiceData.created_at).toLocaleDateString()}</Text>
          {/* Aquí añadirías CUIT/Condición IVA si lo tuvieras */}
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.metaLabel}>Cliente:</Text>
          <Text>{invoiceData.customer_data?.full_name ?? 'N/A'}</Text>
          {/* Aquí añadirías Domicilio, CUIT del cliente si lo tuvieras */}
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
              <Text style={styles.colPrice}>${item.price?.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <Text style={styles.colTotal}>${(item.price * item.quantity).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
             {/* Aquí irían Subtotal, IVA, etc. si aplica */}
             <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text>TOTAL</Text>
              <Text>${invoiceData.total_amount?.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
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