// src/app/dashboard/products/edit/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import { Database } from "@/lib/database.types";
import {
  FaBarcode,
  FaTag,
  FaDollarSign,
  FaCubes,
  FaSave,
  FaTimes,
  FaEdit,
  FaStoreAlt,
  FaWarehouse,
  FaLayerGroup,
} from "react-icons/fa";
import toast from "react-hot-toast";

type Product = Database["public"]["Tables"]["products"]["Row"];

// Se eliminan los props de la función
export default function EditProductPage() {
  const router = useRouter();
  const params = useParams(); // <-- Se usa el hook para obtener los params
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);

  // Estados para cada campo del formulario
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [priceMinorista, setPriceMinorista] = useState("");
  const [priceMayorista, setPriceMayorista] = useState("");
  const [stock, setStock] = useState("");
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: brandsData } = await supabase
        .from("brands")
        .select("*")
        .order("name");
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (brandsData) setBrands(brandsData);
      if (categoriesData) setCategories(categoriesData);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setProduct(data);
        // Llenamos los estados del formulario con los datos del producto
        setSku(data.sku);
        setName(data.name);
        setCostPrice(data.cost_price?.toString() || "");
        setPriceMinorista(data.price_minorista?.toString() || "");
        setPriceMayorista(data.price_mayorista?.toString() || "");
        setStock(data.stock?.toString() || "");
        setSelectedBrand(data.brand_id?.toString() || "");
        setSelectedCategory(data.category_id?.toString() || "");
      } else {
        console.error("Error fetching product:", error);
        router.push("/dashboard/products");
      }
    };

    fetchProduct();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sku || !name || !priceMinorista || !priceMayorista || !stock) {
      toast.error("Por favor, completa todos los campos.");
      return;
    }

    const loadingToast = toast.loading("Actualizando producto...");

    try {
      // 1. Actualizar datos básicos (excluyendo stock si cambió)
      const currentStock = product?.stock || 0;
      const newStock = parseInt(stock, 10);
      const stockDiff = newStock - currentStock;

      const updateData: any = {
        sku,
        name,
        cost_price: costPrice ? parseFloat(costPrice) : null,
        price_minorista: parseFloat(priceMinorista),
        price_mayorista: parseFloat(priceMayorista),
        brand_id: selectedBrand ? parseInt(selectedBrand) : null,
        category_id: selectedCategory ? parseInt(selectedCategory) : null,
      };

      // Si el stock NO cambió, lo incluimos en el update normal para asegurarnos (aunque sea redundante)
      // Si SÍ cambió, lo manejamos con el RPC
      if (stockDiff === 0) {
        updateData.stock = newStock;
      }

      const { error: updateError } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      // 2. Si hubo cambio de stock, registrar el movimiento
      if (stockDiff !== 0) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { error: movementError } = await supabase.rpc(
          "log_stock_movement",
          {
            p_product_id: id,
            p_movement_type: "ajuste_manual",
            p_quantity: stockDiff,
            p_user_id: user?.id || null,
            p_notes: "Ajuste manual desde edición de producto",
          }
        );

        if (movementError) throw movementError;
      }

      toast.success("✅ Producto actualizado exitosamente", {
        id: loadingToast,
      });
      router.push("/dashboard/products");
      router.refresh();
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast.error(`Error al actualizar: ${error.message}`, {
        id: loadingToast,
      });
    }
  };

  if (!product) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-950 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="text-gray-500 dark:text-slate-400 font-medium">
            Cargando producto...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-950 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <FaEdit className="text-blue-600" /> Editar Producto
          </h1>
          <p className="text-gray-600 dark:text-slate-300 mt-2">
            Actualiza la información de:{" "}
            <span className="font-semibold text-gray-800 dark:text-slate-100">{product.name}</span>
          </p>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECCIÓN: INFORMACIÓN BÁSICA */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <FaTag className="text-blue-600" /> Información Básica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SKU */}
              <div>
                <label
                  htmlFor="sku"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2"
                >
                  <FaBarcode className="text-blue-500" /> SKU (Código)
                </label>
                <input
                  type="text"
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  required
                  placeholder="Ej: PROD-001"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                />
              </div>

              {/* Nombre */}
              <div>
                <label
                  htmlFor="name"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2"
                >
                  <FaTag className="text-green-500" /> Nombre del Producto
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ej: Alimento para perros 15kg"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Marca */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                  <FaTag className="text-purple-500" /> Marca
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Seleccionar Marca</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categoría */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                  <FaLayerGroup className="text-indigo-500" /> Categoría
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Seleccionar Categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECCIÓN: PRECIOS Y STOCK */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <FaDollarSign className="text-green-600" /> Precios y Stock
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Costo */}
              <div>
                <label
                  htmlFor="costPrice"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2"
                >
                  <FaDollarSign className="text-gray-500" /> Costo
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    id="costPrice"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Costo de adquisición
                </p>
              </div>

              {/* Precio Minorista */}
              <div>
                <label
                  htmlFor="priceMinorista"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2"
                >
                  <FaStoreAlt className="text-orange-500" /> Precio Minorista
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    id="priceMinorista"
                    value={priceMinorista}
                    onChange={(e) => setPriceMinorista(e.target.value)}
                    required
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Precio para clientes minoristas
                </p>
              </div>

              {/* Precio Mayorista */}
              <div>
                <label
                  htmlFor="priceMayorista"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2"
                >
                  <FaWarehouse className="text-purple-500" /> Precio Mayorista
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    id="priceMayorista"
                    value={priceMayorista}
                    onChange={(e) => setPriceMayorista(e.target.value)}
                    required
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Precio para clientes mayoristas
                </p>
              </div>

              {/* Stock */}
              <div>
                <label
                  htmlFor="stock"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2"
                >
                  <FaCubes className="text-blue-500" /> Stock Actual
                </label>
                <input
                  type="number"
                  id="stock"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  placeholder="0"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Cantidad de unidades disponibles
                </p>
              </div>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 dark:text-slate-200 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all shadow-sm hover:shadow-md font-semibold flex items-center justify-center gap-2"
              >
                <FaTimes /> Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all font-semibold flex items-center justify-center gap-2"
              >
                <FaSave /> Actualizar Producto
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
