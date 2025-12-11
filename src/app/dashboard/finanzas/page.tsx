"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import {
    FaMoneyBillWave,
    FaShoppingCart,
    FaWallet,
    FaChartLine,
    FaPlus,
    FaCalendarAlt
} from "react-icons/fa";
import ExpensesTable from "./components/ExpensesTable";
import ExpenseModal from "./components/ExpenseModal";

export default function FinancesPage() {
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [summary, setSummary] = useState({
        income: 0,
        cost: 0,
        expenses: 0,
        profit: 0,
        incomeReparto: 0,
        incomeDesk: 0
    });
    const [debugError, setDebugError] = useState<string | null>(null);

    // States for Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);

    // Fecha filtro (default: mes actual)
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [year, month] = selectedMonth.split('-');
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();

            const startOfMonth = `${selectedMonth}-01`;
            const endOfMonth = `${selectedMonth}-${lastDay}`;

            // Supabase/Postgres needs ISO strings for timestamp comparison if column is timestamptz
            const startDate = new Date(`${startOfMonth}T00:00:00`).toISOString();
            const endDate = new Date(`${endOfMonth}T23:59:59.999`).toISOString();

            // 1. Fetch Expenses
            const { data: expensesData, error: expensesError } = await supabase
                .from("expenses")
                .select("*")
                .gte("date", startOfMonth)
                .lte("date", endOfMonth)
                .order("date", { ascending: false });

            if (expensesError) throw expensesError;
            setExpenses(expensesData || []);

            // 2. Fetch Orders (Reparto)
            const { data: ordersData, error: ordersError } = await supabase
                .from("orders")
                .select(`
          total_amount,
          status,
          order_items (
            quantity,
            product:products (
              cost_price
            )
          )
        `)
                .gte("created_at", startDate)
                .lte("created_at", endDate)
                .neq("status", "cancelado");

            if (ordersError) throw ordersError;

            // 3. Fetch Sales (Mostrador)
            const { data: deskSalesData, error: deskSalesError } = await supabase
                .from("sales")
                .select(`
          total_amount,
          is_cancelled,
          sale_items (
            quantity,
            product:products (
              cost_price
            )
          )
        `)
                .gte("created_at", startDate)
                .lte("created_at", endDate)
                .eq("is_cancelled", false); // Solo no canceladas

            // NOTA: Si sale error de "column is_cancelled does not exist", verificar nombre exacto.
            // Si sale error de permiso, ejecutar policy para sales.
            if (deskSalesError) {
                console.error("Error fetching desk sales:", deskSalesError);
                // No lanzamos error fatal para que siga mostrando lo de reparto al menos
                toast.error("Error al cargar ventas de mostrador");
            }

            let incomeReparto = 0;
            let incomeDesk = 0;
            let cost = 0;

            // Sum Orders (Reparto)
            ordersData?.forEach((order: any) => {
                incomeReparto += order.total_amount || 0;
                order.order_items?.forEach((item: any) => {
                    const itemCost = item.product?.cost_price || 0;
                    cost += itemCost * item.quantity;
                });
            });

            // Sum Desk Sales (Mostrador)
            if (deskSalesData) {
                deskSalesData.forEach((sale: any) => {
                    incomeDesk += sale.total_amount || 0;
                    sale.sale_items?.forEach((item: any) => {
                        const itemCost = item.product?.cost_price || 0;
                        cost += itemCost * item.quantity;
                    });
                });
            }

            const totalExpenses = expensesData?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
            const totalIncome = incomeReparto + incomeDesk;

            setSummary({
                income: totalIncome,
                incomeReparto,
                incomeDesk,
                cost,
                expenses: totalExpenses,
                profit: totalIncome - cost - totalExpenses
            });

        } catch (error: any) {
            const errorMsg = error.message || JSON.stringify(error);
            setDebugError(errorMsg);
            console.error("Error fetching finance data:", JSON.stringify(error, null, 2));
            console.error("Error Message:", error.message);
            console.error("Error Details:", error.details);
            console.error("Error Hint:", error.hint);
            // Solo mostramos toast si no es error de "tabla no existe" (que pasará al inicio)
            if (!error.message?.includes("relation")) {
                toast.error("Error al cargar datos financieros");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveExpense = async (expense: any) => {
        setSaving(true);
        try {
            if (expense.id) {
                // Update
                const { error } = await supabase
                    .from("expenses")
                    .update({
                        description: expense.description,
                        amount: expense.amount,
                        category: expense.category,
                        date: expense.date,
                    })
                    .eq("id", expense.id);
                if (error) throw error;
                toast.success("Gasto actualizado");
            } else {
                // Create
                const { error } = await supabase
                    .from("expenses")
                    .insert([{
                        description: expense.description,
                        amount: expense.amount,
                        category: expense.category,
                        date: expense.date,
                        // user_id se asigna auto en supabase si RLS usa auth.uid(), 
                        // pero si necesitamos explicito:
                        // user_id: (await supabase.auth.getUser()).data.user?.id
                    }]);
                if (error) throw error;
                toast.success("Gasto registrado");
            }

            setIsModalOpen(false);
            setEditingExpense(null);
            fetchData(); // Reload
        } catch (error: any) {
            console.error(error);
            toast.error("Error al guardar gasto: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este gasto?")) return;
        try {
            const { error } = await supabase.from("expenses").delete().eq("id", id);
            if (error) throw error;
            toast.success("Gasto eliminado");
            fetchData();
        } catch (error: any) {
            toast.error("Error al eliminar");
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-8">
            {/* ALERT: Error Debugging */}
            {debugError && (
                <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600 p-4 rounded-xl mb-6">
                    <h3 className="font-bold text-red-700 dark:text-red-300 flex items-center gap-2">
                        ⚠️ Error Detectado
                    </h3>
                    <pre className="mt-2 text-xs bg-white dark:bg-black/50 p-2 rounded text-red-800 dark:text-red-200 overflow-auto whitespace-pre-wrap">
                        {debugError}
                    </pre>
                </div>
            )}

            {summary.income === 0 && summary.cost === 0 && expenses.length === 0 && !debugError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl text-sm">
                    <p className="font-bold text-red-600 dark:text-red-400">Estado de Carga:</p>
                    <p className="text-gray-600 dark:text-slate-300">Si ves esto y los ceros abajo, puede haber un error.</p>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finanzas</h1>
                    <p className="text-gray-500 dark:text-slate-400">Resultados operativos y gestión de gastos</p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800">
                    <FaCalendarAlt className="text-gray-400" />
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 dark:text-slate-200"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* INGRESOS */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400">
                            <FaMoneyBillWave className="text-xl" />
                        </div>
                        <span className="text-xs font-bold px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                            + Ventas
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Ingresos Totales</p>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                            {formatCurrency(summary.income)}
                        </h3>
                        {/* Breakdown */}
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-xs text-gray-500 dark:text-slate-400 flex flex-col gap-1">
                            <div className="flex justify-between">
                                <span>Reparto:</span>
                                <span className="font-semibold text-gray-700 dark:text-slate-300">{formatCurrency(summary.incomeReparto)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Mostrador:</span>
                                <span className="font-semibold text-gray-700 dark:text-slate-300">{formatCurrency(summary.incomeDesk)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COSTOS */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                            <FaShoppingCart className="text-xl" />
                        </div>
                        <span className="text-xs font-bold px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                            - Mercadería
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Costo de Ventas</p>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                            {formatCurrency(summary.cost)}
                        </h3>
                    </div>
                </div>

                {/* GASTOS */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
                            <FaWallet className="text-xl" />
                        </div>
                        <span className="text-xs font-bold px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                            - Operativos
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Gastos Registrados</p>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                            {formatCurrency(summary.expenses)}
                        </h3>
                    </div>
                </div>

                {/* UTILIDAD */}
                <div className={`p-6 rounded-2xl shadow-lg border relative overflow-hidden group hover:shadow-xl transition-all
          ${summary.profit >= 0
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-700 border-indigo-500 text-white'
                        : 'bg-gradient-to-br from-red-600 to-orange-700 border-red-500 text-white'
                    }`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <FaChartLine className="text-xl text-white" />
                        </div>
                        <span className="text-xs font-bold px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white">
                            = Neto
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-white/80 font-medium">Utilidad Neta</p>
                        <h3 className="text-2xl font-black text-white mt-1">
                            {formatCurrency(summary.profit)}
                        </h3>
                    </div>

                    {/* Decorative */}
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
                </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Registro de Gastos</h3>
                    <button
                        onClick={() => {
                            setEditingExpense(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                    >
                        <FaPlus /> Nuevo Gasto
                    </button>
                </div>

                <ExpensesTable
                    expenses={expenses}
                    loading={loading}
                    onEdit={(expense) => {
                        setEditingExpense(expense);
                        setIsModalOpen(true);
                    }}
                    onDelete={handleDeleteExpense}
                />
            </div>

            <ExpenseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveExpense}
                initialData={editingExpense}
                saving={saving}
            />
        </div>
    );
}
