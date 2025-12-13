"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaReceipt, FaMoneyBillWave, FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface Payment {
    id: number;
    amount: number;
    created_at: string;
    type: string;
    customer_id: string;
    payment_method: string | null;
    comment: string | null;
}

interface PaymentHistoryListProps {
    initialPayments: Payment[];
}

export default function PaymentHistoryList({ initialPayments }: PaymentHistoryListProps) {
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>(initialPayments);
    const [cancellingPaymentId, setCancellingPaymentId] = useState<number | null>(null);

    const handleCancelPayment = async (payment: Payment) => {
        if (payment.payment_method === 'anulado') return;

        if (!window.confirm(`¿Está seguro de anular este pago de $${payment.amount}? Esta acción restaurará la deuda al cliente.`)) {
            return;
        }

        setCancellingPaymentId(payment.id);

        try {
            // 1. Mark payment as 'anulado'
            const { error: updateError } = await supabase
                .from("payments")
                .update({ payment_method: 'anulado' })
                .eq("id", payment.id);

            if (updateError) throw updateError;

            // 2. Restore Debt Logic (LIFO)
            let remainingRestoration = payment.amount;

            // Get candidate orders
            const { data: orders } = await supabase
                .from("orders")
                .select("id, amount_pending, total_amount, created_at")
                .eq("customer_id", payment.customer_id)
                .neq("status", "cancelado")
                .order("created_at", { ascending: false }); // Newest first

            // Get candidate sales
            const { data: sales } = await supabase
                .from("sales")
                .select("id, amount_pending, total_amount, created_at")
                .eq("customer_id", payment.customer_id)
                .eq("payment_method", "cuenta_corriente")
                .eq("is_cancelled", false)
                .order("created_at", { ascending: false }); // Newest first

            const allItems = [
                ...(orders?.map(o => ({ ...o, type: 'order', created_at: o.created_at || '' })) || []),
                ...(sales?.map(s => ({ ...s, type: 'sale', created_at: s.created_at || '' })) || [])
            ].sort((a, b) => {
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            });

            for (const item of allItems) {
                if (remainingRestoration <= 0.01) break;

                // Force types to number to avoid string concatenation issues if DB returns strings
                const total = Number(item.total_amount);
                const pending = Number(item.amount_pending);
                const paidAmount = total - pending;

                if (paidAmount > 0.01) {
                    const restoreAmount = Math.min(remainingRestoration, paidAmount);
                    const newPending = pending + restoreAmount;

                    if (item.type === 'order') {
                        await supabase.from("orders").update({ amount_pending: newPending }).eq("id", item.id);
                    } else {
                        await supabase.from("sales").update({ amount_pending: newPending }).eq("id", item.id);
                    }

                    remainingRestoration -= restoreAmount;
                }
            }

            alert("Pago anulado exitosamente. La deuda ha sido restaurada.");

            // Update local state to reflect change immediately
            setPayments(prev => prev.map(p =>
                p.id === payment.id ? { ...p, payment_method: 'anulado' } : p
            ));

            router.refresh(); // Refresh server components (like the debt totals)

            // Force reload to ensure debt card updates (temporary fix for sync issues)
            setTimeout(() => {
                window.location.reload();
            }, 500);

        } catch (error: any) {
            console.error("Error cancelling payment:", error);
            alert("Error al anular el pago: " + error.message);
        } finally {
            setCancellingPaymentId(null);
        }
    };

    if (!payments || payments.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                    No hay movimientos registrados
                </p>
                <p className="text-gray-300 text-sm mt-2">
                    Los pagos y compras aparecerán aquí
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {payments.map((payment) => {
                const isCompra = payment.type === "compra";
                const isCancelled = payment.payment_method === 'anulado';

                return (
                    <div
                        key={payment.id}
                        className={`flex justify-between items-center p-4 border border-gray-200 dark:border-slate-700 rounded-lg transition ${isCancelled ? 'bg-gray-50 dark:bg-slate-900 opacity-75' : 'hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-950'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className={`p-3 rounded-full ${isCancelled ? "bg-gray-200 dark:bg-slate-800" :
                                    isCompra ? "bg-red-100" : "bg-green-100"
                                    }`}
                            >
                                {isCompra ? (
                                    <FaReceipt className={`text-xl ${isCancelled ? 'text-gray-500' : 'text-red-600'}`} />
                                ) : (
                                    <FaMoneyBillWave className={`text-xl ${isCancelled ? 'text-gray-500' : 'text-green-600'}`} />
                                )}
                            </div>
                            <div>
                                <p className={`font-semibold ${isCancelled ? 'text-gray-500 line-through' : 'text-gray-800 dark:text-slate-100'}`}>
                                    {isCompra ? "🛒 Compra a Crédito" : "💰 Pago Recibido"}
                                    {isCancelled && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full no-underline">ANULADO</span>}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    {new Date(payment.created_at).toLocaleString("es-AR", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </p>
                                {payment.comment && (
                                    <p className="text-xs text-gray-400 italic mt-1">
                                        "{payment.comment}"
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                            <div>
                                <p
                                    className={`font-bold text-xl ${isCancelled ? "text-gray-400 line-through" :
                                        isCompra ? "text-red-600" : "text-green-600"
                                        }`}
                                >
                                    {isCompra ? "+" : "-"}$
                                    {Math.abs(payment.amount).toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                    {isCancelled ? "Movimiento anulado" : (isCompra ? "Suma a la deuda" : "Resta a la deuda")}
                                </p>
                            </div>

                            {!isCancelled && !isCompra && (
                                <button
                                    onClick={() => handleCancelPayment(payment)}
                                    disabled={cancellingPaymentId === payment.id}
                                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Anular pago"
                                >
                                    {cancellingPaymentId === payment.id ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
                                    ) : (
                                        <FaTrash />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
