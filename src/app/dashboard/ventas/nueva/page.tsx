"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { FaUser, FaShoppingCart, FaMoneyBillWave } from "react-icons/fa";

import {
  Customer,
  Supplier,
  SaleTab,
  Product,
  CartItem,
} from "./components/../types";
import ProductSearch from "./components/ProductSearch";
import PaymentModal from "./components/PaymentModal";
import ProductSearchModal from "./components/ProductSearchModal";
import CartList from "./components/CartList";
import SaleTabs from "./components/SaleTabs";
import ShortcutsBar from "./components/ShortcutsBar";

export default function NewSalePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
      payToSupplier: false,
      selectedSupplierId: null,
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
  const payToSupplier = activeTab.payToSupplier;
  const selectedSupplierId = activeTab.selectedSupplierId;

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

  const setPayToSupplier = (payToSupplier: boolean) => {
    updateActiveTab({ payToSupplier });
  };

  const setSelectedSupplierId = (selectedSupplierId: string | null) => {
    updateActiveTab({ selectedSupplierId });
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
      payToSupplier: false,
      selectedSupplierId: null,
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

        // Cargar proveedores
        const { data: suppliersData, error: suppliersError } = await supabase
          .from("suppliers")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (suppliersError) {
          console.error("Error cargando proveedores:", suppliersError);
        } else if (suppliersData) {
          // Mapear los datos al formato esperado
          const mappedSuppliers = suppliersData.map((s: any) => ({
            id: s.id,
            name: s.name,
            debt: s.debt || s.balance || s.total_debt || 0,
          }));
          setSuppliers(mappedSuppliers);
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
    if (newPrice === "") {
      setCart(
        cart.map((item) =>
          item.id === productId ? { ...item, customPrice: 0 } : item
        )
      );
      return;
    }

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

      // 6. Si el pago va directo a proveedor, registrar el pago y reducir su deuda
      if (payToSupplier && selectedSupplierId && paid > 0) {
        // Obtener deuda actual del proveedor
        const { data: supplierData, error: supplierError } = await supabase
          .from("suppliers")
          .select("debt")
          .eq("id", selectedSupplierId)
          .single();

        if (supplierError) throw supplierError;

        const currentSupplierDebt = (supplierData?.debt as number) || 0;
        // Permitir valores negativos (crédito a favor)
        const newSupplierDebt = currentSupplierDebt - paid;

        // Actualizar deuda del proveedor (puede quedar negativa = a favor)
        const { error: supplierUpdateError } = await supabase
          .from("suppliers")
          .update({ debt: newSupplierDebt })
          .eq("id", selectedSupplierId);

        if (supplierUpdateError) throw supplierUpdateError;

        // Registrar el pago en supplier_payments
        const { error: supplierPaymentError } = await supabase
          .from("supplier_payments")
          .insert({
            supplier_id: selectedSupplierId,
            amount: paid,
            notes: `Pago directo de venta ${saleData.id.substring(
              0,
              8
            )} - Cliente: ${selectedCustomer.full_name}`,
            created_at: argentinaTime.toISOString(),
          });

        if (supplierPaymentError) throw supplierPaymentError;

        // Mensaje según el resultado
        if (newSupplierDebt > 0) {
          toast.success(
            `¡Venta registrada! Pagado $${paid.toFixed(
              2
            )} a proveedor. Deuda restante: $${newSupplierDebt.toFixed(2)}`
          );
        } else if (newSupplierDebt === 0) {
          toast.success(
            `¡Venta registrada! Deuda con proveedor saldada completamente ($${paid.toFixed(
              2
            )})`
          );
        } else {
          toast.success(
            `¡Venta registrada! Deuda saldada. Crédito a favor: $${Math.abs(
              newSupplierDebt
            ).toFixed(2)}`
          );
        }
      } else {
        toast.success("¡Venta registrada exitosamente!");
      }

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-6 pb-16">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pestañas de Ventas */}
        <div className="mb-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 p-1">
          <SaleTabs
            tabs={tabs}
            activeTabId={activeTabId}
            editingTabId={editingTabId}
            editingTabName={editingTabName}
            onTabClick={setActiveTabId}
            onTabDoubleClick={startEditingTab}
            onNewTab={addNewTab}
            onCloseTab={closeTab}
            onSaveTabName={saveTabName}
            onCancelEditingTab={cancelEditingTab}
            setEditingTabName={setEditingTabName}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Buscador y Lista de Productos (si se quisiera mostrar) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Buscador de Productos */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <FaShoppingCart className="text-blue-600" /> Agregar Productos
              </h2>
              <ProductSearch
                onProductSelect={handleAddProduct}
                isEditingTab={editingTabId !== null}
              />
            </div>

            {/* Lista del Carrito */}
            <CartList
              cart={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveFromCart={handleRemoveFromCart}
              onUpdateCustomPrice={handleUpdateCustomPrice}
            />
          </div>

          {/* Columna Derecha: Cliente y Resumen */}
          <div className="lg:col-span-4 space-y-6">
            {/* Selección de Cliente */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <FaUser className="text-blue-600" /> Cliente
              </h2>
              <select
                value={selectedCustomer?.id || ""}
                onChange={(e) => {
                  const customer = customers.find(
                    (c) => c.id === e.target.value
                  );
                  setSelectedCustomer(customer || null);
                }}
                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-slate-950 hover:bg-white dark:bg-slate-900 transition-colors"
              >
                <option value="">Seleccionar cliente...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.full_name}
                  </option>
                ))}
              </select>
              {selectedCustomer && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Tipo:</span>{" "}
                    <span className="capitalize">
                      {selectedCustomer.customer_type}
                    </span>
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    <span className="font-semibold">Deuda Actual:</span> $
                    {(selectedCustomer.debt || 0).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {/* Resumen de Venta */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg border border-gray-100 sticky top-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <FaMoneyBillWave className="text-green-600" /> Resumen
              </h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-gray-600 dark:text-slate-300">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-slate-300">
                  <span>Impuestos</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t border-dashed border-gray-200 dark:border-slate-700 pt-4 flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900 dark:text-slate-50">Total</span>
                  <span className="text-3xl font-bold text-green-600">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (cart.length === 0) {
                    toast.error("El carrito está vacío");
                    return;
                  }
                  if (!selectedCustomer) {
                    toast.error("Selecciona un cliente");
                    return;
                  }
                  setShowPaymentPanel(true);
                }}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-lg"
              >
                <span>Pagar</span>
                <span className="bg-white dark:bg-slate-900/20 px-2 py-0.5 rounded text-sm font-normal">
                  F12
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <PaymentModal
        isOpen={showPaymentPanel}
        onClose={() => setShowPaymentPanel(false)}
        onConfirm={handleFinalizeSale}
        total={total}
        customerName={selectedCustomer?.full_name || "Cliente"}
        cartItemsCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
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
        payToSupplier={payToSupplier}
        setPayToSupplier={setPayToSupplier}
        selectedSupplierId={selectedSupplierId}
        setSelectedSupplierId={setSelectedSupplierId}
        suppliers={suppliers}
      />

      <ProductSearchModal
        isOpen={showProductSearchModal}
        onClose={() => setShowProductSearchModal(false)}
        onSelectProduct={handleAddProduct}
      />

      <ShortcutsBar />
    </div>
  );
}
