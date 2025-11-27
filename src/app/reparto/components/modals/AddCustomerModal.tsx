import { useState } from "react";
import {
  FaTimes,
  FaSpinner,
  FaMapMarkerAlt,
  FaInfoCircle,
} from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { Database } from "@/lib/database.types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded: (customer: Customer) => void;
}

export default function AddCustomerModal({
  isOpen,
  onClose,
  onCustomerAdded,
}: AddCustomerModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    reference: "",
    customer_type: "minorista" as "minorista" | "mayorista",
    delivery_day: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysOfWeek = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          reference: formData.reference.trim() || null,
          customer_type: formData.customer_type,
          delivery_day: formData.delivery_day || null,
          is_active: true,
          debt: 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("¡Cliente agregado exitosamente!");
      onCustomerAdded(data);
      setFormData({
        full_name: "",
        phone: "",
        email: "",
        address: "",
        reference: "",
        customer_type: "minorista",
        delivery_day: "",
      });
      onClose();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg flex justify-between items-center sticky top-0">
          <h2 className="text-xl font-bold text-white">
            Agregar Nuevo Cliente
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Primera fila: Nombre y Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre Completo *
              </label>
              <input
                type="text"
                id="fullName"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>

            <div>
              <label
                htmlFor="customerType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tipo de Cliente *
              </label>
              <select
                id="customerType"
                value={formData.customer_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer_type: e.target.value as "minorista" | "mayorista",
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                required
              >
                <option value="minorista">Minorista</option>
                <option value="mayorista">Mayorista</option>
              </select>
            </div>
          </div>

          {/* Segunda fila: Teléfono y Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Ej: 2612345678"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Ej: cliente@email.com"
              />
            </div>
          </div>

          {/* Tercera fila: Dirección y Referencia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"
              >
                <FaMapMarkerAlt className="text-gray-400" />
                Dirección
              </label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Ej: Av. Corrientes 1234, CABA"
              />
            </div>

            <div>
              <label
                htmlFor="reference"
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"
              >
                <FaInfoCircle className="text-gray-400" />
                Referencia
              </label>
              <input
                type="text"
                id="reference"
                value={formData.reference}
                onChange={(e) =>
                  setFormData({ ...formData, reference: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Ej: Entre Callao y Rodríguez Peña"
              />
            </div>
          </div>

          {/* Cuarta fila: Día de Reparto */}
          <div>
            <label
              htmlFor="deliveryDay"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Día de Reparto (Opcional)
            </label>
            <select
              id="deliveryDay"
              value={formData.delivery_day}
              onChange={(e) =>
                setFormData({ ...formData, delivery_day: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">Ninguno</option>
              {daysOfWeek.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" /> Guardando...
                </>
              ) : (
                "Guardar Cliente"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
