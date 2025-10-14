// src/components/SalePDFDocument.tsx
'use client'

import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

// --- REGISTRO DE FUENTES ---
// Esto le enseña a react-pdf dónde encontrar la fuente Roboto.
// Es importante para que el diseño sea consistente.
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ],
});

// --- ESTILOS MEJORADOS ---
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 11,
    padding: 40,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
  },
  companyDetails: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  documentTitle: {
    fontSize: 14,
    color: '#555',
  },
  customerInfo: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 5,
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    width: 80,
    fontWeight: 'bold',
    color: '#555',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6', // Un azul para el encabezado
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    color: 'white',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
    minHeight: 30,
  },
  colProduct: { width: '45%', padding: 8 },
  colQty: { width: '15%', padding: 8, textAlign: 'center' },
  colPrice: { width: '20%', padding: 8, textAlign: 'right' },
  colTotal: { width: '20%', padding: 8, textAlign: 'right' },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  summaryBox: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
  },
  summaryLabel: {
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#888',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
});

export default function SalePDFDocument({ sale }: { sale: any }) {
  // URL de tu logo. Reemplázala por la tuya.
  const logoUrl = 'https://via.placeholder.com/150'; // <-- REEMPLAZA ESTA URL

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image style={styles.logo} src={logoUrl} />
          <View style={styles.companyDetails}>
            <Text style={styles.companyName}>FrontStock</Text>
            <Text style={styles.documentTitle}>Nota de Venta / Remito</Text>
          </View>
        </View>

        <View style={styles.customerInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cliente:</Text>
            <Text>{sale.customers?.full_name ?? 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha:</Text>
            <Text>{new Date(sale.created_at).toLocaleString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Venta ID:</Text>
            <Text>{sale.id.substring(0, 8)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colProduct}>Producto</Text>
            <Text style={styles.colQty}>Cantidad</Text>
            <Text style={styles.colPrice}>Precio Unit.</Text>
            <Text style={styles.colTotal}>Subtotal</Text>
          </View>
          {(sale.sale_items || []).map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colProduct}>{item.products?.name ?? 'N/A'}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>${item.price?.toFixed(2)}</Text>
              <Text style={styles.colTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>TOTAL</Text>
              <Text>${sale.total_amount?.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>¡Gracias por tu compra!</Text>
          <Text>Dirección del Negocio - Teléfono - Email</Text>
        </View>
      </Page>
    </Document>
  );
}