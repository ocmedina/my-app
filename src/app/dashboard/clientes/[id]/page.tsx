import { createClient } from "@/lib/server";
import { createLooseAdminClient } from "@/lib/admin";
import Link from "next/link";
import { Database } from "@/lib/database.types";
import { formatCurrency } from "@/lib/numberFormat";
import {
  FaMoneyBillWave,
  FaReceipt,
  FaArrowLeft,
  FaMapMarkerAlt,
} from "react-icons/fa"; // Importa el ícono de dirección
import RegisterPayment from "@/components/payments/RegisterPayment";
import PaymentHistoryList from "@/components/payments/PaymentHistoryList";
import ExportCustomerMovementsButton from "@/components/exports/ExportCustomerMovementsButton";

// Desactivar cache de Next.js
export const dynamic = "force-dynamic";

// Usamos los tipos generados de Supabase en lugar de manuales
type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type PaymentHistoryEntry = {
  id: number | string;
  amount: number;
  created_at: string;
  type: string;
  customer_id: string;
  payment_method: string | null;
  comment: string | null;
};

type PaymentHistoryRaw = PaymentHistoryEntry & {
  sale_id?: string | null;
};

const PAYMENTS_SELECT_WITH_SALE_ID =
  "id, amount, created_at, type, customer_id, payment_method, comment, sale_id";
const PAYMENTS_SELECT_BASE =
  "id, amount, created_at, type, customer_id, payment_method, comment";

function isMissingSaleIdColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const message = String((error as { message?: string }).message || "").toLowerCase();
  const details = String((error as { details?: string }).details || "").toLowerCase();

  return message.includes("sale_id") || details.includes("sale_id");
}

async function fetchPaymentRows(client: any, customerId: string): Promise<{
  rows: PaymentHistoryRaw[];
  error: unknown;
}> {
  const withSaleId = await client
    .from("payments")
    .select(PAYMENTS_SELECT_WITH_SALE_ID)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (!withSaleId.error) {
    return {
      rows: (withSaleId.data || []) as PaymentHistoryRaw[],
      error: null,
    };
  }

  if (!isMissingSaleIdColumnError(withSaleId.error)) {
    return { rows: [], error: withSaleId.error };
  }

  const withoutSaleId = await client
    .from("payments")
    .select(PAYMENTS_SELECT_BASE)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (withoutSaleId.error) {
    return { rows: [], error: withoutSaleId.error };
  }

  return {
    rows: ((withoutSaleId.data || []) as PaymentHistoryEntry[]).map((row) => ({
      ...row,
      sale_id: null,
    })),
    error: null,
  };
}

type OrderHistoryRow = {
  id: string;
  created_at: string;
  payment_method: string | null;
  status: string | null;
  total_amount?: number | null;
  amount_paid?: number | null;
  amount_pending?: number | null;
};

type SaleHistoryRow = {
  id: string;
  created_at: string;
  payment_method: string | null;
  total_amount?: number | null;
  amount_paid?: number | null;
  amount_pending?: number | null;
  is_cancelled?: boolean | null;
};

function buildSyntheticMovements(
  customerId: string,
  payments: PaymentHistoryRaw[],
  orders: OrderHistoryRow[],
  sales: SaleHistoryRow[]
): PaymentHistoryEntry[] {
  const useTotalAmountFallback = payments.length === 0;

  const saleIdsWithPurchaseMovement = new Set(
    payments
      .filter((p) => p.type === "compra" && !!p.sale_id)
      .map((p) => String(p.sale_id))
  );

  const hasOrderPurchaseMovement = (orderId: string) => {
    const shortId = orderId.slice(0, 8).toLowerCase();
    return payments.some((p) => {
      if (p.type !== "compra" || !p.comment) return false;
      const comment = p.comment.toLowerCase();
      return (
        comment.includes(`pedido #${shortId}`) ||
        comment.includes(`pedido ${shortId}`)
      );
    });
  };

  const synthetic: PaymentHistoryEntry[] = [];

  for (const order of orders) {
    if (order.status === "cancelado") continue;

    const totalAmount = Number(order.total_amount || 0);
    const amountPaid = Number(order.amount_paid || 0);
    const currentPending = Number(order.amount_pending || 0);
    const inferredDebtAtCreation = Math.max(0, totalAmount - amountPaid);
    const movementAmount = inferredDebtAtCreation > 0.01
      ? inferredDebtAtCreation
      : useTotalAmountFallback
      ? totalAmount
      : currentPending;

    if (movementAmount <= 0.01) continue;
    if (hasOrderPurchaseMovement(order.id)) continue;

    synthetic.push({
      id: `order-${order.id}`,
      amount: movementAmount,
      created_at: order.created_at,
      type: "compra",
      customer_id: customerId,
      payment_method: order.payment_method,
      comment: `Pedido #${order.id.slice(0, 8)} - saldo pendiente`,
    });
  }

  for (const sale of sales) {
    if (sale.is_cancelled) continue;

    const totalAmount = Number(sale.total_amount || 0);
    const amountPaid = Number(sale.amount_paid || 0);
    const currentPending = Number(sale.amount_pending || 0);
    const inferredDebtAtCreation = Math.max(0, totalAmount - amountPaid);
    const movementAmount = inferredDebtAtCreation > 0.01
      ? inferredDebtAtCreation
      : useTotalAmountFallback
      ? totalAmount
      : currentPending;

    if (movementAmount <= 0.01) continue;
    if (saleIdsWithPurchaseMovement.has(sale.id)) continue;

    synthetic.push({
      id: `sale-${sale.id}`,
      amount: movementAmount,
      created_at: sale.created_at,
      type: "compra",
      customer_id: customerId,
      payment_method: sale.payment_method,
      comment: `Venta #${sale.id.slice(0, 8)} - cuenta corriente`,
    });
  }

  return synthetic;
}

