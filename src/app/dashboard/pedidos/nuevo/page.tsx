"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/lib/database.types";
import { User } from "@supabase/supabase-js";
import {
  FaSearch,
  FaShoppingCart,
  FaTrash,
  FaPlus,
  FaMinus,
  FaUser,
  FaBox,
  FaCheckCircle,
  FaArrowLeft,
  FaClipboardList,
  FaDollarSign,
  FaMoneyBillWave,
  FaFileInvoice,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type CartItem = Product & { quantity: number };

export default function NewOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "efectivo" | "fiado" | "transferencia" | "mixto"
  >("efectivo");
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [amountCash, setAmountCash] = useState<number>(0);
  const [amountTransfer, setAmountTransfer] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  useEffect(() => {
    async function loadInitialData() {
      const loadingToast = toast.loading("Cargando datos...");

      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .eq("is_active", true)
        .order("full_name");

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (customersError || productsError) {
        toast.error("Error al cargar los datos", { id: loadingToast });
        return;
      }

      setCustomers(customersData || []);
      setFilteredCustomers(customersData || []);
      setProducts(productsData || []);
      setFilteredProducts(productsData || []);
      setCurrentUser(session?.user ?? null);
      toast.success("Datos cargados", { id: loadingToast });
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedCustomer) {
      setTotal(0);
      return;
    }

    const subtotal = cart.reduce((acc, item) => {
      const price =
        selectedCustomer.customer_type === "mayorista"
          ? item.price_mayorista
          : item.price_minorista;
      return acc + (price || 0) * item.quantity;
    }, 0);

    // Total = Subtotal + Envío - Descuento
    const newTotal = subtotal + shippingCost - discount;
    setTotal(newTotal >= 0 ? newTotal : 0);
  }, [cart, selectedCustomer, shippingCost, discount]);

  useEffect(() => {
    if (paymentMethod === "mixto") {
      setAmountReceived(amountCash + amountTransfer);
    }
  }, [amountCash, amountTransfer, paymentMethod]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  useEffect(() => {
    if (customerSearchQuery.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(
        (c) =>
          c.full_name
            .toLowerCase()
            .includes(customerSearchQuery.toLowerCase()) ||
          c.customer_type
            ?.toLowerCase()
            .includes(customerSearchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [customerSearchQuery, customers]);

  const getProductPrice = (product: Product) => {
    if (!selectedCustomer) return 0;
    return selectedCustomer.customer_type === "mayorista"
      ? product.price_mayorista
      : product.price_minorista;
  };

  const handleAddProduct = (product: Product) => {
    if (!selectedCustomer) {
      toast.error("Por favor, selecciona un cliente primero");
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity < (product.stock || 0)) {
        setCart(
          cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
        toast.success(`${product.name} agregado`);
      } else {
        toast.error("No hay más stock disponible");
      }
    } else {
      if ((product.stock || 0) > 0) {
        setCart([...cart, { ...product, quantity: 1 }]);
        toast.success(`${product.name} agregado al carrito`);
      } else {
        toast.error("Este producto no tiene stock");
      }
    }
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const item = cart.find((i) => i.id === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    if (newQuantity > (item.stock || 0)) {
      toast.error("No hay suficiente stock");
      return;
    }

    setCart(
      cart.map((i) =>
        i.id === productId ? { ...i, quantity: newQuantity } : i
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    const item = cart.find((i) => i.id === productId);
    setCart(cart.filter((i) => i.id !== productId));
    if (item) {
      toast.success(`${item.name} eliminado del carrito`);
    }
  };

  const handleFinalizeOrder = async () => {
    if (!selectedCustomer || cart.length === 0 || !currentUser?.id) {
      toast.error("Faltan datos para completar el pedido");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Guardando pedido...");

    try {
      // Obtener timestamp en zona horaria Argentina
      const now = new Date();
      const argentinaTime = new Date(
        now.toLocaleString("en-US", {
          timeZone: "America/Argentina/Buenos_Aires",
        })
      );

      const orderPayload = {
        customer_id: selectedCustomer.id,
        profile_id: currentUser.id,
        total_amount: total,
        status: "pendiente",
        payment_method: paymentMethod,
        amount_paid: amountReceived,
        amount_pending: total - amountReceived,
        created_at: argentinaTime.toISOString(),
      };

      console.log("🔍 Guardando pedido con:", orderPayload);

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select()
        .single();

      if (orderError || !orderData) {
        console.error("❌ Error al crear pedido:", orderError);
        throw new Error(orderError?.message || "Error al crear el pedido");
      }

      console.log("✅ Pedido guardado:", orderData);

      const orderItems = cart.map((item) => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        price: getProductPrice(item),
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        throw new Error(itemsError.message);
      }

      toast.success("¡Pedido registrado exitosamente!", { id: loadingToast });

      setTimeout(() => {
        router.push("/dashboard/pedidos");
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el pedido", {
        id: loadingToast,
      });
      setIsSubmitting(false);
    }
  };

  const getStockColor = (stock: number | null) => {
    if (!stock || stock === 0) return "text-red-600 bg-red-50";
    if (stock < 10) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
              <FaClipboardList className="text-purple-600" /> Nuevo Pedido
            </h1>
            <p className="text-gray-600 dark:text-slate-300 mt-1">
              Crea un nuevo pedido seleccionando cliente y productos
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-100 rounded-lg hover:bg-gray-300 transition-all font-semibold flex items-center gap-2"
          >
            <FaArrowLeft /> Cancelar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selección de Cliente */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg border-2 border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-gray-200 dark:border-slate-700">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center">
                  <FaUser className="text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-50">
                  1. Seleccionar Cliente
                </h2>
              </div>

              {/* Barra de búsqueda de clientes */}
              <div className="relative mb-4">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Buscar cliente por nombre, tipo o día de reparto..."
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Lista de Clientes */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                    <FaUser className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No se encontraron clientes</p>
                  </div>
                ) : (
                  filteredCustomers.map((customer) => {
                    const isSelected = selectedCustomer?.id === customer.id;
                    return (
                      <div
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          toast.success(
                            `Cliente seleccionado: ${customer.full_name}`
                          );
                        }}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md"
                            : "border-gray-200 dark:border-slate-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-slate-50">
                                {customer.full_name}
                              </h3>
                              {isSelected && (
                                <FaCheckCircle className="text-blue-600 w-4 h-4" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                  customer.customer_type === "mayorista"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {customer.customer_type === "mayorista"
                                  ? "🏢 Mayorista"
                                  : "👤 Minorista"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selección de Productos */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg border-2 border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-gray-200 dark:border-slate-700">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                  <FaBox className="text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-50">
                  2. Agregar Productos
                </h2>
              </div>

              {!selectedCustomer ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaUser className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-semibold">Selecciona un cliente primero</p>
                  <p className="text-sm mt-1">
                    Para ver los productos disponibles y sus precios
                  </p>
                </div>
              ) : (
                <>
                  {/* Buscador */}
                  <div className="relative mb-4">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar productos por nombre..."
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Lista de Productos */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <p className="text-center py-8 text-gray-500 dark:text-slate-400">
                        No se encontraron productos
                      </p>
                    ) : (
                      filteredProducts.map((product) => {
                        const isInCart = cart.some(
                          (item) => item.id === product.id
                        );
                        const price = getProductPrice(product);

                        return (
                          <div
                            key={product.id}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                              isInCart
                                ? "border-blue-300 bg-blue-50 dark:bg-blue-900/30"
                                : "border-gray-200 dark:border-slate-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-gray-900 dark:text-slate-50">
                                  {product.name}
                                </h3>
                                {isInCart && (
                                  <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                                    En carrito
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                                  ${price?.toFixed(2)}
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStockColor(
                                    product.stock
                                  )}`}
                                >
                                  Stock: {product.stock || 0}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleAddProduct(product)}
                              disabled={(product.stock || 0) === 0}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                              <FaPlus className="w-3 h-3" />
                              Agregar
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Panel de Carrito */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg border-2 border-gray-200 dark:border-slate-700 sticky top-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-gray-200 dark:border-slate-700">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                  <FaShoppingCart className="text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-50">
                  Resumen del Pedido
                </h2>
              </div>

              <div className="space-y-3 min-h-[300px] max-h-[400px] overflow-y-auto mb-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FaShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>El carrito está vacío</p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const price = getProductPrice(item);
                    const subtotal = price * item.quantity;

                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-200 dark:border-slate-700"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-slate-50 text-sm">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                              ${price.toFixed(2)} c/u
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Eliminar del carrito"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, -1)}
                              className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-100 dark:bg-slate-700 dark:hover:bg-slate-800/80 dark:bg-slate-800"
                              title="Disminuir cantidad"
                            >
                              <FaMinus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, 1)}
                              className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-100 dark:bg-slate-700 dark:hover:bg-slate-800/80 dark:bg-slate-800"
                              disabled={item.quantity >= (item.stock || 0)}
                              title="Aumentar cantidad"
                            >
                              <FaPlus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-slate-50">
                            ${subtotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t-2 border-gray-200 dark:border-slate-700 pt-4 space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-950 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-2">
                    <FaBox className="text-purple-600" /> Productos
                  </span>
                  <span className="font-bold text-gray-900 dark:text-slate-50">{cart.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-950 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-2">
                    📦 Unidades
                  </span>
                  <span className="font-bold text-gray-900 dark:text-slate-50">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-950 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                    Subtotal
                  </span>
                  <span className="font-bold text-gray-900 dark:text-slate-50">
                    $
                    {cart
                      .reduce(
                        (acc, item) =>
                          acc + getProductPrice(item) * item.quantity,
                        0
                      )
                      .toFixed(2)}
                  </span>
                </div>

                {/* Costo de Envío */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-2">
                    🚚 Costo de Envío
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 font-semibold">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingCost === 0 ? "" : shippingCost}
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value);
                        setShippingCost(value >= 0 ? value : 0);
                      }}
                      className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Descuento */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-2">
                    🏷️ Descuento
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 font-semibold">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount === 0 ? "" : discount}
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value);
                        setDiscount(value >= 0 ? value : 0);
                      }}
                      className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xl font-bold pt-3 border-t-2 border-gray-200 dark:border-slate-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 -mx-6 px-6 py-4 mt-3">
                  <span className="flex items-center gap-2">
                    <FaDollarSign className="text-green-600" /> TOTAL
                  </span>
                  <span className="text-green-600">${total.toFixed(2)}</span>
                </div>

                {/* Método de Pago */}
                <div className="pt-3 border-t-2 border-gray-200 dark:border-slate-700 mt-3">
                  <label className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <FaMoneyBillWave className="text-blue-600" /> Método de Pago
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("efectivo");
                        setAmountReceived(total);
                        setAmountCash(0);
                        setAmountTransfer(0);
                      }}
                      className={`px-4 py-3 rounded-lg border-2 transition-all font-semibold flex items-center justify-center gap-2 ${
                        paymentMethod === "efectivo"
                          ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 shadow-md"
                          : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
                      }`}
                    >
                      <FaMoneyBillWave /> Efectivo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("transferencia");
                        setAmountReceived(total);
                        setAmountCash(0);
                        setAmountTransfer(0);
                      }}
                      className={`px-4 py-3 rounded-lg border-2 transition-all font-semibold flex items-center justify-center gap-2 ${
                        paymentMethod === "transferencia"
                          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700 shadow-md"
                          : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      }`}
                    >
                      <FaDollarSign /> Transferencia
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("fiado");
                        setAmountReceived(0);
                        setAmountCash(0);
                        setAmountTransfer(0);
                      }}
                      className={`px-4 py-3 rounded-lg border-2 transition-all font-semibold flex items-center justify-center gap-2 ${
                        paymentMethod === "fiado"
                          ? "border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 text-orange-700 shadow-md"
                          : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30"
                      }`}
                    >
                      <FaFileInvoice /> Fiado
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("mixto");
                        setAmountReceived(0);
                        setAmountCash(0);
                        setAmountTransfer(0);
                      }}
                      className={`px-4 py-3 rounded-lg border-2 transition-all font-semibold flex items-center justify-center gap-2 ${
                        paymentMethod === "mixto"
                          ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 text-purple-700 shadow-md"
                          : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                      }`}
                    >
                      <FaDollarSign /> Mixto
                    </button>
                  </div>
                </div>

                {/* Monto Recibido */}
                {paymentMethod === "mixto" ? (
                  <div className="pt-3 border-t space-y-3">
                    <label className="block text-sm font-bold text-gray-800 dark:text-slate-100">
                      💰 Desglose de Pago Mixto
                    </label>

                    {/* Efectivo */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                        💵 Efectivo
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 font-semibold">
                            $
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={amountCash === 0 ? "" : amountCash}
                            onChange={(e) => {
                              const value =
                                e.target.value === ""
                                  ? 0
                                  : parseFloat(e.target.value);
                              setAmountCash(value);
                            }}
                            className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Transferencia */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                        🏦 Transferencia
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 font-semibold">
                            $
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={amountTransfer === 0 ? "" : amountTransfer}
                            onChange={(e) => {
                              const value =
                                e.target.value === ""
                                  ? 0
                                  : parseFloat(e.target.value);
                              setAmountTransfer(value);
                            }}
                            className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Total Recibido */}
                    <div className="bg-purple-50 dark:bg-purple-950/30 -mx-6 px-6 py-3 border-y border-purple-200 dark:border-purple-900">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-purple-700">
                          💳 Total Recibido:
                        </span>
                        <span className="text-lg font-bold text-purple-700">
                          ${(amountCash + amountTransfer).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                      Entrega Recibida
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 font-semibold">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={amountReceived === 0 ? "" : amountReceived}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value);
                            setAmountReceived(value);
                          }}
                          className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setAmountReceived(0)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-semibold text-sm"
                        title="Poner en cero"
                      >
                        ✕ 0
                      </button>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => setAmountReceived(total)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline font-semibold"
                      >
                        ✓ Pago completo
                      </button>
                    </div>
                  </div>
                )}

                {/* Saldo Pendiente */}
                {amountReceived < total && (
                  <div className="pt-3 bg-orange-50 dark:bg-orange-950/30 -mx-6 px-6 py-3 border-t border-orange-200 dark:border-orange-900">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-orange-700">
                        Saldo Pendiente:
                      </span>
                      <span className="text-lg font-bold text-orange-700">
                        ${(total - amountReceived).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Indicador de pago completo */}
                {amountReceived >= total && total > 0 && (
                  <div className="pt-3 bg-green-50 dark:bg-green-950/30 -mx-6 px-6 py-3 border-t border-green-200 dark:border-green-900">
                    <div className="flex items-center justify-center gap-2 text-green-700">
                      <FaCheckCircle />
                      <span className="text-sm font-semibold">
                        Pago Completo
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleFinalizeOrder}
                  disabled={
                    cart.length === 0 || !selectedCustomer || isSubmitting
                  }
                  className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
                >
                  <FaCheckCircle className="w-5 h-5" />
                  {isSubmitting ? "Guardando..." : "Guardar Pedido"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
