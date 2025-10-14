'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { PDFDownloadLink } from '@react-pdf/renderer';
import OrderPDFDocument from '@/components/OrderPDFDocument';
import { FaPrint, FaEdit } from 'react-icons/fa';

export default function OrderDetailsClient({ initialOrder }: { initialOrder: any }) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    const loadingToast = toast.loading('Actualizando estado...');

    if (newStatus === 'confirmado' && order.status === 'pendiente') {
      for (const item of order.order_items) {
        if (!item.products || item.products.stock < item.quantity) {
          toast.error(`Stock insuficiente para "${item.products?.name}".`);
          setLoading(false);
          toast.dismiss(loadingToast);
          return;
        }
      }
      for (const item of order.order_items) {
        const newStock = item.products.stock - item.quantity;
        await supabase.from('products').update({ stock: newStock }).eq('id', item.products.id);
      }
      toast.success('Stock descontado correctamente.');
    }
    
    if (newStatus === 'cancelado' && order.status === 'confirmado') {
      for (const item of order.order_items) {
        const newStock = (item.products.stock || 0) + item.quantity;
        await supabase.from('products').update({ stock: newStock }).eq('id', item.products.id);
      }
      toast.success('Stock devuelto al inventario.');
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id)
      .select()
      .single();

    toast.dismiss(loadingToast);

    if (error) {
      toast.error(`Error al cambiar el estado: ${error.message}`);
    } else if (data) {
      setOrder((prevOrder: typeof order) => ({ ...prevOrder, ...data }));
      toast.success(`Pedido actualizado a "${newStatus}".`);
    }

    setLoading(false);
    router.refresh();
  };

  const statusOptions: { [key: string]: string } = {
    'pendiente': 'confirmado',
    'confirmado': 'enviado',
    'enviado': 'entregado'
  };
  const nextStatus = statusOptions[order.status];

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Detalle de Pedido</h1>
          <p className="text-sm text-gray-500">ID: {order.id}</p>
        </div>
        <Link href="/dashboard/pedidos" className="text-blue-600 hover:underline">
          &larr; Volver al listado
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-b pb-6">
        <div><p className="text-sm text-gray-500">Fecha</p><p className="font-semibold">{new Date(order.created_at).toLocaleString()}</p></div>
        <div><p className="text-sm text-gray-500">Cliente</p><p className="font-semibold">{order.customers?.full_name ?? 'N/A'}</p></div>
        <div><p className="text-sm text-gray-500">Estado Actual</p><p className="font-semibold capitalize">{order.status}</p></div>
      </div>
      
      <h2 className="text-xl font-bold mb-4">Productos</h2>
      <table className="min-w-full divide-y divide-gray-200 mb-8">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {order.order_items?.map((item: any, index: number) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.products?.name ?? 'Producto no disponible'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.price?.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold text-gray-900">TOTAL</td>
            <td className="px-6 py-3 text-left text-sm font-bold text-gray-900">${order.total_amount?.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {order.status === 'pendiente' && (
            <Link 
              href={`/dashboard/pedidos/edit/${order.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              <FaEdit /> Editar Pedido
            </Link>
          )}
          {nextStatus && (
            <button onClick={() => handleStatusChange(nextStatus)} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Procesando...' : `Marcar como '${nextStatus}'`}
            </button>
          )}
          {order.status !== 'cancelado' && order.status !== 'entregado' && (
            <button onClick={() => handleStatusChange('cancelado')} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">
              Cancelar Pedido
            </button>
          )}
        </div>
        <PDFDownloadLink
          document={<OrderPDFDocument order={order} />}
          fileName={`pedido_${order.id.substring(0, 8)}.pdf`}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white font-bold rounded-md hover:bg-gray-800"
        >
          {({ loading }) =>
            loading ? 'Generando Remito...' : <><FaPrint /> Descargar Remito</>
          }
        </PDFDownloadLink>
      </div>
    </div>
  );
}