"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  FaShoppingCart,
  FaPrint,
  FaFilePdf,
  FaExclamationTriangle,
} from "react-icons/fa";
import toast from "react-hot-toast";

type Product = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  stock_minimo: number | null;
  brand_id: number | null;
  price_mayorista: number | null;
  brands: {
    name: string;
  } | null;
};

type BrandGroup = {
  brandId: number | null;
  brandName: string;
  products: Product[];
};

export default function GenerateOrderPage() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<BrandGroup[]>([]);
  const [orderQuantities, setOrderQuantities] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    setLoading(true);
    try {
      // 1. Fetch all active products
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          brands (name)
        `
        )
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      if (data) {
        // 2. Filter low stock in JS
        const lowStockProducts = data.filter((p: any) => {
          const threshold = p.stock_minimo ?? 10; // Default threshold 10 if not set
          return p.stock <= threshold;
        });

        // 3. Initialize quantities
        const initialQuantities: Record<string, number> = {};
        lowStockProducts.forEach((p: any) => {
          const threshold = p.stock_minimo ?? 10;
          // Suggest ordering enough to reach 2x the threshold
          const suggested = Math.max(0, threshold * 2 - p.stock);
          initialQuantities[p.id] = suggested;
        });
        setOrderQuantities(initialQuantities);

        // 4. Group by Brand
        const grouped: Record<string, BrandGroup> = {};

        lowStockProducts.forEach((p: any) => {
          const brandId = p.brand_id || "unknown";
          const brandName = p.brands?.name || "Sin Marca / Proveedor";

          if (!grouped[brandId]) {
            grouped[brandId] = {
              brandId: p.brand_id,
              brandName: brandName,
              products: [],
            };
          }
          grouped[brandId].products.push(p);
        });

        setGroups(Object.values(grouped));
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const qty = parseInt(value) || 0;
    setOrderQuantities((prev) => ({
      ...prev,
      [productId]: qty,
    }));
  };

  const calculateGroupTotal = (products: Product[]) => {
    return products.reduce((total, product) => {
      const qty = orderQuantities[product.id] || 0;
      const cost = product.price_mayorista || 0;
      return total + qty * cost;
    }, 0);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen print:bg-white print:p-0">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FaShoppingCart className="text-blue-600" /> Generar Órdenes de
              Compra
            </h1>
            <p className="text-gray-600 mt-2">
              Lista de productos con stock bajo. Ajusta las cantidades antes de
              imprimir.
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg font-semibold flex items-center gap-2"
          >
            <FaPrint /> Imprimir / Guardar PDF
          </button>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-8">
          <div className="flex justify-between items-end border-b-2 border-gray-800 pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">
                Orden de Compra
              </h1>
              <p className="text-gray-600 mt-1">
                Fecha: {new Date().toLocaleDateString("es-AR")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-800">Solicitado por:</p>
              <div className="h-8 border-b border-gray-400 w-48"></div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-200">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <FaShoppingCart className="text-4xl text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800">¡Todo en orden!</h3>
            <p className="text-gray-600 mt-2">
              No hay productos con stock bajo en este momento.
            </p>
          </div>
        ) : (
          <div className="space-y-10 print:space-y-12">
            {groups.map((group) => (
              <div
                key={group.brandId || "unknown"}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 print:shadow-none print:border-none break-inside-avoid"
              >
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 print:bg-gray-200 print:border-gray-400 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    {group.brandName}
                  </h2>
                  <span className="text-sm font-semibold text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-300 print:border-gray-400">
                    {group.products.length} items
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 print:bg-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-24 print:hidden">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-32">
                          Costo Unit.
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-32">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-32">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {group.products.map((product) => {
                        const qty = orderQuantities[product.id] || 0;
                        const cost = product.price_mayorista || 0;
                        const subtotal = qty * cost;

                        return (
                          <tr
                            key={product.id}
                            className="hover:bg-gray-50 print:hover:bg-transparent"
                          >
                            <td className="px-4 py-3 text-sm font-mono text-gray-600">
                              {product.sku}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                              {product.name}
                            </td>
                            <td className="px-4 py-3 text-center print:hidden">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  product.stock === 0
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {product.stock}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-600">
                              ${cost.toLocaleString("es-AR")}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {/* Input for screen */}
                              <input
                                type="number"
                                min="0"
                                value={qty}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    product.id,
                                    e.target.value
                                  )
                                }
                                className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 print:hidden"
                              />
                              {/* Text for print */}
                              <span className="hidden print:inline font-bold text-lg">
                                {qty}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                              ${subtotal.toLocaleString("es-AR")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 print:bg-gray-100 border-t-2 border-gray-300">
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-3 text-right text-sm font-bold text-gray-700 uppercase"
                        >
                          Total Estimado:
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                          $
                          {calculateGroupTotal(group.products).toLocaleString(
                            "es-AR"
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}

            {/* Print Footer */}
            <div className="hidden print:block mt-12 pt-8 border-t border-gray-300">
              <div className="flex justify-between">
                <div className="text-center">
                  <div className="h-24 w-48 border-b border-gray-400 mb-2"></div>
                  <p className="text-sm text-gray-600">Firma Solicitante</p>
                </div>
                <div className="text-center">
                  <div className="h-24 w-48 border-b border-gray-400 mb-2"></div>
                  <p className="text-sm text-gray-600">Firma Autorización</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
