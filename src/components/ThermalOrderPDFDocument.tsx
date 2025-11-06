"use client";

import { useEffect, useState } from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { supabase } from "@/lib/supabaseClient";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold",
    },
  ],
});

// 80mm = 226.77pt (ancho)
// La altura es dinámica según el contenido
const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    padding: 15,
    backgroundColor: "#fff",
    width: 226.77,
  },
  header: {
    textAlign: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderBottomStyle: "dashed",
    paddingBottom: 8,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 3,
  },
  companyInfo: {
    fontSize: 8,
    color: "#333",
    marginBottom: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 8,
    backgroundColor: "#000",
    color: "#fff",
    padding: 5,
  },
  section: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderBottomStyle: "dashed",
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
    fontSize: 9,
  },
  label: {
    fontWeight: "bold",
    width: "35%",
  },
  value: {
    width: "65%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 5,
    fontWeight: "bold",
    fontSize: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    fontSize: 8,
  },
  colProduct: {
    width: "50%",
    paddingRight: 3,
  },
  colQty: {
    width: "15%",
    textAlign: "center",
  },
  colPrice: {
    width: "17.5%",
    textAlign: "right",
    paddingRight: 3,
  },
  colTotal: {
    width: "17.5%",
    textAlign: "right",
  },
  totalSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#000",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "bold",
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
  footer: {
    textAlign: "center",
    fontSize: 8,
    marginTop: 15,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#000",
    borderTopStyle: "dashed",
  },
  footerText: {
    marginBottom: 2,
  },
  thankYou: {
    fontWeight: "bold",
    marginTop: 5,
    fontSize: 9,
  },
});

export default function ThermalOrderPDFDocument({ order }: { order: any }) {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value");
      if (error) {
        console.error("Error cargando settings:", error);
      } else {
        const mapped = Object.fromEntries(
          data.map((item: any) => [item.key, item.value])
        );
        setSettings(mapped);
      }
    };
    fetchSettings();
  }, []);

  const nombre = settings["business_name"] || "FrontStock";
  const direccion = settings["business_address"] || "Calle Falsa 123, Ciudad";
  const telefono = settings["business_phone"] || "0000-000000";

  return (
    <Document>
      <Page size={{ width: 226.77, height: 841.89 }} style={styles.page}>
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{nombre}</Text>
          <Text style={styles.companyInfo}>{direccion}</Text>
          <Text style={styles.companyInfo}>{telefono}</Text>
        </View>

        <Text style={styles.title}>REMITO DE PEDIDO</Text>

        {/* Datos del pedido */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Cliente:</Text>
            <Text style={styles.value}>
              {order.customers?.full_name ?? "N/A"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pedido Nº:</Text>
            <Text style={styles.value}>
              {order.id?.substring(0, 8).toUpperCase()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha:</Text>
            <Text style={styles.value}>
              {new Date(order.created_at).toLocaleDateString()}{" "}
              {new Date(order.created_at).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* Tabla de productos */}
        <View style={styles.tableHeader}>
          <Text style={styles.colProduct}>Producto</Text>
          <Text style={styles.colQty}>Cant.</Text>
          <Text style={styles.colPrice}>P.Unit</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>

        {(order.order_items || []).map((item: any, index: number) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.colProduct}>
              {item.products?.name ?? "N/A"}
            </Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>${item.price?.toFixed(2)}</Text>
            <Text style={styles.colTotal}>
              ${(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalAmount}>
              ${order.total_amount?.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Pie */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Conserve este comprobante</Text>
          <Text style={styles.thankYou}>¡Gracias por su compra!</Text>
        </View>
      </Page>
    </Document>
  );
}
