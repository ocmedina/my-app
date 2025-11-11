// src/app/dashboard/clientes/new/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
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
} from "react-icons/fa";

export default function NewCustomerPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [customerType, setCustomerType] = useState("minorista");
  const [deliveryDay, setDeliveryDay] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) {
      toast.error("El nombre es obligatorio.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("customers").insert([
      {
        full_name: fullName,
        phone: phone || null,
        email: email || null,
        address: address || null,
        reference: reference || null,
        customer_type: customerType,
        delivery_day: deliveryDay || null,
      },
    ]);

    setIsSubmitting(false);

    if (error) {
      toast.error(`Error al crear el cliente: ${error.message}`);
    } else {
      toast.success("✅ Cliente creado exitosamente!");
      router.push("/dashboard/clientes");
      router.refresh();
    }
  };

  const daysOfWeek = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl p-6 shadow-lg">
        <button
          onClick={() => router.back()}
          className="text-white hover:text-blue-100 mb-3 inline-flex items-center gap-2 text-sm transition-colors"
        >
          <FaArrowLeft /> Volver
        </button>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FaUser className="text-blue-200" />
          Agregar Nuevo Cliente
        </h1>
        <p className="text-blue-100 mt-2">
          Complete la información del cliente
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
                className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
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
                placeholder="Juan Pérez"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="customerType"
                className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
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
                className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
              >
                <FaPhone className="text-gray-400" />
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 1234-5678"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
              >
                <FaEnvelope className="text-gray-400" />
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Ubicación */}
          <div className="border-l-4 border-orange-500 pl-4 mb-6 mt-8">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FaMapMarkerAlt className="text-orange-600" />
              Ubicación y Entrega
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
              >
                <FaMapMarkerAlt className="text-gray-400" />
                Dirección
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. Corrientes 1234, CABA"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="reference"
                className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
              >
                <FaInfoCircle className="text-gray-400" />
                Referencia
              </label>
              <input
                type="text"
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Entre Callao y Rodríguez Peña"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="deliveryDay"
              className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
            >
              <FaTruck className="text-gray-400" />
              Día de Reparto
            </label>
            <select
              id="deliveryDay"
              value={deliveryDay}
              onChange={(e) => setDeliveryDay(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "⏳ Guardando..." : "✅ Guardar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
