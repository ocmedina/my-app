'use client'

import { useEffect, useState } from 'react'
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer'
import { supabase } from '@/lib/supabaseClient'

Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf', fontStyle: 'italic' },
  ],
})

const styles = StyleSheet.create({
  page: { fontFamily: 'Roboto', fontSize: 10, padding: 40, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  logo: { width: 60, height: 60, objectFit: 'contain' },
  companyInfo: { textAlign: 'right' },
  companyName: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  companyAddress: { fontSize: 9, color: '#666' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#333', marginBottom: 20 },
  metaInfo: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f5f5f5', padding: 12, borderRadius: 5, marginBottom: 20, fontSize: 9 },
  metaLabel: { fontWeight: 'bold' },
  table: { width: '100%' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderBottomColor: '#ddd', padding: 8 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center', minHeight: 24 },
  thProduct: { width: '55%', fontWeight: 'bold' },
  thQty: { width: '15%', fontWeight: 'bold', textAlign: 'center' },
  thPrice: { width: '15%', fontWeight: 'bold', textAlign: 'right' },
  thTotal: { width: '15%', fontWeight: 'bold', textAlign: 'right' },
  tdProduct: { width: '55%', padding: 8 },
  tdQty: { width: '15%', padding: 8, textAlign: 'center' },
  tdPrice: { width: '15%', padding: 8, textAlign: 'right' },
  tdTotal: { width: '15%', padding: 8, textAlign: 'right' },
  summaryContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  summaryBox: { width: 220 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { color: '#555' },
  summaryTotal: { fontWeight: 'bold', fontSize: 14 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: '#888', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  thankYou: { fontStyle: 'italic' }
})

export default function OrderPDFDocument({ order }: { order: any }) {
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('settings').select('key, value')
      if (error) {
        console.error('Error cargando settings:', error)
      } else {
        const mapped = Object.fromEntries(data.map((item: any) => [item.key, item.value]))
        setSettings(mapped)
      }
    }
    fetchSettings()
  }, [])

  const logoUrl = settings['logo_url'] || 'https://via.placeholder.com/150'
  const nombre = settings['business_name'] || 'FrontStock'
  const direccion = settings['business_address'] || 'Calle Falsa 123, Ciudad'
  const telefono = settings['business_phone'] || '0000-000000'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 🔹 Encabezado */}
        <View style={styles.header}>
          <Image style={styles.logo} src={logoUrl} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{nombre}</Text>
            <Text style={styles.companyAddress}>{direccion}</Text>
            <Text style={styles.companyAddress}>{telefono}</Text>
          </View>
        </View>

        <Text style={styles.title}>REMITO DE PEDIDO</Text>

        {/* 🔹 Datos del pedido */}
        <View style={styles.metaInfo}>
          <View>
            <Text style={styles.metaLabel}>Cliente:</Text>
            <Text>{order.customers?.full_name ?? 'N/A'}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.metaLabel}>Pedido Nº:</Text>
            <Text>{order.id?.substring(0, 8).toUpperCase()}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.metaLabel}>Fecha:</Text>
            <Text>{new Date(order.created_at).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* 🔹 Tabla de productos */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.thProduct}>Producto</Text>
            <Text style={styles.thQty}>Cant.</Text>
            <Text style={styles.thPrice}>P. Unit.</Text>
            <Text style={styles.thTotal}>Subtotal</Text>
          </View>
          {(order.order_items || []).map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tdProduct}>{item.products?.name ?? 'N/A'}</Text>
              <Text style={styles.tdQty}>{item.quantity}</Text>
              <Text style={styles.tdPrice}>${item.price?.toFixed(2)}</Text>
              <Text style={styles.tdTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* 🔹 Total */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <View style={[styles.summaryRow, { marginTop: 10 }]}>
              <Text style={[styles.summaryLabel, styles.summaryTotal]}>TOTAL</Text>
              <Text style={styles.summaryTotal}>${order.total_amount?.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* 🔹 Pie */}
        <View style={styles.footer}>
          <Text style={styles.thankYou}>¡Gracias por tu pedido!</Text>
        </View>
      </Page>
    </Document>
  )
}
