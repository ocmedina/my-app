"use client";

import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import Link from "next/link";
import { FaEdit, FaTrash } from "react-icons/fa";

interface SupplierActionsProps {
  supplierId: string;
  onUpdate: () => void;
  userRole?: string | null;
}

export default function SupplierActions({
  supplierId,
  onUpdate,
  userRole,
}: SupplierActionsProps) {
  const handleDeactivate = async () => {
    if (!confirm("¿Estás seguro de que quieres desactivar este proveedor?")) {
      return;
    }

    const loadingToast = toast.loading("Desactivando proveedor...");

    const { error } = await supabase
      .from("suppliers")
      .update({ is_active: false })
      .eq("id", supplierId);

    if (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } else {
      toast.success("Proveedor desactivado exitosamente", { id: loadingToast });
      onUpdate();
    }
  };

  // Si no es administrador, mostrar mensaje o nada
  if (userRole !== "administrador") {
    return <span className="text-gray-400 text-xs">Sin permisos</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/dashboard/proveedores/edit/${supplierId}`}
        className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium text-xs flex items-center gap-1.5 shadow-sm"
      >
        <FaEdit /> Editar
      </Link>
      <button
        onClick={handleDeactivate}
        className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium text-xs flex items-center gap-1.5 shadow-sm"
      >
        <FaTrash /> Desactivar
      </button>
    </div>
  );
}
