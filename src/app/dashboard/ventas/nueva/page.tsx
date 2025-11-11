// src/app/dashboard/ventas/nueva/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/lib/database.types";
import { User } from "@supabase/supabase-js";
import { FaTimes, FaPlus, FaMinus } from "react-icons/fa";
import toast from "react-hot-toast";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type CartItem = Product & { quantity: number; customPrice?: number };

// Tipo para el estado de cada pestaña de venta
type SaleTab = {
  id: number;
  name: string;
  selectedCustomer: Customer | null;
  cart: CartItem[];
  total: number;
  amountPaid: string;
  paymentMethod: string;
  useMixedPayment: boolean;
  paymentMethods: Array<{ method: string; amount: string }>;
  showPaymentPanel: boolean;
};

// --- COMPONENTE INTERNO: BUSCADOR DE PRODUCTOS ---
function ProductSearch({
  onProductSelect,
  isEditingTab,
}: {
  onProductSelect: (product: Product) => void;
  isEditingTab: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState(0);

  // Detectar entrada de lector de código de barras
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // No procesar si se está editando una pestaña
      if (isEditingTab) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;

      // Si es Enter y hay un buffer, procesar como código de barras
      if (e.key === "Enter" && barcodeBuffer.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        searchByBarcode(barcodeBuffer);
        setBarcodeBuffer("");
        setLastKeyTime(0);
        setQuery(""); // Limpiar el campo de búsqueda
        return;
      }

      // Acumular caracteres si vienen rápido (< 50ms entre teclas = lector)
      if (
        timeDiff < 50 &&
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey
      ) {
        e.preventDefault(); // Prevenir que escriba en el input
        e.stopPropagation();
        setBarcodeBuffer((prev) => prev + e.key);
        setLastKeyTime(currentTime);
      } else if (timeDiff >= 50 && e.key.length === 1) {
        // Reset si hay pausa (escritura manual) - dejar escribir normalmente
        setBarcodeBuffer(e.key);
        setLastKeyTime(currentTime);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true); // true = capture phase
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [barcodeBuffer, lastKeyTime, isEditingTab]);

  const searchByBarcode = async (barcode: string) => {
    setIsLoading(true);
    try {
      // Intentar búsqueda exacta por SKU
      const { data: exactMatch } = await supabase
        .from("products")
        .select("*")
        .eq("sku", barcode.trim())
        .eq("is_active", true)
        .maybeSingle();

      if (exactMatch) {
        // Agregar directamente al carrito
        onProductSelect(exactMatch);
        toast.success(`✓ ${exactMatch.name} agregado`);
        return;
      }

      // Si no hay coincidencia exacta, buscar por similitud (nombre o SKU parcial)
      const { data: similarProducts } = await supabase
        .from("products")
        .select("*")
        .or(`name.ilike.%${barcode}%,sku.ilike.%${barcode}%`)
        .eq("is_active", true)
        .limit(5);

      if (similarProducts && similarProducts.length > 0) {
        // Si hay solo un resultado, agregarlo automáticamente
        if (similarProducts.length === 1) {
          onProductSelect(similarProducts[0]);
          toast.success(`✓ ${similarProducts[0].name} agregado`);
        } else {
          // Si hay múltiples resultados, mostrarlos para que el usuario seleccione
          setResults(similarProducts);
          setQuery(barcode);
          toast(`Se encontraron ${similarProducts.length} productos`, {
            icon: "🔍",
          });
        }
      } else {
        toast.error(`No se encontró ningún producto con "${barcode}"`);
      }
    } catch (error) {
      console.error("Error buscando producto:", error);
      toast.error("Error al buscar el producto");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
          .eq("is_active", true)
          .limit(5);

        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error("Error buscando productos:", error);
        toast.error("Error al buscar productos");
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (product: Product) => {
    onProductSelect(product);
    setQuery("");
    setResults([]);
  };

  // Detectar Enter en el input para búsqueda rápida por SKU
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim().length > 0) {
      e.preventDefault();
      // Intentar buscar por SKU primero
      searchByBarcode(query.trim());
      setQuery("");
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Buscar por nombre o escanear código de barras..."
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        💡 Escanea con el lector o escribe código y presiona Enter
      </p>
      {results.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map((product) => (
            <li
              key={product.id}
              onClick={() => handleSelect(product)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium block">{product.name}</span>
                  {product.sku && (
                    <span className="text-xs text-gray-500">
                      SKU: {product.sku}
                    </span>
                  )}
                </div>
                <span
                  className={`text-sm ${
                    (product.stock || 0) > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  Stock: {product.stock || 0}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- MODAL DE PAGO ---
function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  total,
  customerName,
  cartItemsCount,
  paymentMethod,
  setPaymentMethod,
  amountPaid,
  setAmountPaid,
  useMixedPayment,
  setUseMixedPayment,
  paymentMethods,
  setPaymentMethods,
  handleAddPaymentMethod,
  handleRemovePaymentMethod,
  handleUpdatePaymentMethod,
  getTotalPaidFromMixed,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  total: number;
  customerName: string;
  cartItemsCount: number;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  amountPaid: string;
  setAmountPaid: (amount: string) => void;
  useMixedPayment: boolean;
  setUseMixedPayment: (value: boolean) => void;
  paymentMethods: Array<{ method: string; amount: string }>;
  setPaymentMethods: (
    methods: Array<{ method: string; amount: string }>
  ) => void;
  handleAddPaymentMethod: () => void;
  handleRemovePaymentMethod: (index: number) => void;
  handleUpdatePaymentMethod: (
    index: number,
    field: "method" | "amount",
    value: string
  ) => void;
  getTotalPaidFromMixed: () => number;
  loading: boolean;
}) {
  if (!isOpen) return null;

  const debtDifference = useMixedPayment
    ? total - getTotalPaidFromMixed()
    : total - (parseFloat(amountPaid) || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                💳 Finalizar Venta
              </h2>
              <p className="text-green-100 text-sm">Cliente: {customerName}</p>
              <p className="text-green-100 text-sm">
                {cartItemsCount} productos
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>
          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-green-100 text-sm font-medium">Total a Pagar</p>
            <p className="text-4xl font-bold text-white">${total.toFixed(2)}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Atajos de teclado */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="font-semibold text-blue-900 mb-2">
              ⌨️ Atajos de teclado:
            </p>
            <div className="flex gap-4 text-sm text-blue-800">
              <span>
                <kbd className="px-2 py-1 bg-white rounded border shadow-sm">
                  F12
                </kbd>{" "}
                Cerrar
              </span>
              <span>
                <kbd className="px-2 py-1 bg-white rounded border shadow-sm">
                  F2
                </kbd>{" "}
                Confirmar
              </span>
            </div>
          </div>

          {!useMixedPayment ? (
            <>
              {/* Método de pago simple */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Método de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPaymentMethod(value);
                    if (value === "mixtos") {
                      setUseMixedPayment(true);
                    } else if (value === "cuenta_corriente") {
                      setAmountPaid("0");
                    } else {
                      setAmountPaid(total.toFixed(2));
                    }
                  }}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                >
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="tarjeta_debito">💳 Tarjeta de Débito</option>
                  <option value="tarjeta_credito">💳 Tarjeta de Crédito</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="mercado_pago">📱 Mercado Pago</option>
                  <option value="mixtos">🔀 Pagos Mixtos</option>
                  <option value="cuenta_corriente">
                    📋 Cuenta Corriente (Fiado)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Monto Pagado
                </label>
                <input
                  id="amountPaid"
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-semibold"
                  placeholder="0.00"
                />
              </div>
            </>
          ) : (
            <>
              {/* Pagos mixtos */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-blue-900">
                    🔀 Pagos Mixtos
                  </h3>
                  <button
                    onClick={() => {
                      setUseMixedPayment(false);
                      setPaymentMethod("efectivo");
                      setAmountPaid(total.toFixed(2));
                    }}
                    className="text-sm px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
                <p className="text-sm text-blue-700">
                  Combina diferentes métodos de pago
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💵 Efectivo
                  </label>
                  <input
                    type="number"
                    value={paymentMethods[0]?.amount || ""}
                    onChange={(e) =>
                      handleUpdatePaymentMethod(0, "amount", e.target.value)
                    }
                    placeholder="Monto en efectivo"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏦 Transferencia
                  </label>
                  <input
                    type="number"
                    value={paymentMethods[1]?.amount || ""}
                    onChange={(e) =>
                      handleUpdatePaymentMethod(1, "amount", e.target.value)
                    }
                    placeholder="Monto por transferencia"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      Total Pagado:
                    </span>
                    <span className="font-bold text-blue-700">
                      ${getTotalPaidFromMixed().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Indicadores de deuda/cambio */}
          {debtDifference > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-red-800">
                  ⚠️ Saldo Pendiente:
                </span>
                <span className="text-2xl font-bold text-red-600">
                  ${debtDifference.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {debtDifference < 0 && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-green-800">
                  💰 Cambio a Devolver:
                </span>
                <span className="text-2xl font-bold text-green-600">
                  ${Math.abs(debtDifference).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-2 py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>⏳ Procesando...</>
              ) : (
                <>
                  ✅ Confirmar Venta{" "}
                  <span className="text-xs bg-green-500 px-2 py-0.5 rounded">
                    F2
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE: MODAL DE BÚSQUEDA DE PRODUCTOS ---
function ProductSearchModal({
  isOpen,
  onClose,
  onSelectProduct,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Scroll automático al elemento seleccionado cuando cambia el índice
  useEffect(() => {
    const selectedElement = document.querySelector(
      `[data-product-index="${selectedIndex}"]`
    );
    if (selectedElement) {
      selectedElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedIndex]);

  // Cargar productos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadProducts();
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error("Error cargando productos:", error);
      toast.error("Error al cargar productos");
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar productos según búsqueda
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
      setSelectedIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
    setSelectedIndex(0);
  }, [searchQuery, products]);

  // Navegación con teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredProducts.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter" && filteredProducts[selectedIndex]) {
        e.preventDefault();
        handleSelectProduct(filteredProducts[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredProducts, selectedIndex]);

  const handleSelectProduct = (product: Product) => {
    onSelectProduct(product);
    onClose();
    toast.success(`✓ ${product.name} agregado`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                🔍 Buscar Productos
              </h2>
              <p className="text-purple-100 text-sm">
                {filteredProducts.length} productos encontrados
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>

          {/* Buscador */}
          <div className="mt-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, SKU o descripción..."
              autoFocus
              className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white text-lg"
            />
          </div>

          {/* Atajos de teclado */}
          <div className="mt-3 flex gap-3 text-xs text-purple-100">
            <span>
              <kbd className="px-2 py-1 bg-white/20 rounded">↑↓</kbd> Navegar
            </span>
            <span>
              <kbd className="px-2 py-1 bg-white/20 rounded">Enter</kbd>{" "}
              Seleccionar
            </span>
            <span>
              <kbd className="px-2 py-1 bg-white/20 rounded">Esc</kbd> Cerrar
            </span>
          </div>
        </div>

        {/* Lista de productos */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Cargando productos...</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 text-gray-500">
              <p className="text-lg mb-2">No se encontraron productos</p>
              <p className="text-sm">Intenta con otra búsqueda</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredProducts.map((product, index) => (
                <button
                  key={product.id}
                  data-product-index={index}
                  onClick={() => handleSelectProduct(product)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    index === selectedIndex
                      ? "border-purple-500 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">
                        {product.name}
                      </h3>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>
                          SKU: <strong>{product.sku}</strong>
                        </span>
                        {product.description && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {product.description.length > 30
                              ? product.description.substring(0, 30) + "..."
                              : product.description}
                          </span>
                        )}
                        <span>
                          Stock: <strong>{product.stock || 0}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-600">Minorista</div>
                      <div className="text-xl font-bold text-green-600">
                        ${(product.price_minorista || 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Mayor: ${(product.price_mayorista || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewSalePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Sistema de pestañas
  const [tabs, setTabs] = useState<SaleTab[]>([
    {
      id: 1,
      name: "Venta 1",
      selectedCustomer: null,
      cart: [],
      total: 0,
      amountPaid: "",
      paymentMethod: "efectivo",
      useMixedPayment: false,
      paymentMethods: [
        { method: "efectivo", amount: "" },
        { method: "transferencia", amount: "" },
      ],
      showPaymentPanel: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [nextTabId, setNextTabId] = useState(2);
  const [editingTabId, setEditingTabId] = useState<number | null>(null);
  const [editingTabName, setEditingTabName] = useState("");
  const [showProductSearchModal, setShowProductSearchModal] = useState(false);

  // Obtener la pestaña activa
  const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0];

  // Aliases para mantener compatibilidad con el código existente
  const selectedCustomer = activeTab.selectedCustomer;
  const cart = activeTab.cart;
  const total = activeTab.total;
  const amountPaid = activeTab.amountPaid;
  const paymentMethod = activeTab.paymentMethod;
  const useMixedPayment = activeTab.useMixedPayment;
  const paymentMethods = activeTab.paymentMethods;
  const showPaymentPanel = activeTab.showPaymentPanel;

  // Funciones para actualizar el estado de la pestaña activa
  const updateActiveTab = (updates: Partial<SaleTab>) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTabId ? { ...tab, ...updates } : tab
      )
    );
  };

  const setSelectedCustomer = (customer: Customer | null) => {
    updateActiveTab({ selectedCustomer: customer });
  };

  const setCart = (cart: CartItem[]) => {
    updateActiveTab({ cart });
  };

  const setTotal = (total: number) => {
    updateActiveTab({ total });
  };

  const setAmountPaid = (amountPaid: string) => {
    updateActiveTab({ amountPaid });
  };

  const setPaymentMethod = (paymentMethod: string) => {
    updateActiveTab({ paymentMethod });
  };

  const setUseMixedPayment = (useMixedPayment: boolean) => {
    updateActiveTab({ useMixedPayment });
  };

  const setPaymentMethodsState = (
    paymentMethods: Array<{ method: string; amount: string }>
  ) => {
    updateActiveTab({ paymentMethods });
  };

  const setShowPaymentPanel = (showPaymentPanel: boolean) => {
    updateActiveTab({ showPaymentPanel });
  };

  // Funciones para manejo de pestañas
  const addNewTab = () => {
    const defaultCustomer =
      customers.find((c) => c.full_name === "Consumidor Final") ||
      customers[0] ||
      null;

    const newTab: SaleTab = {
      id: nextTabId,
      name: `Venta ${nextTabId}`,
      selectedCustomer: defaultCustomer,
      cart: [],
      total: 0,
      amountPaid: "",
      paymentMethod: "efectivo",
      useMixedPayment: false,
      paymentMethods: [
        { method: "efectivo", amount: "" },
        { method: "transferencia", amount: "" },
      ],
      showPaymentPanel: false,
    };

    setTabs([...tabs, newTab]);
    setActiveTabId(nextTabId);
    setNextTabId(nextTabId + 1);
    toast.success(`📋 Nueva venta creada`);
  };

  const closeTab = (tabId: number) => {
    if (tabs.length === 1) {
      toast.error("Debe haber al menos una venta abierta");
      return;
    }

    const tabToClose = tabs.find((t) => t.id === tabId);
    if (tabToClose && tabToClose.cart.length > 0) {
      if (!confirm("¿Cerrar esta venta? Se perderán los productos cargados.")) {
        return;
      }
    }

    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
    toast.success("📋 Venta cerrada");
  };

  const startEditingTab = (tabId: number, currentName: string) => {
    setEditingTabId(tabId);
    setEditingTabName(currentName);
  };

  const saveTabName = (tabId: number) => {
    if (editingTabName.trim()) {
      setTabs((prevTabs) =>
        prevTabs.map((tab) =>
          tab.id === tabId ? { ...tab, name: editingTabName.trim() } : tab
        )
      );
      toast.success("✏️ Nombre actualizado");
    }
    setEditingTabId(null);
    setEditingTabName("");
  };

  const cancelEditingTab = () => {
    setEditingTabId(null);
    setEditingTabName("");
  };

  useEffect(() => {
    async function loadInitialData() {
      try {
        const { data: customersData, error: customersError } = await supabase
          .from("customers")
          .select("*")
          .eq("is_active", true)
          .order("full_name");

        if (customersError) throw customersError;

        if (customersData) {
          setCustomers(customersData);
          let defaultCustomer = customersData.find(
            (c) => c.full_name === "Consumidor Final"
          );
          if (!defaultCustomer && customersData.length > 0) {
            defaultCustomer = customersData[0];
          }
          setSelectedCustomer(defaultCustomer || null);
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        setCurrentUser(session?.user ?? null);
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
        toast.error("Error al cargar los datos");
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedCustomer) {
      setTotal(0);
      return;
    }

    const newTotal = cart.reduce((acc, item) => {
      // Si tiene precio personalizado, usarlo; sino, usar el precio según tipo de cliente
      const price =
        item.customPrice !== undefined
          ? item.customPrice
          : selectedCustomer.customer_type === "mayorista"
          ? item.price_mayorista
          : item.price_minorista;
      return acc + (price || 0) * item.quantity;
    }, 0);

    setTotal(newTotal);

    if (!useMixedPayment) {
      if (paymentMethod !== "cuenta_corriente") {
        setAmountPaid(newTotal.toFixed(2));
      } else {
        setAmountPaid("0");
      }
    }
  }, [cart, selectedCustomer, paymentMethod, useMixedPayment, activeTabId]);

  // Funciones para manejo de pagos mixtos
  const handleAddPaymentMethod = () => {
    setPaymentMethodsState([
      ...paymentMethods,
      { method: "efectivo", amount: "" },
    ]);
  };

  const handleRemovePaymentMethod = (index: number) => {
    if (paymentMethods.length > 1) {
      setPaymentMethodsState(paymentMethods.filter((_, i) => i !== index));
    }
  };

  const handleUpdatePaymentMethod = (
    index: number,
    field: "method" | "amount",
    value: string
  ) => {
    const updated = [...paymentMethods];
    // Asegurar que el índice existe
    if (!updated[index]) {
      updated[index] = { method: "efectivo", amount: "" };
    }
    updated[index][field] = value;
    setPaymentMethodsState(updated);
  };

  const getTotalPaidFromMixed = () => {
    return paymentMethods.reduce(
      (sum, pm) => sum + (parseFloat(pm.amount) || 0),
      0
    );
  };

  const handleAddProduct = useCallback(
    (productToAdd: Product) => {
      if (!selectedCustomer) {
        toast.error("Por favor, selecciona un cliente.");
        return;
      }

      const existingItem = cart.find((item) => item.id === productToAdd.id);

      if (existingItem) {
        if (existingItem.quantity < (productToAdd.stock || 0)) {
          setCart(
            cart.map((item) =>
              item.id === productToAdd.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          );
          toast.success("Cantidad actualizada");
        } else {
          toast.error("No hay más stock disponible para este producto.");
        }
      } else {
        if ((productToAdd.stock || 0) > 0) {
          setCart([...cart, { ...productToAdd, quantity: 1 }]);
          toast.success("Producto agregado al carrito");
        } else {
          toast.error("Este producto no tiene stock.");
        }
      }
    },
    [cart, selectedCustomer]
  );

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(
      cart.map((item) => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return item;
          if (newQuantity > (item.stock || 0)) {
            toast.error("No hay suficiente stock");
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId));
    toast.success("Producto eliminado");
  };

  const handleUpdateCustomPrice = (productId: string, newPrice: string) => {
    const priceValue = parseFloat(newPrice);
    if (isNaN(priceValue) || priceValue < 0) return;

    setCart(
      cart.map((item) =>
        item.id === productId ? { ...item, customPrice: priceValue } : item
      )
    );
  };

  const handleFinalizeSale = useCallback(async () => {
    if (!selectedCustomer || cart.length === 0 || !currentUser?.id) {
      toast.error("Faltan datos para completar la venta.");
      return;
    }

    const paid = useMixedPayment
      ? getTotalPaidFromMixed()
      : parseFloat(amountPaid) || 0;

    if (paid < 0) {
      toast.error("El monto pagado no puede ser negativo.");
      return;
    }

    if (paid > total) {
      const confirmOverpay = window.confirm(
        `El monto pagado ($${paid.toFixed(
          2
        )}) es mayor al total ($${total.toFixed(2)}). ¿Deseas continuar?`
      );
      if (!confirmOverpay) return;
    }

    setLoading(true);

    try {
      const debtGenerated = total - paid;

      // Obtener timestamp en zona horaria Argentina
      const now = new Date();
      const argentinaTime = new Date(
        now.toLocaleString("en-US", {
          timeZone: "America/Argentina/Buenos_Aires",
        })
      );

      // 1. Registrar la venta
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert({
          customer_id: selectedCustomer.id,
          profile_id: currentUser.id,
          total_amount: total,
          payment_method: paymentMethod,
          amount_paid: paid,
          amount_pending: debtGenerated,
          created_at: argentinaTime.toISOString(),
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Registrar los items de la venta
      const saleItems = cart.map((item) => ({
        sale_id: saleData.id,
        product_id: item.id,
        quantity: item.quantity,
        price:
          item.customPrice !== undefined
            ? item.customPrice
            : selectedCustomer.customer_type === "mayorista"
            ? item.price_mayorista
            : item.price_minorista,
      }));

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems);
      if (itemsError) throw itemsError;

      // 3. Actualizar stock de productos (excepto alimentos sueltos)
      const stockUpdates = cart
        .filter((item) => {
          // No actualizar stock para alimentos sueltos/granel
          const isLooseFood =
            item.name?.toLowerCase().includes("alimento suelto") ||
            item.name?.toLowerCase().includes("alimento a granel") ||
            item.sku === "SUELTO" ||
            item.sku === "GRANEL";
          return !isLooseFood;
        })
        .map((item) => {
          const newStock = (item.stock || 0) - item.quantity;
          return supabase
            .from("products")
            .update({ stock: newStock })
            .eq("id", item.id);
        });

      if (stockUpdates.length > 0) {
        await Promise.all(stockUpdates);
      }

      // 4. Actualizar deuda del cliente
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("debt")
        .eq("id", selectedCustomer.id)
        .single();

      if (customerError) throw customerError;

      const currentDebt = (customerData?.debt as number) || 0;
      const newDebt = currentDebt + debtGenerated;

      const { error: debtUpdateError } = await supabase
        .from("customers")
        .update({ debt: newDebt })
        .eq("id", selectedCustomer.id);

      if (debtUpdateError) throw debtUpdateError;

      // 5. Registrar movimientos en payments
      const paymentRecords = [];

      if (debtGenerated > 0) {
        paymentRecords.push({
          customer_id: selectedCustomer.id,
          sale_id: saleData.id,
          type: "compra",
          amount: debtGenerated,
          comment: useMixedPayment
            ? "Venta parcial - pagos mixtos"
            : `Venta ${
                paymentMethod === "cuenta_corriente" ? "a crédito" : "parcial"
              }`,
        });
      }

      if (paid > 0) {
        if (useMixedPayment) {
          // Registrar cada método de pago por separado
          paymentMethods.forEach((pm) => {
            const amount = parseFloat(pm.amount) || 0;
            if (amount > 0) {
              paymentRecords.push({
                customer_id: selectedCustomer.id,
                sale_id: saleData.id,
                type: "pago",
                amount: amount,
                comment: `Pago con ${pm.method}`,
              });
            }
          });
        } else {
          paymentRecords.push({
            customer_id: selectedCustomer.id,
            sale_id: saleData.id,
            type: "pago",
            amount: paid,
            comment: `Pago con ${paymentMethod}`,
          });
        }
      }

      if (paymentRecords.length > 0) {
        const { error: paymentsError } = await supabase
          .from("payments")
          .insert(paymentRecords);
        if (paymentsError) throw paymentsError;
      }

      toast.success("¡Venta registrada exitosamente!");

      // Si hay solo una pestaña, resetear su contenido
      if (tabs.length === 1) {
        setCart([]);
        setAmountPaid("");
        setPaymentMethod("efectivo");
        setUseMixedPayment(false);
        setPaymentMethodsState([
          { method: "efectivo", amount: "" },
          { method: "transferencia", amount: "" },
        ]);
        const consumerFinal = customers.find(
          (c) => c.full_name === "Consumidor Final"
        );
        if (consumerFinal) setSelectedCustomer(consumerFinal);
      } else {
        // Si hay múltiples pestañas, cerrar la actual
        closeTab(activeTabId);
      }
    } catch (error: any) {
      console.error("Error al finalizar venta:", error);
      toast.error(
        `Error al registrar la venta: ${error.message || "Error desconocido"}`
      );
    } finally {
      setLoading(false);
      setShowPaymentPanel(false); // Cerrar el panel después de finalizar
    }
  }, [
    selectedCustomer,
    cart,
    currentUser,
    useMixedPayment,
    getTotalPaidFromMixed,
    amountPaid,
    total,
    paymentMethod,
    paymentMethods,
    customers,
  ]);

  // Atajos de teclado F10, F12, F2 y Ctrl+T
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // No procesar atajos si se está editando el nombre de una pestaña
      if (editingTabId !== null) {
        return;
      }

      // F10: Abrir modal de búsqueda de productos
      if (e.key === "F10") {
        e.preventDefault();
        setShowProductSearchModal(true);
        toast.success("🔍 Buscador de productos abierto", { duration: 1500 });
        return;
      }

      // F9: Nueva pestaña de venta
      if (e.key === "F9") {
        e.preventDefault();
        addNewTab();
        return;
      }

      // F8: Cerrar pestaña actual
      if (e.key === "F8") {
        e.preventDefault();
        if (tabs.length > 1) {
          closeTab(activeTabId);
        } else {
          toast.error("Debe haber al menos una venta abierta");
        }
        return;
      }

      // F12: Abrir/cerrar panel de pago (solo si hay productos en el carrito)
      if (e.key === "F12") {
        e.preventDefault();
        if (cart.length > 0 && selectedCustomer) {
          setShowPaymentPanel(!showPaymentPanel);
          if (!showPaymentPanel) {
            toast.success("💳 Panel de pago abierto (F2 para confirmar)", {
              duration: 2000,
            });
            // Enfocar el campo de monto pagado después de un momento
            setTimeout(() => {
              const amountInput = document.getElementById("amountPaid");
              if (amountInput) amountInput.focus();
            }, 100);
          }
        } else if (cart.length === 0) {
          toast.error("⚠️ Agrega productos al carrito primero");
        } else if (!selectedCustomer) {
          toast.error("⚠️ Selecciona un cliente primero");
        }
      }

      // F2: Confirmar venta (solo si el panel de pago está abierto)
      if (e.key === "F2") {
        e.preventDefault();
        if (showPaymentPanel && cart.length > 0 && !loading) {
          handleFinalizeSale();
        } else if (!showPaymentPanel) {
          toast.error("⚠️ Presiona F12 para abrir el panel de pago");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    cart,
    selectedCustomer,
    showPaymentPanel,
    loading,
    handleFinalizeSale,
    tabs,
    activeTabId,
    editingTabId,
  ]);

  const debtDifference = useMixedPayment
    ? total - getTotalPaidFromMixed()
    : total - (parseFloat(amountPaid) || 0);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pestañas de Ventas */}
        <div className="mb-4 bg-white rounded-lg shadow-md p-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                  tab.id === activeTabId
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {editingTabId === tab.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingTabName}
                      onChange={(e) => setEditingTabName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          saveTabName(tab.id);
                        } else if (e.key === "Escape") {
                          cancelEditingTab();
                        }
                      }}
                      onBlur={() => saveTabName(tab.id)}
                      autoFocus
                      placeholder="Nombre de venta"
                      className="w-32 px-2 py-1 text-sm border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTabId(tab.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      startEditingTab(tab.id, tab.name);
                    }}
                    className="flex items-center gap-2 flex-1"
                    title="Doble click para renombrar"
                  >
                    <span className="font-semibold">{tab.name}</span>
                    {tab.cart.length > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          tab.id === activeTabId
                            ? "bg-white/20 text-white"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {tab.cart.length}
                      </span>
                    )}
                  </button>
                )}
                {tabs.length > 1 && editingTabId !== tab.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className={`p-1 rounded hover:bg-red-500 hover:text-white transition-colors ${
                      tab.id === activeTabId ? "text-white" : "text-gray-500"
                    }`}
                  >
                    <FaTimes size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addNewTab}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md whitespace-nowrap"
            >
              <FaPlus size={14} />
              <span className="font-semibold">Nueva Venta</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo - Selección de cliente y productos */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">
                {activeTab.name}
              </h1>
              <div className="text-sm text-gray-500">
                Pestaña {tabs.findIndex((t) => t.id === activeTabId) + 1} de{" "}
                {tabs.length}
              </div>
            </div>

            {/* Atajos de teclado */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-900 mb-2">
                ⌨️ Atajos de teclado:
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-blue-800">
                <span>
                  <kbd className="px-2 py-1 bg-white rounded border shadow-sm font-mono">
                    F9
                  </kbd>{" "}
                  Nueva venta
                </span>
                <span>
                  <kbd className="px-2 py-1 bg-white rounded border shadow-sm font-mono">
                    F8
                  </kbd>{" "}
                  Cerrar venta
                </span>
                <span>
                  <kbd className="px-2 py-1 bg-white rounded border shadow-sm font-mono">
                    F10
                  </kbd>{" "}
                  Buscar productos
                </span>
                <span>
                  <kbd className="px-2 py-1 bg-white rounded border shadow-sm font-mono">
                    F12
                  </kbd>{" "}
                  Ir a pagar
                </span>
                <span>
                  <kbd className="px-2 py-1 bg-white rounded border shadow-sm font-mono">
                    F2
                  </kbd>{" "}
                  Confirmar venta
                </span>
                <span className="text-gray-600">
                  <kbd className="px-2 py-1 bg-white rounded border shadow-sm font-mono">
                    Doble Click
                  </kbd>{" "}
                  Renombrar pestaña
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="customer"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                1. Cliente
              </label>
              <select
                id="customer"
                value={selectedCustomer?.id || ""}
                onChange={(e) =>
                  setSelectedCustomer(
                    customers.find((c) => c.id === e.target.value) || null
                  )
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}{" "}
                    {c.customer_type === "mayorista"
                      ? "(Mayorista)"
                      : "(Minorista)"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                2. Agregar Producto
              </label>
              <ProductSearch
                onProductSelect={handleAddProduct}
                isEditingTab={editingTabId !== null}
              />
            </div>
          </div>

          {/* Panel derecho - Carrito y pago */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Carrito y Pago
            </h2>

            <div className="space-y-3 min-h-[200px] max-h-96 overflow-y-auto pr-2 mb-4">
              {cart.length === 0 ? (
                <p className="text-gray-400 text-center pt-8">
                  El carrito está vacío.
                </p>
              ) : (
                cart.map((item) => {
                  // Determinar si es "Alimento suelto" (producto editable)
                  const isLooseFood =
                    item.name?.toLowerCase().includes("alimento suelto") ||
                    item.name?.toLowerCase().includes("alimento a granel") ||
                    item.sku === "SUELTO" ||
                    item.sku === "GRANEL";

                  const price =
                    item.customPrice !== undefined
                      ? item.customPrice
                      : selectedCustomer?.customer_type === "mayorista"
                      ? item.price_mayorista
                      : item.price_minorista;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-md p-3 ${
                        isLooseFood ? "bg-yellow-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {item.name}
                            {isLooseFood && (
                              <span className="ml-2 text-xs text-yellow-700 font-semibold">
                                ✏️ Editable
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Eliminar producto"
                        >
                          <FaTimes />
                        </button>
                      </div>

                      {/* Cantidad */}
                      <div className="mb-2">
                        <label className="text-xs text-gray-600 mb-1 block">
                          Cantidad
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded"
                            disabled={item.quantity <= 0.01}
                            title="Disminuir cantidad"
                          >
                            <FaMinus size={12} />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQty = parseFloat(e.target.value) || 0;
                              if (newQty > (item.stock || 0) && !isLooseFood) {
                                toast.error("Stock insuficiente");
                                return;
                              }
                              if (newQty >= 0) {
                                setCart(
                                  cart.map((i) =>
                                    i.id === item.id
                                      ? { ...i, quantity: newQty }
                                      : i
                                  )
                                );
                              }
                            }}
                            className="flex-1 px-2 py-1 text-center border border-gray-300 rounded"
                            step="0.01"
                            min="0"
                            aria-label="Cantidad del producto"
                          />
                          <button
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded"
                            disabled={
                              !isLooseFood && item.quantity >= (item.stock || 0)
                            }
                            title="Aumentar cantidad"
                          >
                            <FaPlus size={12} />
                          </button>
                          <span className="text-xs text-gray-600 w-12 text-right">
                            kg/un
                          </span>
                        </div>
                      </div>

                      {/* Precio - Editable solo para alimentos sueltos */}
                      {isLooseFood ? (
                        <div className="mb-2">
                          <label className="text-xs text-gray-600 mb-1 block">
                            Precio por kg/unidad
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">$</span>
                            <input
                              type="number"
                              value={
                                item.customPrice !== undefined &&
                                item.customPrice > 0
                                  ? item.customPrice
                                  : ""
                              }
                              onChange={(e) =>
                                handleUpdateCustomPrice(item.id, e.target.value)
                              }
                              placeholder="Ingresa el precio"
                              className="flex-1 px-2 py-1 border border-yellow-400 rounded bg-white"
                              step="0.01"
                              min="0"
                            />
                          </div>
                          <p className="text-xs text-yellow-700 mt-1">
                            💡 Precio personalizado para esta venta
                          </p>
                        </div>
                      ) : (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">
                            Precio: <strong>${(price || 0).toFixed(2)}</strong>{" "}
                            /kg o unidad
                          </p>
                        </div>
                      )}

                      {/* Subtotal */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="font-semibold text-gray-800">
                          ${((price || 0) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between font-bold text-lg text-gray-800">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              {/* Botón para abrir modal de pago */}
              {cart.length > 0 && (
                <button
                  onClick={() => setShowPaymentPanel(true)}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2 text-lg"
                >
                  💳 Ir a Pagar
                  <span className="text-xs bg-green-500 px-2 py-1 rounded">
                    F12
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Pago */}
      <PaymentModal
        isOpen={showPaymentPanel}
        onClose={() => setShowPaymentPanel(false)}
        onConfirm={handleFinalizeSale}
        total={total}
        customerName={selectedCustomer?.full_name || ""}
        cartItemsCount={cart.length}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        amountPaid={amountPaid}
        setAmountPaid={setAmountPaid}
        useMixedPayment={useMixedPayment}
        setUseMixedPayment={setUseMixedPayment}
        paymentMethods={paymentMethods}
        setPaymentMethods={setPaymentMethodsState}
        handleAddPaymentMethod={handleAddPaymentMethod}
        handleRemovePaymentMethod={handleRemovePaymentMethod}
        handleUpdatePaymentMethod={handleUpdatePaymentMethod}
        getTotalPaidFromMixed={getTotalPaidFromMixed}
        loading={loading}
      />

      {/* Modal de Búsqueda de Productos */}
      <ProductSearchModal
        isOpen={showProductSearchModal}
        onClose={() => setShowProductSearchModal(false)}
        onSelectProduct={handleAddProduct}
      />
    </div>
  );
}
