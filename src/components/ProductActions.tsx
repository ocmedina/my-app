"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function ProductActions({
  productId,
  userRole,
}: {
  productId: string;
  userRole?: string | null;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres DESACTIVAR este producto?")) {
      return;
    }

    const loadingToast = toast.loading("Desactivando producto...");

    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", productId);

    if (error) {
      toast.error(`Error al desactivar el producto: ${error.message}`, {
        id: loadingToast,
      });
    } else {
      toast.success("✅ Producto desactivado exitosamente", {
        id: loadingToast,
      });
      router.refresh();
    }
  };

  if (userRole !== "administrador") {
    return <span className="text-gray-400 text-sm">Sin permisos</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/dashboard/products/edit/${productId}`}
        className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow-md text-xs font-medium flex items-center gap-1"
      >
        <FaEdit /> Editar
      </Link>
      <button
        onClick={handleDelete}
        className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-sm hover:shadow-md text-xs font-medium flex items-center gap-1"
      >
        <FaTrash /> Borrar
      </button>
    </div>
  );
}
