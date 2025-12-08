"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  FaTimes,
  FaSave,
  FaPercentage,
  FaExclamationTriangle,
} from "react-icons/fa";
import toast from "react-hot-toast";

interface MassUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Supplier = {
  id: string;
  name: string;
};

type Category = {
  id: number;
  name: string;
};

export default function MassUpdateModal({
  isOpen,
  onClose,
  onSuccess,
}: MassUpdateModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [percentage, setPercentage] = useState("");
  const [priceType, setPriceType] = useState<
    "minorista" | "mayorista" | "both"
  >("both");
  const [loading, setLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const fetchFilters = async () => {
    try {
      const { data: suppliersData } = await supabase
        .from("brands")
        .select("id, name")
        .order("name");

      const { data: categoriesData } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");

      if (suppliersData) setSuppliers(suppliersData);
      if (categoriesData) setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  };

  const calculateAffectedProducts = async () => {
    try {
      let query = supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      if (selectedSupplier) {
        query = query.eq("brand_id", selectedSupplier);
      }

      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }

      const { count } = await query;
      setPreviewCount(count || 0);
    } catch (error) {
      console.error("Error calculating affected products:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFilters();
    }
  }, [isOpen]);

  // Calcular productos afectados cuando cambian los filtros
  useEffect(() => {
    if (isOpen) {
      calculateAffectedProducts();
    }
  }, [selectedSupplier, selectedCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!percentage) {
      toast.error("Ingrese un porcentaje");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Actualizando precios...");

    try {
      // 1. Obtener productos a actualizar
      let query = supabase
        .from("products")
        .select("id, price_minorista, price_mayorista")
        .eq("is_active", true);

      if (selectedSupplier) query = query.eq("brand_id", selectedSupplier);
      if (selectedCategory) query = query.eq("category_id", selectedCategory);

      const { data: productsToUpdate, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      if (!productsToUpdate || productsToUpdate.length === 0) {
        toast.error("No hay productos para actualizar", { id: toastId });
        setLoading(false);
        return;
      }

      // 2. Calcular nuevos precios y actualizar
      const factor = 1 + parseFloat(percentage) / 100;

      // Supabase no soporta update masivo con valores calculados diferentes por fila fácilmente en una query simple
      // sin usar funciones RPC. Haremos un loop o promesas paralelas.
      // Para < 1000 productos, promesas paralelas está bien.

      const updates = productsToUpdate.map((product) => {
        const updates: any = {};

        if (priceType === "minorista" || priceType === "both") {
          updates.price_minorista =
            Math.round((product.price_minorista || 0) * factor * 100) / 100;
        }

        if (priceType === "mayorista" || priceType === "both") {
          updates.price_mayorista =
            Math.round((product.price_mayorista || 0) * factor * 100) / 100;
        }

        return supabase.from("products").update(updates).eq("id", product.id);
      });

      await Promise.all(updates);

      toast.success(`Se actualizaron ${productsToUpdate.length} productos`, {
        id: toastId,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating prices:", error);
      toast.error("Error al actualizar: " + error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaPercentage /> Actualización Masiva de Precios
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-yellow-600 mt-1" />
              <div>
                <p className="text-sm text-yellow-800 font-bold">¡Atención!</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Esta acción modificará los precios permanentemente. Asegúrese
                  de filtrar correctamente.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Filtro Marca/Proveedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Marca / Proveedor
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Todas las marcas</option>
                {/* Usamos la lista de proveedores como marcas por ahora, o deberíamos cargar marcas reales */}
                {/* En el código original se cargaban 'suppliers' pero se usaban como marcas en algunos contextos? */}
                {/* Vamos a cargar 'brands' mejor si existen, pero el usuario pidió Proveedor. */}
                {/* Asumiremos que suppliers se mapean a brands o viceversa. */}
                {/* Por ahora mostramos lo que cargamos en fetchFilters (suppliers) pero lo usamos como brand_id */}
                {/* Esto es un riesgo, pero necesario sin schema claro. */}
                {/* CORRECCIÓN: Usaré 'brands' en fetchFilters para ser consistente con database.types */}
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Porcentaje */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Porcentaje de Aumento
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="w-full pl-4 pr-8 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                  placeholder="0"
                  step="0.01"
                />
                <span className="absolute right-3 top-3 text-gray-400 font-bold">
                  %
                </span>
              </div>
            </div>

            {/* Tipo de Precio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Precio a Actualizar
              </label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="both">Ambos Precios</option>
                <option value="minorista">Solo Minorista</option>
                <option value="mayorista">Solo Mayorista</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-center">
            <p className="text-sm text-gray-600 dark:text-slate-300">Productos afectados:</p>
            <p className="text-3xl font-bold text-blue-600">
              {previewCount !== null ? previewCount : "..."}
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-slate-200 font-medium hover:bg-gray-200 dark:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !percentage || previewCount === 0}
              className={`px-6 py-2 text-white font-bold rounded-lg shadow-lg transition-all flex items-center gap-2 ${
                loading || !percentage || previewCount === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl transform hover:-translate-y-0.5"
              }`}
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <FaSave /> Aplicar Aumento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
