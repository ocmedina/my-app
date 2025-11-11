"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import { Database } from "@/lib/database.types";
import toast from "react-hot-toast";
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaInfoCircle,
  FaTruck,
  FaUserTag,
  FaArrowLeft,
  FaEdit,
} from "react-icons/fa";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Estados para cada campo del formulario
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customerType, setCustomerType] = useState("minorista");
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        // Llenamos los estados del formulario con los datos del cliente
        setFullName(data.full_name);
        setPhone(data.phone || "");
        setEmail(data.email || "");
        setCustomerType(data.customer_type);
        setAddress(data.address || "");
        setReference(data.reference || "");
      } else {
        toast.error("Error: Cliente no encontrado.");
        console.error("Error fetching customer:", error);
        router.push("/dashboard/clientes");
      }
      setLoading(false);
    };

    fetchCustomer();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const { error } = await supabase
      .from("customers")
      .update({
        full_name: fullName,
        phone: phone || null,
        email: email || null,
        customer_type: customerType,
        address: address || null,
        reference: reference || null,
      })
      .eq("id", id);

    setFormLoading(false);
    if (error) {
      toast.error(`Error al actualizar el cliente: ${error.message}`);
    } else {
      toast.success("✅ Cliente actualizado exitosamente!");
      router.push("/dashboard/clientes");
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Cargando datos del cliente...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-xl p-6 shadow-lg">
        <button
          onClick={() => router.back()}
          className="text-white hover:text-blue-100 mb-3 inline-flex items-center gap-2 text-sm transition-colors"
        >
          <FaArrowLeft /> Volver
        </button>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FaEdit className="text-purple-200" />
          Editar Cliente
        </h1>
        <p className="text-purple-100 mt-2">
          Actualice la información del cliente
        </p>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-b-xl shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="border-l-4 border-blue-500 pl-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FaUserTag className="text-blue-600" />
              Información Básica
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="fullName"
                className="flex text-sm font-semibold text-gray-700 mb-2 items-center gap-2"
              >
                <FaUser className="text-gray-400" />
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="customerType"
                className="flex text-sm font-semibold text-gray-700 mb-2 items-center gap-2"
              >
                <FaUserTag className="text-gray-400" />
                Tipo de Cliente <span className="text-red-500">*</span>
              </label>
              <select
                id="customerType"
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
                required
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="minorista">🛒 Minorista</option>
                <option value="mayorista">📦 Mayorista</option>
              </select>
            </div>
          </div>

          {/* Contacto */}
          <div className="border-l-4 border-green-500 pl-4 mb-6 mt-8">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FaPhone className="text-green-600" />
              Información de Contacto
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="phone"
                className="flex text-sm font-semibold text-gray-700 mb-2 items-center gap-2"
              >
                <FaPhone className="text-gray-400" />
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="flex text-sm font-semibold text-gray-700 mb-2 items-center gap-2"
              >
                <FaEnvelope className="text-gray-400" />
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Ubicación */}
          <div className="border-l-4 border-orange-500 pl-4 mb-6 mt-8">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FaMapMarkerAlt className="text-orange-600" />
              Ubicación
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="address"
                className="flex text-sm font-semibold text-gray-700 mb-2 items-center gap-2"
              >
                <FaMapMarkerAlt className="text-gray-400" />
                Dirección
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Ej: Av. Corrientes 1234, CABA"
              />
            </div>
            <div>
              <label
                htmlFor="reference"
                className="flex text-sm font-semibold text-gray-700 mb-2 items-center gap-2"
              >
                <FaInfoCircle className="text-gray-400" />
                Referencia
              </label>
              <input
                type="text"
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Ej: Entre Callao y Rodríguez Peña"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 border-t border-gray-200 mt-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formLoading ? "⏳ Actualizando..." : "💾 Actualizar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
