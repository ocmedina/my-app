// src/app/dashboard/pedidos/[id]/page.tsx
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Link from "next/link";
import { Database } from "@/lib/database.types";
import OrderDetailsClient from "./OrderDetailsClient"; // Componente cliente

// Forzar renderizado dinámico para evitar caché
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Función para obtener los detalles del pedido desde el servidor
async function getOrderDetails(orderId: string) {
  const supabase = supabaseAdmin;
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      created_at,
      total_amount,
      status,
      customers ( full_name, customer_type ),
      profiles ( full_name ),
      order_items (
        quantity,
        price,
        products ( id, name, sku, stock )
      )
    `
    )
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("Error fetching order details:", error);
    return null;
  }
  return data;
}

// Componente de servidor principal
export default async function OrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const order = await getOrderDetails(params.id);

  if (!order) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">Pedido no encontrado</h1>
        <Link
          href="/dashboard/pedidos"
          className="text-blue-600 mt-4 inline-block"
        >
          &larr; Volver al listado
        </Link>
      </div>
    );
  }

  return <OrderDetailsClient initialOrder={order} />;
}
