// src/app/dashboard/products/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import ProductActions from '@/components/ProductActions'
import { Database } from '@/lib/database.types'

type Product = Database['public']['Tables']['products']['Row']
const ITEMS_PER_PAGE = 10; // Puedes ajustar cuántos productos mostrar por página

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // 1. Obtenemos los productos de la página actual Y el conteo total
      const { data, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' }) // 'exact' nos da el total de filas
        .eq('is_active', true)
        .order('name', { ascending: true })
        .range(from, to); // <-- La magia de la paginación está aquí

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
        setTotalCount(count || 0);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [currentPage]); // Se vuelve a ejecutar cada vez que cambia la página

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Productos</h1>
        <Link href="/dashboard/products/new" className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
          + Agregar Producto
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* ... (el thead de la tabla no cambia) ... */}
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10">Cargando productos...</td></tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  {/* ... (las celdas <td> de la tabla no cambian) ... */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.price_minorista}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <ProductActions productId={product.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- COMPONENTE DE PAGINACIÓN --- */}
      <div className="mt-6 flex justify-between items-center">
        <span className="text-sm text-gray-700">
          Mostrando {products.length} de {totalCount} productos
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}