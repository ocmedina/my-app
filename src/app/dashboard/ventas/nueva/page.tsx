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

// --- COMPONENTE INTERNO: BUSCADOR DE PRODUCTOS ---
function ProductSearch({
  onProductSelect,
}: {
  onProductSelect: (product: Product) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState(0);

  // Detectar entrada de lector de código de barras
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;

      // Si es Enter y hay un buffer, procesar como código de barras
      if (e.key === "Enter" && barcodeBuffer.length > 0) {
        e.preventDefault();
        searchByBarcode(barcodeBuffer);
        setBarcodeBuffer("");
        setLastKeyTime(0);
        return;
      }

      // Acumular caracteres si vienen rápido (< 100ms entre teclas = lector)
      if (timeDiff < 100 && e.key.length === 1) {
        setBarcodeBuffer((prev) => prev + e.key);
        setLastKeyTime(currentTime);
      } else if (timeDiff >= 100) {
        // Reset si hay pausa (escritura manual)
        setBarcodeBuffer(e.key.length === 1 ? e.key : "");
        setLastKeyTime(currentTime);
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [barcodeBuffer, lastKeyTime]);

  const searchByBarcode = async (barcode: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("sku", barcode)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        toast.error(`Producto con código "${barcode}" no encontrado`);
        return;
      }

      // Agregar directamente al carrito
      onProductSelect(data);
      toast.success(`✓ ${data.name} agregado`);
    } catch (error) {
      console.error("Error buscando por código de barras:", error);
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

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
        💡 Escanea con el lector o escribe para buscar manualmente
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

export default function NewSalePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [loading, setLoading] = useState(false);

  // Estados para pagos mixtos
  const [useMixedPayment, setUseMixedPayment] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<
    Array<{ method: string; amount: string }>
  >([
    { method: "efectivo", amount: "" },
    { method: "transferencia", amount: "" },
  ]);

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
  }, [cart, selectedCustomer, paymentMethod, useMixedPayment]);

  // Funciones para manejo de pagos mixtos
  const handleAddPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, { method: "efectivo", amount: "" }]);
  };

  const handleRemovePaymentMethod = (index: number) => {
    if (paymentMethods.length > 1) {
      setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
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
    setPaymentMethods(updated);
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

  const handleFinalizeSale = async () => {
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

      // Resetear formulario
      setCart([]);
      setAmountPaid("");
      setPaymentMethod("efectivo");
      setUseMixedPayment(false);
      setPaymentMethods([{ method: "efectivo", amount: "" }]);
      const consumerFinal = customers.find(
        (c) => c.full_name === "Consumidor Final"
      );
      if (consumerFinal) setSelectedCustomer(consumerFinal);
    } catch (error: any) {
      console.error("Error al finalizar venta:", error);
      toast.error(
        `Error al registrar la venta: ${error.message || "Error desconocido"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const debtDifference = useMixedPayment
    ? total - getTotalPaidFromMixed()
    : total - (parseFloat(amountPaid) || 0);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo - Selección de cliente y productos */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Nueva Venta</h1>

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
              <ProductSearch onProductSelect={handleAddProduct} />
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

              {!useMixedPayment ? (
                <>
                  {/* Pago simple */}
                  <div>
                    <label
                      htmlFor="paymentMethod"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Método de Pago
                    </label>
                    <select
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPaymentMethod(value);
                        if (value === "mixtos") {
                          setUseMixedPayment(true);
                          setPaymentMethods([
                            { method: "efectivo", amount: "" },
                            { method: "transferencia", amount: "" },
                          ]);
                        }
                      }}
                      className="block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta_debito">Tarjeta de Débito</option>
                      <option value="tarjeta_credito">
                        Tarjeta de Crédito
                      </option>
                      <option value="transferencia">Transferencia</option>
                      <option value="mercado_pago">Mercado Pago</option>
                      <option value="mixtos">Pagos Mixtos</option>
                      <option value="cuenta_corriente">
                        Cuenta Corriente (Fiado)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="amountPaid"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Monto Pagado
                    </label>
                    <input
                      type="number"
                      id="amountPaid"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Pagos mixtos */}
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-gray-800">
                          💳 Pagos Mixtos
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setUseMixedPayment(false);
                            setPaymentMethod("efectivo");
                          }}
                          className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                      <p className="text-xs text-gray-600">
                        Combina diferentes métodos de pago para esta venta
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* Efectivo */}
                      <div className="p-3 bg-gray-50 rounded-md border">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          💵 Efectivo
                        </label>
                        <input
                          type="number"
                          value={paymentMethods[0]?.amount || ""}
                          onChange={(e) =>
                            handleUpdatePaymentMethod(
                              0,
                              "amount",
                              e.target.value
                            )
                          }
                          placeholder="Monto en efectivo"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          step="0.01"
                          min="0"
                          aria-label="Monto en efectivo"
                        />
                      </div>

                      {/* Transferencia */}
                      <div className="p-3 bg-gray-50 rounded-md border">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          🏦 Transferencia
                        </label>
                        <input
                          type="number"
                          value={paymentMethods[1]?.amount || ""}
                          onChange={(e) =>
                            handleUpdatePaymentMethod(
                              1,
                              "amount",
                              e.target.value
                            )
                          }
                          placeholder="Monto por transferencia"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          step="0.01"
                          min="0"
                          aria-label="Monto por transferencia"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
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

              {debtDifference > 0 && (
                <div className="flex justify-between font-medium text-red-600 bg-red-50 p-3 rounded-md">
                  <span>Saldo Pendiente (Deuda)</span>
                  <span>${debtDifference.toFixed(2)}</span>
                </div>
              )}

              {debtDifference < 0 && (
                <div className="flex justify-between font-medium text-green-600 bg-green-50 p-3 rounded-md">
                  <span>Cambio a Devolver</span>
                  <span>${Math.abs(debtDifference).toFixed(2)}</span>
                </div>
              )}

              <button
                onClick={handleFinalizeSale}
                disabled={cart.length === 0 || !selectedCustomer || loading}
                className="w-full mt-4 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Procesando..." : "Finalizar Venta"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
