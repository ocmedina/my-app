import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
    FaDollarSign,
    FaUser,
    FaPhone,
    FaSearch,
    FaPrint,
} from "react-icons/fa";
import RegisterPayment from "@/components/RegisterPayment";

type DebtDetail = {
    id: string;
    full_name: string;
    phone?: string | null;
    email?: string | null;
    customer_type: string;
    ordersDebt: number;
    salesDebt: number;
    totalDebt: number;
    ordersCount: number;
    salesCount: number;
    orders: any[];
    sales: any[];
};

export default function DebtorsView({ onPrintRemito }: { onPrintRemito: (orderId: string) => void }) {
    const [deudores, setDeudores] = useState<DebtDetail[]>([]);

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<DebtDetail | null>(
        null
    );
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

    useEffect(() => {
        fetchDeudores();
    }, []);

    const fetchDeudores = async () => {
        setLoading(true);

        const { data: customersData, error: customersError } = await supabase
            .from("customers")
            .select("*");

        if (customersError) {
            console.error("Error fetching customers:", customersError);
            setLoading(false);
            return;
        }

        const deudoresData = await Promise.all(
            (customersData || []).map(async (customer) => {
                // Pending Orders
                const { data: ordersData } = await supabase
                    .from("orders")
                    .select("id, created_at, total_amount, amount_pending, order_items(id, quantity, price, products(name))")
                    .eq("customer_id", customer.id)
                    .gt("amount_pending", 0)
                    .neq("status", "cancelado")
                    .order('created_at', { ascending: false });

                const ordersDebt = (ordersData || []).reduce(
                    (sum, order) => sum + (order.amount_pending || 0),
                    0
                );

                // Pending Sales (Current Account)
                const { data: salesData } = await supabase
                    .from("sales")
                    .select("id, created_at, total_amount, amount_pending, description")
                    .eq("customer_id", customer.id)
                    .eq("payment_method", "cuenta_corriente")
                    .gt("amount_pending", 0)
                    .eq("is_cancelled", false)
                    .order('created_at', { ascending: false });

                const salesDebt = (salesData || []).reduce(
                    (sum, sale) => sum + ((sale as any).amount_pending || 0),
                    0
                );

                return {
                    id: customer.id,
                    full_name: customer.full_name,
                    phone: customer.phone,
                    email: customer.email,
                    customer_type: customer.customer_type,
                    ordersDebt,
                    salesDebt,
                    totalDebt: ordersDebt + salesDebt,
                    ordersCount: ordersData?.length || 0,
                    salesCount: salesData?.length || 0,
                    orders: ordersData || [],
                    sales: salesData || []
                };
            })
        );

        const clientesConDeuda = deudoresData
            .filter((d) => d.totalDebt > 0)
            .sort((a, b) => b.totalDebt - a.totalDebt);

        setDeudores(clientesConDeuda);
        setLoading(false);
    };

    const handleOpenPayment = (customer: DebtDetail) => {
        setSelectedCustomer(customer);
        setShowPaymentModal(true);
    };

    const handleClosePayment = () => {
        setShowPaymentModal(false);
        setSelectedCustomer(null);
        fetchDeudores();
    };

    const toggleExpand = (customerId: string) => {
        setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId);
    }

    const filteredDeudores = deudores.filter((d) =>
        d.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <FaUser className="text-red-500" /> Clientes Deudores
                </h2>

                {/* Search */}
                <div className="relative mb-4">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar deudor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-slate-200"
                    />
                </div>

                {/* Stats */}
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/50">
                    <p className="text-sm text-red-600 dark:text-red-400 mb-1">Total a cobrar</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                        ${deudores.reduce((sum, d) => sum + d.totalDebt, 0).toFixed(2)}
                    </p>
                </div>
            </div>

            {filteredDeudores.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p>No se encontraron deudores</p>
                </div>
            ) : (
                <div className="grid gap-4 px-1">
                    {filteredDeudores.map((deudor) => (
                        <div
                            key={deudor.id}
                            className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-gray-100 dark:border-slate-800 overflow-hidden"
                        >
                            <div
                                className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                                onClick={() => toggleExpand(deudor.id)}
                            >
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-slate-200">
                                        {deudor.full_name}
                                    </h3>
                                    {deudor.phone && (
                                        <div className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                                            <FaPhone className="text-xs" /> {deudor.phone}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-red-600 dark:text-red-400 text-lg">
                                        ${deudor.totalDebt.toFixed(2)}
                                    </p>
                                    <span className="text-xs text-gray-400 dark:text-slate-500">
                                        {expandedCustomerId === deudor.id ? 'Ocultar detalle' : 'Ver detalle'}
                                    </span>
                                </div>
                            </div>

                            {expandedCustomerId === deudor.id && (
                                <div className="bg-gray-50 dark:bg-slate-800/30 p-4 border-b border-gray-100 dark:border-slate-800 text-sm max-h-60 overflow-y-auto">
                                    {/* Orders Detail */}
                                    {deudor.orders.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Pedidos Pendientes</p>
                                            <div className="space-y-3">
                                                {deudor.orders.map((order: any) => (
                                                    <div key={order.id} className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-gray-100 dark:border-slate-700">
                                                        <div className="flex justify-between items-center mb-2 border-b border-gray-100 dark:border-slate-800 pb-2">
                                                            <div>
                                                                <p className="font-bold text-gray-800 dark:text-slate-200">Pedido #{order.id.slice(0, 6)}</p>
                                                                <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <button
                                                                    onClick={() => onPrintRemito(order.id)}
                                                                    className="text-xs mb-1 px-2 py-1 bg-blue-50 text-blue-600 rounded border border-blue-200 flex items-center gap-1 hover:bg-blue-100 transition-colors ml-auto"
                                                                >
                                                                    <FaPrint /> Remito
                                                                </button>
                                                                <p className="font-bold text-red-500">${order.amount_pending.toFixed(2)}</p>
                                                                <p className="text-xs text-gray-400">Total: ${order.total_amount.toFixed(2)}</p>
                                                            </div>
                                                        </div>

                                                        {/* Product List */}
                                                        <div className="space-y-1">
                                                            {order.order_items?.map((item: any) => (
                                                                <div key={item.id} className="flex justify-between text-xs text-gray-600 dark:text-slate-400">
                                                                    <span>{item.quantity}x {item.products?.name}</span>
                                                                    <span>${item.price.toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Sales Detail */}
                                    {deudor.sales.length > 0 && (
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Cuenta Corriente</p>
                                            <div className="space-y-2">
                                                {deudor.sales.map((sale: any) => (
                                                    <div key={sale.id} className="flex justify-between items-center text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700 pb-1 last:border-0">
                                                        <div>
                                                            <p className="font-medium">{sale.description || 'Venta'}</p>
                                                            <p className="text-xs text-gray-500">{new Date(sale.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-red-500">${sale.amount_pending.toFixed(2)}</p>
                                                            <p className="text-xs text-gray-400">de ${sale.total_amount.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="p-4 flex items-center justify-between bg-white dark:bg-slate-900">
                                <div>
                                    <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase">Deuda Total</p>
                                    <p className="text-xl font-bold text-red-700 dark:text-red-500">
                                        ${deudor.totalDebt.toFixed(2)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleOpenPayment(deudor)}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow font-medium flex items-center gap-2 text-sm transition-colors"
                                >
                                    <FaDollarSign />
                                    Cobrar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedCustomer && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-none">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                                    Registrar Cobro
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    {selectedCustomer.full_name}
                                </p>
                            </div>
                            <button onClick={handleClosePayment} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <div className="p-6">
                            <RegisterPayment
                                customerId={selectedCustomer.id}
                                currentDebt={selectedCustomer.totalDebt}
                                onSuccess={handleClosePayment}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
