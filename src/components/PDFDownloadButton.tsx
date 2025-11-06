"use client";

import { useEffect, useState } from "react";
import { FaPrint, FaSpinner } from "react-icons/fa";

interface PDFDownloadButtonProps {
  orderData: any;
  printFormat: "A4" | "thermal";
}

export default function PDFDownloadButton({
  orderData,
  printFormat,
}: PDFDownloadButtonProps) {
  const [isClient, setIsClient] = useState(false);
  const [PDFLink, setPDFLink] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);

    // Cargar dinámicamente todos los componentes PDF
    Promise.all([
      import("@react-pdf/renderer"),
      import("./OrderPDFDocument"),
      import("./ThermalOrderPDFDocument"),
    ])
      .then(([pdfModule, orderDoc, thermalDoc]) => {
        const { PDFDownloadLink } = pdfModule;
        const OrderPDFDocument = orderDoc.default;
        const ThermalOrderPDFDocument = thermalDoc.default;

        // Seleccionar el documento según el formato
        const DocumentComponent =
          printFormat === "thermal"
            ? ThermalOrderPDFDocument
            : OrderPDFDocument;

        // Crear un componente wrapper que use PDFDownloadLink
        const LinkComponent = () => (
          <PDFDownloadLink
            document={<DocumentComponent order={orderData} />}
            fileName={`remito_${printFormat}_${orderData.id.substring(
              0,
              8
            )}.pdf`}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-lg"
          >
            {({ loading }: { loading: boolean }) =>
              loading ? (
                <>
                  <FaSpinner className="animate-spin" /> Generando PDF...
                </>
              ) : (
                <>
                  <FaPrint /> Descargar PDF
                </>
              )
            }
          </PDFDownloadLink>
        );

        setPDFLink(() => LinkComponent);
      })
      .catch((err) => {
        console.error("Error cargando componentes PDF:", err);
      });
  }, [orderData, printFormat]);

  if (!isClient || !PDFLink) {
    return (
      <button
        disabled
        className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-3 text-lg opacity-50"
      >
        <FaSpinner className="animate-spin" /> Cargando PDF...
      </button>
    );
  }

  const LinkComponent = PDFLink;
  return <LinkComponent />;
}
