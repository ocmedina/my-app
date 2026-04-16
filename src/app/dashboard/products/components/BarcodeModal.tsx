
import { useState, useRef, useEffect } from "react";
import { FaPrint, FaSearch, FaTimes, FaBarcode, FaPlus, FaTrash } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/lib/database.types";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";
import toast from "react-hot-toast";

type Product = Database["public"]["Tables"]["products"]["Row"];

interface BarcodeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface QueueItem {
    product: Product;
    quantity: number;
}

export default function BarcodeModal({ isOpen, onClose }: BarcodeModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(false);

    const componentRef = useRef<HTMLDivElement>(null);

    // Search products
    useEffect(() => {
        const searchProducts = async () => {
            if (!searchTerm.trim()) {
                setProducts([]);
                return;
            }

            setLoading(true);
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("is_active", true)
                .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
                .limit(10);

            if (error) {
                console.error(error);
            } else {
                setProducts(data || []);
            }
            setLoading(false);
        };

        const timeoutId = setTimeout(() => {
            searchProducts();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const addToQueue = (product: Product) => {
        setQueue((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
        toast.success("Agregado a la cola de impresión");
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) return;
        setQueue((prev) =>
            prev.map((item) =>
                item.product.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const removeFromQueue = (productId: string) => {
        setQueue((prev) => prev.filter((item) => item.product.id !== productId));
    };

    const clearQueue = () => {
        setQueue([]);
        setSearchTerm("");
        setProducts([]);
    };

    // Force cast options to any to avoid type mismatches with different react-to-print versions
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: "Etiquetas_Productos",
    } as any);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col m-4">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-3">
                        <FaBarcode className="text-blue-600" /> Imprimir Etiquetas
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left Panel: Search & Queue */}
                    <div className="w-full lg:w-1/3 border-r border-gray-200 dark:border-slate-700 flex flex-col bg-gray-50 dark:bg-slate-950">
                        {/* Search */}
                        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar producto..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>

                            {/* Search Results */}
                            {searchTerm && (
                                <div className="mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                                    {loading ? (
                                        <div className="p-3 text-center text-sm text-gray-500">Buscando...</div>
                                    ) : products.length === 0 ? (
                                        <div className="p-3 text-center text-sm text-gray-500">No se encontraron productos</div>
                                    ) : (
                                        products.map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={() => addToQueue(p)}
                                                className="w-full text-left p-2 hover:bg-blue-50 dark:hover:bg-slate-700 flex flex-col border-b border-gray-100 dark:border-slate-700 last:border-0"
                                            >
                                                <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{p.name}</span>
                                                <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400">
                                                    <span>SKU: {p.sku}</span>
                                                    <span className="font-bold text-green-600">${p.price_minorista}</span>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Queue List */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-gray-700 dark:text-slate-300">Cola de Impresión</h3>
                                {queue.length > 0 && (
                                    <button onClick={clearQueue} className="text-xs text-red-500 hover:text-red-700 font-medium">
                                        Limpiar Todo
                                    </button>
                                )}
                            </div>

                            {queue.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <p>Agrega productos para imprimir</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {queue.map((item) => (
                                        <div key={item.product.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col gap-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-bold text-gray-800 dark:text-slate-200 truncate pr-2">
                                                    {item.product.name}
                                                </span>
                                                <button onClick={() => removeFromQueue(item.product.id)} className="text-gray-400 hover:text-red-500">
                                                    <FaTimes />
                                                </button>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-slate-400">SKU: {item.product.sku}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Cant:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                                                    className="w-16 p-1 text-sm border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 text-center"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Preview */}
                    <div className="flex-1 bg-gray-100 dark:bg-slate-800 p-8 overflow-y-auto flex flex-col items-center">
                        <div className="mb-4 text-center">
                            <h3 className="text-lg font-bold text-gray-700 dark:text-slate-200 mb-1">Vista Previa</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                Así es como se verán tus etiquetas al imprimir.
                            </p>
                        </div>

                        {/* Print Area Preview */}
                        <div className="bg-white shadow-xl p-8 min-h-[297mm] w-[210mm] origin-top transform scale-75 md:scale-90 lg:scale-100 transition-transform">
                            <div ref={componentRef} className="print-area grid grid-cols-3 gap-4">
                                {queue.flatMap((item) =>
                                    Array.from({ length: item.quantity }).map((_, idx) => (
                                        <div
                                            key={`${item.product.id}-${idx}`}
                                            className="border-2 border-dashed border-gray-300 p-2 flex flex-col items-center justify-center text-center h-[3.5cm] rounded bg-white page-break-inside-avoid"
                                        >
                                            <span className="text-xs font-bold truncate w-full px-1 mb-1 text-black">
                                                {item.product.name}
                                            </span>
                                            <div className="w-full flex justify-center overflow-hidden">
                                                <Barcode
                                                    value={item.product.sku || item.product.id.substring(0, 8)}
                                                    width={1.5}
                                                    height={40}
                                                    fontSize={10}
                                                    margin={0}
                                                />
                                            </div>
                                            <span className="text-lg font-black mt-1 text-black">
                                                ${item.product.price_minorista?.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    ))
                                )}
                                {queue.length === 0 && (
                                    <div className="col-span-3 text-center py-20 text-gray-300 italic">
                                        La vista previa aparecerá aquí...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={queue.length === 0}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaPrint /> Imprimir Etiquetas
                    </button>
                </div>
            </div>

            <style jsx global>{`
      @media print {
        @page {
          size: auto;
          margin: 10mm;
        }
        body * {
          visibility: hidden;
        }
        .print-area, .print-area * {
          visibility: visible;
        }
        .print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .print-area > div {
           border-style: solid !important;
           border-width: 1px !important;
           border-color: #ddd !important;
        }
      }
    `}</style>
        </div>
    );
}
