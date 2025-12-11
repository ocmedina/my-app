
"use client";

import { useEffect, useState } from "react";
import { FaPrint, FaSpinner } from "react-icons/fa";

interface SaleTicketDownloadButtonProps {
    saleData: any;
    printFormat: "A4" | "thermal";
}

export default function SaleTicketDownloadButton({
    saleData,
    printFormat,
}: SaleTicketDownloadButtonProps) {
    const [isClient, setIsClient] = useState(false);
    const [PDFLink, setPDFLink] = useState<any>(null);

    useEffect(() => {
        setIsClient(true);

        // Cargar dinámicamente todos los componentes PDF
        Promise.all([
            import("@react-pdf/renderer"),
            import("./SalePDFDocument"),
            import("./ThermalSalePDFDocument"),
        ])
            .then(([pdfModule, saleDoc, thermalDoc]) => {
                const { PDFDownloadLink } = pdfModule;
                const SalePDFDocument = saleDoc.default;
                const ThermalSalePDFDocument = thermalDoc.default;

                // Seleccionar el documento según el formato
                const DocumentComponent =
                    printFormat === "thermal"
                        ? ThermalSalePDFDocument
                        : SalePDFDocument;

                // Crear un componente wrapper que use PDFDownloadLink
                const LinkComponent = () => (
                    <PDFDownloadLink
                        document={<DocumentComponent sale={saleData} />}
                        fileName={`ticket_${printFormat}_${saleData.id.substring(
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
    }, [saleData, printFormat]);

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
