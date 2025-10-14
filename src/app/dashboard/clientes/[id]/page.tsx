// src/app/dashboard/clientes/[id]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Database } from '@/lib/database.types';
import { FaMoneyBillWave, FaReceipt } from 'react-icons/fa';
import RegisterPayment from '@/components/RegisterPayment';

// La lógica de obtención de datos ahora está dentro del componente principal.
export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient<Database>({ cookies });

  // Obtenemos los datos del cliente y sus pagos
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.id)
    .single();

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('customer_id', params.id)
    .order('created_at', { ascending: false });

  if (!customer) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">Cliente no encontrado</h1>
        <Link href="/dashboard/clientes" className="text-blue-600 mt-4 inline-block">
          &larr; Volver al listado
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{customer.full_name}</h1>
            <p className="text-sm text-gray-500 capitalize">{customer.customer_type}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Deuda Actual</p>
            <p className={`text-3xl font-bold ${customer.debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${customer.debt?.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <RegisterPayment customerId={customer.id} currentDebt={customer.debt || 0} />

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Historial de Movimientos</h2>
        <ul className="divide-y divide-gray-200">
          {(payments || []).map(payment => (
            <li key={payment.id} className="py-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                {payment.type === 'compra' 
                  ? <FaReceipt className="text-2xl text-red-500" /> 
                  : <FaMoneyBillWave className="text-2xl text-green-500" />}
                <div>
                  <p className="font-medium capitalize">{payment.type}</p>
                  <p className="text-sm text-gray-500">{new Date(payment.created_at).toLocaleString()}</p>
                  <p className="text-xs text-gray-400 italic">{payment.comment}</p>
                </div>
              </div>
              <p className={`font-bold text-lg ${payment.type === 'compra' ? 'text-green-600' : 'text-red-600'}`}>
                {/* Corregido para que las compras sumen a la deuda y los pagos resten */}
                {payment.type === 'compra' ? '+' : '-'}${payment.amount?.toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}