// Esta es la forma estándar de definir props en una página dinámica de Next.js
interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage(
  props: CustomerDetailPageProps
) {
  const params = await props.params;
  const normalizedId = decodeURIComponent(params.id).trim();
  const supabase = await createClient();
  const adminClient = createLooseAdminClient();

  // Obtenemos los datos del cliente
  const { data: customerData } = await supabase
    .from("customers")
    .select("*")
    .eq("id", normalizedId)
    .maybeSingle();

  const customer =
    customerData ||
    (
      (
        await adminClient
          .from("customers")
          .select("*")
          .eq("id", normalizedId)
          .maybeSingle()
      ).data as CustomerRow | null
    );

  // Obtenemos movimientos base (payments); hay fallback si la DB aun no tiene sale_id.
  const primaryPayments = await fetchPaymentRows(supabase, normalizedId);
  let basePayments: PaymentHistoryRaw[] = primaryPayments.rows;

  if (primaryPayments.error || basePayments.length === 0) {
    const adminPayments = await fetchPaymentRows(adminClient, normalizedId);
    if (adminPayments.rows.length > 0 || primaryPayments.error) {
      basePayments = adminPayments.rows;
    }
  }

  const { data: ordersHistoryData, error: ordersHistoryError } = await supabase
    .from("orders")
    .select("id, created_at, payment_method, status, total_amount, amount_paid, amount_pending")
    .eq("customer_id", normalizedId)
    .neq("status", "cancelado")
    .order("created_at", { ascending: false });

  const ordersHistory = ordersHistoryError
    ? ((
        await adminClient
          .from("orders")
          .select("id, created_at, payment_method, status, total_amount, amount_paid, amount_pending")
          .eq("customer_id", normalizedId)
          .neq("status", "cancelado")
          .order("created_at", { ascending: false })
      ).data as OrderHistoryRow[] | null)
    : (ordersHistoryData as unknown as OrderHistoryRow[] | null);

  const { data: salesHistoryData, error: salesHistoryError } = await supabase
    .from("sales")
    .select("id, created_at, payment_method, total_amount, amount_paid, amount_pending, is_cancelled")
    .eq("customer_id", normalizedId)
    .eq("is_cancelled", false)
    .order("created_at", { ascending: false });

  const salesHistory = salesHistoryError
    ? ((
        await adminClient
          .from("sales")
          .select("id, created_at, payment_method, total_amount, amount_paid, amount_pending, is_cancelled")
          .eq("customer_id", normalizedId)
          .eq("is_cancelled", false)
          .order("created_at", { ascending: false })
      ).data as SaleHistoryRow[] | null)
    : (salesHistoryData as unknown as SaleHistoryRow[] | null);

  if (!customer) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600">
          Cliente no encontrado
        </h1>
        <Link
          href="/dashboard/clientes"
          className="text-blue-600 mt-4 inline-flex items-center gap-2 hover:underline"
        >
          <FaArrowLeft /> Volver al listado
        </Link>
      </div>
    );
  }

  const customerReference = (customer as any).reference as string | null;

  const ordersData = (ordersHistory || []).filter(
    (order) => Number(order.amount_pending || 0) > 0
  );

  const salesData = (salesHistory || []).filter(
    (sale) =>
      (sale.payment_method || "") === "cuenta_corriente" &&
      Number(sale.amount_pending || 0) > 0 &&
      !sale.is_cancelled
  );

  const ordersDebt = (ordersData || []).reduce(
    (sum, order) => sum + Number(order.amount_pending || 0),
    0
  );

  const salesDebt = (salesData || []).reduce(
    (sum, sale) => sum + Number(sale.amount_pending || 0),
    0
  );

  const currentDebt = ordersDebt + salesDebt;

  const syntheticMovements = buildSyntheticMovements(
    customer.id,
    basePayments,
    ordersHistory || [],
    salesHistory || []
  );

  const historyMovements: PaymentHistoryEntry[] = [
    ...basePayments,
    ...syntheticMovements,
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
        <Link
          href="/dashboard/clientes"
          className="text-blue-600 mb-4 inline-flex items-center gap-2 hover:underline text-sm"
        >
          <FaArrowLeft /> Volver a clientes
        </Link>

        <div className="flex justify-between items-start mt-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">
              {customer.full_name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 capitalize mt-1">
              Tipo: {customer.customer_type}
            </p>
            {customer.email && (
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <span className="text-gray-400">📧</span> {customer.email}
              </p>
            )}
            {customer.phone && (
              <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2">
                <span className="text-gray-400">📱</span> {customer.phone}
              </p>
            )}
            {customer.address && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-200 dark:border-slate-700">
                <p className="text-sm text-gray-700 dark:text-slate-200 flex items-center gap-2 font-medium">
                  <FaMapMarkerAlt className="text-blue-500" />
                  <span>Dirección:</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-300 ml-6 mt-1">
                  {customer.address}
                </p>
                {customerReference && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 ml-6 mt-1 italic">
                    Ref: {customerReference}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="text-right bg-gray-50 dark:bg-slate-950 px-6 py-4 rounded-lg border-2 border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium uppercase">
              Deuda Pendiente
            </p>
            <p
              className={`text-4xl font-bold mt-2 ${currentDebt > 0 ? "text-red-600" : "text-green-600"
                }`}
            >
              {formatCurrency(currentDebt)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {currentDebt > 0
                ? "Pedidos y ventas pendientes"
                : "Sin deuda pendiente"}
            </p>
          </div>
        </div>
      </div>

      {/* Solo mostramos el formulario de pago si el cliente debe dinero */}
      {currentDebt > 0 && (
        <RegisterPayment customerId={customer.id} currentDebt={currentDebt} />
      )}

      {/* Pedidos y Ventas con saldo pendiente */}
      {currentDebt > 0 && (ordersData?.length || salesData?.length) && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-orange-600">📋</span> Fiados Pendientes
          </h2>

          <div className="space-y-4">
            {/* Pedidos Fiados */}
            {ordersData && ordersData.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase mb-2">
                  Pedidos
                </h3>
                <div className="space-y-2">
                  {ordersData
                    .filter((order: any) => (order.amount_pending || 0) > 0)
                    .map((order: any) => (
                      <div
                        key={order.id}
                        className="flex justify-between items-center p-4 border-2 border-orange-200 bg-orange-50 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-slate-100">
                            Pedido #{order.id?.substring(0, 8)}
                          </p>
                          <Link
                            href={`/dashboard/pedidos/${order.id}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Ver detalles →
                          </Link>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-slate-300">
                            Saldo Pendiente
                          </p>
                          <p className="text-2xl font-bold text-orange-600">
                            {formatCurrency(order.amount_pending)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Ventas en Cuenta Corriente */}
            {salesData && salesData.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-slate-300 uppercase mb-2">
                  Ventas
                </h3>
                <div className="space-y-2">
                  {salesData
                    .filter((sale: any) => (sale.amount_pending || 0) > 0)
                    .map((sale: any) => (
                      <div
                        key={sale.id}
                        className="flex justify-between items-center p-4 border-2 border-red-200 bg-red-50 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-slate-100">
                            Venta #{sale.id?.substring(0, 8)}
                          </p>
                          <Link
                            href={`/dashboard/ventas/${sale.id}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Ver detalles →
                          </Link>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-slate-300">
                            Saldo Pendiente
                          </p>
                          <p className="text-2xl font-bold text-red-600">
                            {formatCurrency(sale.amount_pending)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold">Historial de Movimientos</h2>
          <ExportCustomerMovementsButton
            customerName={customer.full_name}
            payments={historyMovements}
          />
        </div>
        <PaymentHistoryList initialPayments={historyMovements} />
      </div>
    </div>
  );
}
