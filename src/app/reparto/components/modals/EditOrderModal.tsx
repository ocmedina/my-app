import { useState, useEffect } from "react";
import {
  FaEdit,
  FaTimes,
  FaSpinner,
  FaShoppingCart,
  FaMinus,
  FaPlus,
  FaCheck,
} from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { Database } from "@/lib/database.types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type FullOrder = {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  profile_id: string;
  customers: Customer;
  order_items: {
    id: string;
    quantity: number;
    price: number;
    product_id: string;
    products: { name: string; sku: string; stock: number } | null;
  }[];
};

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  onOrderUpdated: () => void;
}

export default function EditOrderModal({
  isOpen,
  onClose,
  orderId,
  onOrderUpdated,
}: EditOrderModalProps) {
  const [orderData, setOrderData] = useState<FullOrder | null>(null);
  const [editedItems, setEditedItems] = useState<
    {
      id: string;
      product_id: string;
      product_name: string;
      quantity: number;
      price: number;
      original_quantity: number;
      stock: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true);
      const fetchFullOrder = async () => {
        try {
          const { data: order, error } = await (supabase as any)
            .from("orders")
            .select("*, customers(*), order_items(*, products(*))")
            .eq("id", orderId)
            .single();

          if (error) throw error;

          if (order) {
            setOrderData(order as FullOrder);
            const items = order.order_items.map((item: any) => ({
              id: item.id,
              product_id: item.product_id,
              product_name: item.products?.name || "Producto desconocido",
              quantity: item.quantity,
              price: item.price,
              original_quantity: item.quantity,
              stock: item.products?.stock || 0,
            }));
            setEditedItems(items);
          }
        } catch (error: any) {
          toast.error("No se pudieron cargar los datos del pedido.");
          console.error(error);
          onClose();
        } finally {
          setLoading(false);
        }
      };
      fetchFullOrder();
    }
  }, [isOpen, orderId, onClose]);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    setEditedItems(
      editedItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setEditedItems(editedItems.filter((item) => item.id !== itemId));
  };

  const calculateNewTotal = () => {
    return editedItems.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );
  };

  const handleSave = async () => {
    if (!orderData) return;

    setIsSaving(true);
    const loadingToast = toast.loading("Actualizando pedido...");

    try {
      const newTotal = calculateNewTotal();

      // 1. Actualizar el total del pedido
      const { error: orderError } = await (supabase as any)
        .from("orders")
        .update({ total_amount: newTotal })
        .eq("id", orderId);

      if (orderError) throw orderError;

      // 2. Procesar cambios en los items
      for (const item of editedItems) {
        const quantityDiff = item.quantity - item.original_quantity;

        if (quantityDiff !== 0) {
          // Actualizar cantidad en order_items
          const { error: itemError } = await (supabase as any)
            .from("order_items")
            .update({ quantity: item.quantity })
            .eq("id", item.id);

          if (itemError) throw itemError;

          // Ajustar stock del producto SOLO si el pedido ya fue entregado
          if (orderData.status === "entregado") {
            const { data: productData } = await supabase
              .from("products")
              .select("stock")
              .eq("id", item.product_id)
              .single();

            if (productData) {
              const newStock = productData.stock - quantityDiff;
              await supabase
                .from("products")
                .update({ stock: Math.max(0, newStock) })
                .eq("id", item.product_id);
            }
          }
        }
      }

      // 3. Eliminar items que fueron removidos
      const removedItems = orderData.order_items.filter(
        (original: any) =>
          !editedItems.find((edited) => edited.id === original.id)
      );

      for (const removedItem of removedItems) {
        // Devolver stock SOLO si el pedido ya fue entregado
        if (orderData.status === "entregado") {
          const { data: productData } = await supabase
            .from("products")
            .select("stock")
            .eq("id", removedItem.product_id)
            .single();

          if (productData) {
            const newStock = productData.stock + removedItem.quantity;
            await supabase
              .from("products")
              .update({ stock: newStock })
              .eq("id", removedItem.product_id);
          }
        }

        // Eliminar item
        await (supabase as any)
          .from("order_items")
          .delete()
          .eq("id", removedItem.id);
      }

      toast.dismiss(loadingToast);
      toast.success("¡Pedido actualizado exitosamente!");
      onOrderUpdated();
      onClose();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "Error al actualizar el pedido");
      console.error("Error updating order:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-3xl flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaEdit /> Editar Pedido
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-white hover:bg-white dark:bg-slate-900 hover:bg-opacity-20 rounded-full p-2"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          {loading || !orderData ? (
            <div className="flex flex-col items-center justify-center h-48">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
              <p className="mt-4 text-gray-600 dark:text-slate-300">Cargando datos del pedido...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-slate-300">Cliente</p>
                <p className="text-lg font-bold text-gray-800 dark:text-slate-100">
                  {orderData.customers?.full_name}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-2">
                  <FaShoppingCart /> Productos
                </h3>
                {editedItems.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">
                    No hay productos en este pedido
                  </p>
                ) : (
                  editedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-700"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 dark:text-slate-100">
                          {item.product_name}
                        </p>
                        <p className="text-sm text-green-600 font-medium mt-1">
                          ${item.price.toFixed(2)} c/u
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                          Stock disponible:{" "}
                          {item.stock + item.original_quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-900 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all font-bold"
                        >
                          <FaMinus size={12} />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            handleQuantityChange(item.id, val);
                          }}
                          className="w-16 text-center font-bold text-lg border-2 border-gray-200 dark:border-slate-700 rounded-lg"
                        />
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-900 border-2 border-green-200 text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-all font-bold"
                        >
                          <FaPlus size={12} />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="ml-2 w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                          title="Eliminar producto"
                        >
                          <FaTimes size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-slate-300">Total Original:</span>
                  <span className="font-medium line-through text-gray-400">
                    ${orderData.total_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-800 dark:text-slate-100">
                    Nuevo Total:
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    ${calculateNewTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="p-6 border-t bg-gray-50 dark:bg-slate-950 rounded-b-3xl flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3 text-gray-600 dark:text-slate-300 font-semibold hover:bg-gray-200 dark:bg-slate-700 rounded-xl transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || loading || editedItems.length === 0}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <FaSpinner className="animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <FaCheck /> Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
