"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import ProductActions from "@/components/ProductActions";
import { Database } from "@/lib/database.types";
import {
  FaUpload,
  FaSearch,
  FaPlus,
  FaBoxes,
  FaBarcode,
  FaTag,
  FaDollarSign,
  FaCubes,
  FaChevronLeft,
  FaChevronRight,
  FaChartBar,
  FaInbox,
} from "react-icons/fa";

type Product = Database["public"]["Tables"]["products"]["Row"];
const ITEMS_PER_PAGE = 10;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  // Obtener rol del usuario una sola vez
  useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
        }
      }
    };
    fetchUserRole();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("products")
        .select("*", { count: "exact" })
        .eq("is_active", true)
        .order("name", { ascending: true });

      // Si hay un término de búsqueda, filtrar
      if (searchTerm.trim()) {
        query = query.or(
          `name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`
        );
      }

      const { data, error, count } = await query.range(from, to);

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data || []);
        setTotalCount(count || 0);
      }
      setLoading(false);
    };

    // Debounce para la búsqueda
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm]);

  // Resetear a página 1 cuando se busca
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <FaBoxes className="text-blue-600" /> Gestión de Productos
          </h1>
          <p className="text-gray-600 mt-1">
            Administra tu inventario y precios
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/products/importar"
            className="px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all font-semibold flex items-center gap-2"
          >
            <FaUpload /> Importar Excel
          </Link>
          <Link
            href="/dashboard/products/new"
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all font-semibold flex items-center gap-2"
          >
            <FaPlus /> Agregar Producto
          </Link>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="bg-white rounded-xl shadow-lg mb-6 p-6 border border-gray-200">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Buscar productos por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-700 font-medium"
          />
        </div>
        {searchTerm && (
          <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
            <FaSearch className="text-blue-500" />
            Buscando:{" "}
            <span className="font-semibold text-blue-600">"{searchTerm}"</span>
          </div>
        )}
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaBarcode /> SKU
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaTag /> Nombre
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaDollarSign /> Precio Minorista
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaCubes /> Stock
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <span className="text-gray-500 font-medium">
                        Cargando productos...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <FaInbox className="text-6xl text-gray-300" />
                      <span className="text-gray-500 font-medium">
                        {searchTerm
                          ? "No se encontraron productos con ese criterio"
                          : "No hay productos registrados"}
                      </span>
                      {searchTerm && (
                        <span className="text-gray-400 text-sm">
                          Intenta con otro término de búsqueda
                        </span>
                      )}
                      {!searchTerm && (
                        <Link
                          href="/dashboard/products/new"
                          className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium flex items-center gap-2"
                        >
                          <FaPlus /> Agregar primer producto
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FaBarcode className="text-gray-400" />
                        <span className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                          {product.sku}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {product.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm font-bold text-green-600">
                        <FaDollarSign />
                        {product.price_minorista?.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                          product.stock <= 10
                            ? "bg-red-100 text-red-800 border border-red-300"
                            : product.stock <= 50
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                            : "bg-green-100 text-green-800 border border-green-300"
                        }`}
                      >
                        <FaCubes />
                        {product.stock} unidades
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <ProductActions
                        productId={product.id}
                        userRole={userRole}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINACIÓN */}
      <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2">
              <FaChartBar className="text-blue-600" />
              Mostrando{" "}
              <span className="font-bold text-blue-600">
                {products.length > 0
                  ? (currentPage - 1) * ITEMS_PER_PAGE + 1
                  : 0}
              </span>{" "}
              -{" "}
              <span className="font-bold text-blue-600">
                {(currentPage - 1) * ITEMS_PER_PAGE + products.length}
              </span>{" "}
              de <span className="font-bold">{totalCount}</span> productos
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-5 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:from-gray-200 hover:to-gray-300 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <FaChevronLeft /> Anterior
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
              <span className="text-sm font-semibold text-gray-700">
                Página{" "}
                <span className="text-blue-600 text-lg">{currentPage}</span> de{" "}
                <span className="text-gray-900">{Math.max(1, totalPages)}</span>
              </span>
            </div>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="px-5 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:from-gray-200 hover:to-gray-300 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              Siguiente <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
