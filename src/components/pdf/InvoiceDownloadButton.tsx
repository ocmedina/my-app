"use client";

import { useEffect, useState, type ReactElement } from "react";
import { FaPrint, FaSpinner } from "react-icons/fa";

interface InvoiceDownloadButtonProps {
  invoiceData: any;
  settings: any;
  className?: string;
  fileName?: string;
  loadingLabel?: string;
  readyLabel?: string;
}

export default function InvoiceDownloadButton({
  invoiceData,
  settings,
  className = "inline-flex items-center gap-2 px-3 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700",
  fileName,
  loadingLabel = "Generando PDF...",
  readyLabel = "Descargar PDF",
}: InvoiceDownloadButtonProps) {
  const [isClient, setIsClient] = useState(false);
  const [LinkComponent, setLinkComponent] = useState<(() => ReactElement) | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsClient(true);

    Promise.all([import("@react-pdf/renderer"), import("./InvoicePDFDocument")])
      .then(([pdfModule, invoiceDocModule]) => {
        if (!mounted) return;

        const { PDFDownloadLink } = pdfModule;
        const InvoicePDFDocument = invoiceDocModule.default;

        const DownloadLink = () => (
          <PDFDownloadLink
            document={<InvoicePDFDocument invoiceData={invoiceData} settings={settings} />}
            fileName={
              fileName ||
              `factura_${invoiceData?.invoice_number || invoiceData?.id || "documento"}.pdf`
            }
            className={className}
          >
            {({ loading }: { loading: boolean }) =>
              loading ? (
                <>
                  <FaSpinner className="animate-spin" /> {loadingLabel}
                </>
              ) : (
                <>
                  <FaPrint /> {readyLabel}
                </>
              )
            }
          </PDFDownloadLink>
        );

        setLinkComponent(() => DownloadLink);
      })
      .catch((error) => {
        console.error("Error cargando PDF de factura:", error);
      });

    return () => {
      mounted = false;
    };
  }, [className, fileName, invoiceData, loadingLabel, readyLabel, settings]);

  if (!isClient || !LinkComponent) {
    return (
      <button disabled className={className + " opacity-60 cursor-not-allowed"}>
        <FaSpinner className="animate-spin" /> {loadingLabel}
      </button>
    );
  }

  const DownloadLink = LinkComponent;
  return <DownloadLink />;
}
