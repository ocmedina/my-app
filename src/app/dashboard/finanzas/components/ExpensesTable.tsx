"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FaTrash, FaEdit, FaExclamationCircle } from "react-icons/fa";

interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
}

interface ExpensesTableProps {
    expenses: Expense[];
    onDelete: (id: string) => void;
    onEdit: (expense: Expense) => void;
    loading: boolean;
}

export default function ExpensesTable({ expenses, onDelete, onEdit, loading }: ExpensesTableProps) {
    if (loading) {
        return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando gastos...</div>;
    }

    if (expenses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400 dark:text-slate-500 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                <FaExclamationCircle className="text-4xl mb-3 opacity-50" />
                <p>No hay gastos registrados en este período.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                        <th className="px-6 py-4 rounded-tl-xl">Fecha</th>
                        <th className="px-6 py-4">Descripción</th>
                        <th className="px-6 py-4">Categoría</th>
                        <th className="px-6 py-4 text-right">Monto</th>
                        <th className="px-6 py-4 rounded-tr-xl text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {expenses.map((expense) => (
                        <tr
                            key={expense.id}
                            className="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-slate-300">
                                {format(new Date(expense.date), "dd/MM/yyyy", { locale: es })}
                            </td>
                            <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                                {expense.description}
                            </td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                                    {expense.category}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                {new Intl.NumberFormat("es-AR", {
                                    style: "currency",
                                    currency: "ARS",
                                }).format(expense.amount)}
                            </td>
                            <td className="px-6 py-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onEdit(expense)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    onClick={() => onDelete(expense.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                    title="Eliminar"
                                >
                                    <FaTrash />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
