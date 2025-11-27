// src/app/dashboard/products/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  FaBarcode,
  FaTag,
  FaDollarSign,
  FaCubes,
  FaSave,
  FaTimes,
  FaBoxOpen,
  FaStoreAlt,
  FaWarehouse,
} from "react-icons/fa";
import toast from "react-hot-toast";

export default function NewProductPage() {
  const router = useRouter();
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [priceMinorista, setPriceMinorista] = useState("");
  const [priceMayorista, setPriceMayorista] = useState("");
  const [stock, setStock] = useState("");
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: brandsData } = await supabase
        .from("brands")
        .select("id, name")
        .order("name");
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");

      if (brandsData) setBrands(brandsData);
      if (categoriesData) setCategories(categoriesData);
    };
    fetchData();
  }, []);

  const generateBarcode = () => {
    // Generar un código EAN-13 ficticio (13 dígitos)
    // Prefijo interno 200 + timestamp parcial + random
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const code = `200${timestamp}${random}`;

    // Calcular dígito verificador (simple)
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;

    setBarcode(`${code}${checkDigit}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sku || !name || !priceMinorista || !priceMayorista || !stock) {
      toast.error("Por favor, completa todos los campos obligatorios.");
      return;
    }

    const loadingToast = toast.loading("Creando producto...");

    const { data, error } = await supabase.from("products").insert([
      {
        sku,
        barcode: barcode || null,
        name,
        price_minorista: parseFloat(priceMinorista),
        price_mayorista: parseFloat(priceMayorista),
        stock: parseInt(stock, 10),
        brand_id: selectedBrand ? parseInt(selectedBrand) : null,
        category_id: selectedCategory ? parseInt(selectedCategory) : null,
      },
    ]);

    if (error) {
      toast.error(`Error al crear el producto: ${error.message}`, {
        id: loadingToast,
      });
      console.error(error);
    } else {
      toast.success("✅ Producto creado exitosamente", { id: loadingToast });
      router.push("/dashboard/products");
      router.refresh();
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <FaBoxOpen className="text-blue-600" /> Agregar Nuevo Producto
          </h1>
          <p className="text-gray-600 mt-2">
            Completa la información del producto para agregarlo al inventario
          </p>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECCIÓN: CÓDIGOS */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaTag className="text-blue-600" /> Identificación
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SKU */}
              <div>
                <label
                  htmlFor="sku"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
                >
                  <FaBarcode className="text-blue-500" /> SKU (Código Interno)
                </label>
                <input
                  type="text"
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  required
                  placeholder="Ej: PROD-001"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                />
              </div>

              {/* Barcode */}
              <div>
                <label
                  htmlFor="barcode"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
                >
                  <FaBarcode className="text-purple-500" /> Código de Barras
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Escanear o generar..."
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="px-4 py-2 bg-gray-100 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-200 transition-all font-semibold text-sm"
                    title="Generar código aleatorio"
                  >
                    Generar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Deja vacío si no tiene. Usa el botón para crear uno nuevo.
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN: INFORMACIÓN BÁSICA */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaBoxOpen className="text-green-600" /> Detalles del Producto
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {/* Nombre */}
              <div>
                <label
                  htmlFor="name"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN: CLASIFICACIÓN */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaTag className="text-purple-600" /> Clasificación
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Marca */}
              <div>
                <label
                  htmlFor="brand"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
                >
                  Marca
                </label>
                <select
                  id="brand"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                >
                  <option value="">Seleccionar Marca...</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Agrupar por marca ayuda en las órdenes de compra.
                </p>
              </div>

              {/* Categoría */}
              <div>
                <label
                  htmlFor="category"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
                >
                  Categoría
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                >
                  <option value="">Seleccionar Categoría...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECCIÓN: PRECIOS Y STOCK */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaDollarSign className="text-green-600" /> Precios y Stock
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Precio Minorista */}
              <div>
                <label
                  htmlFor="priceMinorista"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
                >
                  <FaStoreAlt className="text-orange-500" /> Precio Minorista
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">
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
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Precio para clientes minoristas
                </p>
              </div>

              {/* Precio Mayorista */}
              <div>
                <label
                  htmlFor="priceMayorista"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
                >
                  <FaWarehouse className="text-purple-500" /> Precio Mayorista
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">
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
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Precio para clientes mayoristas
                </p>
              </div>

              {/* Stock */}
              <div>
                <label
                  htmlFor="stock"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
                >
                  <FaCubes className="text-blue-500" /> Stock Inicial
                </label>
                <input
                  type="number"
                  id="stock"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  placeholder="0"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cantidad de unidades disponibles
                </p>
              </div>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all shadow-sm hover:shadow-md font-semibold flex items-center justify-center gap-2"
              >
                <FaTimes /> Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all font-semibold flex items-center justify-center gap-2"
              >
                <FaSave /> Guardar Producto
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
