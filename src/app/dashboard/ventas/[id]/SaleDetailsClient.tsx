'use client'

import Link from 'next/link';
import { PDFDownloadLink } from '@react-pdf/renderer';
import SalePDFDocument from '@/components/SalePDFDocument';
import { FaPrint } from 'react-icons/fa';

export default function SaleDetailsClient({ sale }: { sale: any }) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Detalle de Venta</h1>
          <p className="text-sm text-gray-500">ID: {sale.id}</p>
        </div>
        <div className="flex gap-2">
            <Link href="/dashboard/ventas" className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100">
                &larr; Volver
            </Link>
            <PDFDownloadLink
                document={<SalePDFDocument sale={sale} />}
                fileName={`venta_${sale.id}.pdf`}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700"
            >
                {({ loading }) =>
                loading ? 'Generando...' : <><FaPrint /> Descargar PDF</>
                }
            </PDFDownloadLink>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-b pb-6">
        <div><p className="text-sm text-gray-500">Fecha de Venta</p><p className="font-semibold">{new Date(sale.created_at).toLocaleString()}</p></div>
        <div><p className="text-sm text-gray-500">Cliente</p><p className="font-semibold">{sale.customers?.full_name ?? 'N/A'}</p></div>
        <div><p className="text-sm text-gray-500">Vendedor</p><p className="font-semibold">{sale.profiles?.full_name ?? 'N/A'}</p></div>
      </div>

      <h2 className="text-xl font-bold mb-4">Productos</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(sale.sale_items || []).map((item: any, index: number) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.products?.name ?? 'Producto borrado'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.price?.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold text-gray-900">TOTAL</td>
              <td className="px-6 py-3 text-left text-sm font-bold text-gray-900">${sale.total_amount?.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}