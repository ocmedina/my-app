"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatCurrency } from "@/lib/numberFormat";
import { FaReceipt, FaMoneyBillWave, FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface Payment {
    id: number | string;
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
    const [cancellingPaymentId, setCancellingPaymentId] = useState<number | string | null>(null);

    // Keep local state aligned when parent server data refreshes.
    useEffect(() => {
        setPayments(initialPayments);
    }, [initialPayments]);

    const handleCancelPayment = async (payment: Payment) => {
        if (payment.payment_method === 'anulado') return;

        if (!window.confirm(`¿Está seguro de anular este pago de ${formatCurrency(payment.amount)}? Esta acción restaurará la deuda al cliente.`)) {
            return;
        }

        setCancellingPaymentId(payment.id);

        try {
            const { data: txData, error: txError } = await supabase.rpc(
                "cancel_customer_payment_transaction",
                { p_payment_id: payment.id }
            );

            if (txError) throw txError;

            const result = (txData || {}) as { remaining_unrestored?: number | null };
            const remainingUnrestored = Number(result.remaining_unrestored || 0);

            if (remainingUnrestored > 0.01) {
                alert(
                    `Pago anulado exitosamente.\nParte del monto no pudo restaurarse: ${formatCurrency(remainingUnrestored)}`
                );
            } else {
                alert("Pago anulado exitosamente. La deuda ha sido restaurada.");
            }

            // Update local state to reflect change immediately
            setPayments(prev => prev.map(p =>
                p.id === payment.id ? { ...p, payment_method: 'anulado' } : p
            ));

            router.refresh(); // Refresh server components (like the debt totals)

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            console.error("Error cancelling payment:", error);
            alert("Error al anular el pago: " + errorMessage);
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
                                    {isCompra ? "+" : "-"}
                                    {formatCurrency(Math.abs(payment.amount))}
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
