import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";
import { Database } from "@/lib/database.types";
import {
  FaMoneyBillWave,
  FaReceipt,
  FaArrowLeft,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import RegisterSupplierPayment from "@/components/RegisterSupplierPayment";

export const dynamic = "force-dynamic";

type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
type Payment = Database["public"]["Tables"]["supplier_payments"]["Row"];
type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

// Union type for history items
type HistoryItem =
  | (Purchase & { type: "compra"; amount: number })
  | (Payment & { type: "pago" });

async function getSupplierAccount(id: string) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .single();

  // Obtenemos tanto las compras (deuda generada) como los pagos (deuda saldada)
  const { data: purchases } = await supabase
    .from("purchases")
    .select("*")
    .eq("supplier_id", id)
    .order("created_at", { ascending: false });

  const { data: payments } = await supabase
    .from("supplier_payments")
    .select("*")
    .eq("supplier_id", id)
    .order("created_at", { ascending: false });

  // Combinamos y ordenamos por fecha para un historial completo
  // Mapeamos total_amount a amount para purchases
  const history: HistoryItem[] = [
    ...(purchases || []).map((p) => ({
      ...p,
      type: "compra" as const,
      amount: Number(p.total_amount) || 0,
    })),
    ...(payments || []).map((p) => ({ ...p, type: "pago" as const })),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return { supplier, history };
}

export default async function SupplierDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { supplier, history } = await getSupplierAccount(params.id);

  if (!supplier) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-xl text-gray-600">Proveedor no encontrado.</p>
          <Link
            href="/dashboard/proveedores"
            className="text-blue-600 mt-4 inline-block"
          >
            Volver a proveedores
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <Link
          href="/dashboard/proveedores"
          className="text-blue-600 mb-4 inline-flex items-center gap-2 text-sm hover:text-blue-800 transition-colors"
        >
          <FaArrowLeft /> Volver
        </Link>

        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mt-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800">
              {supplier.name}
            </h1>
            {supplier.contact_person && (
              <p className="text-sm text-gray-500 mt-1">
                {supplier.contact_person}
              </p>
            )}
            {supplier.phone && (
              <p className="text-sm text-gray-500">{supplier.phone}</p>
            )}
          </div>

          <div
            className={`text-right px-6 py-4 rounded-lg border-2 ${
              (supplier.debt || 0) > 0
                ? "bg-red-50 border-red-400"
                : (supplier.debt || 0) < 0
                ? "bg-green-50 border-green-400"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <p className="text-sm font-medium uppercase text-gray-700 flex items-center justify-end gap-2">
              {(supplier.debt || 0) > 0 ? (
                <>
                  <FaExclamationTriangle className="text-red-600" /> Deuda
                  Pendiente
                </>
              ) : (supplier.debt || 0) < 0 ? (
                <>
                  <FaCheckCircle className="text-green-600" /> Crédito a Favor
                </>
              ) : (
                "Saldo"
              )}
            </p>
            <p
              className={`text-4xl font-bold mt-2 ${
                (supplier.debt || 0) > 0
                  ? "text-red-600"
                  : (supplier.debt || 0) < 0
                  ? "text-green-600"
                  : "text-gray-600"
              }`}
            >
              ${Math.abs(supplier.debt || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <RegisterSupplierPayment
        supplierId={supplier.id}
        currentDebt={supplier.debt || 0}
      />

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Historial de Cuenta</h2>
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No hay movimientos</p>
          ) : (
            history.map((item) => {
              const isCompra = item.type === "compra";
              const displayTitle = isCompra
                ? `Factura #${
                    "invoice_number" in item && item.invoice_number
                      ? item.invoice_number
                      : item.id.substring(0, 8)
                  }`
                : "Pago Realizado";

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-full flex-shrink-0 ${
                        isCompra ? "bg-red-100" : "bg-green-100"
                      }`}
                    >
                      {isCompra ? (
                        <FaReceipt className="text-red-600" />
                      ) : (
                        <FaMoneyBillWave className="text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{displayTitle}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString("es-AR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {(("comment" in item && item.comment) ||
                        ("notes" in item && item.notes)) && (
                        <p className="text-xs text-gray-400 italic mt-1">
                          {"notes" in item
                            ? item.notes
                            : "comment" in item
                            ? item.comment
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <p
                    className={`font-bold text-xl ${
                      isCompra ? "text-red-600" : "text-green-600"
                    } sm:text-right`}
                  >
                    {isCompra ? "+" : "-"}${item.amount.toFixed(2)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
