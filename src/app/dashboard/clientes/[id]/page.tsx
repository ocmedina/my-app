import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Database } from '@/lib/database.types'; // Importa tu tipo de Database
import { FaMoneyBillWave, FaReceipt, FaArrowLeft } from 'react-icons/fa';
import RegisterPayment from '@/components/RegisterPayment';

// Desactivar cache de Next.js
export const dynamic = 'force-dynamic';

// --- CORRECCIÓN DE TIPOS ---
// Usamos los tipos generados de Supabase en lugar de manuales
type CustomerRow = Database['public']['Tables']['customers']['Row'];
type PaymentRow = Database['public']['Tables']['payments']['Row'];

// Esta es la forma estándar de definir props en una página dinámica de Next.js
interface CustomerDetailPageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) { // <-- Se usa el tipo corregido
  const supabase = createServerComponentClient<Database>({ cookies });

  // Obtenemos los datos del cliente
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.id)
    .single();

  // Obtenemos los pagos
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .eq('customer_id', params.id)
    .order('created_at', { ascending: false });

  if (customerError || !customer) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600">Cliente no encontrado</h1>
        <Link href="/dashboard/clientes" className="text-blue-600 mt-4 inline-flex items-center gap-2 hover:underline">
          <FaArrowLeft /> Volver al listado
        </Link>
      </div>
    );
  }

  const currentDebt = customer.debt ?? 0;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <Link href="/dashboard/clientes" className="text-blue-600 mb-4 inline-flex items-center gap-2 hover:underline text-sm">
          <FaArrowLeft /> Volver a clientes
        </Link>
        
        <div className="flex justify-between items-start mt-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{customer.full_name}</h1>
            <p className="text-sm text-gray-500 capitalize mt-1">
              Tipo: {customer.customer_type}
            </p>
            {customer.email && (
              <p className="text-sm text-gray-500 mt-1">📧 {customer.email}</p>
            )}
            {customer.phone && (
              <p className="text-sm text-gray-500">📱 {customer.phone}</p>
            )}
          </div>
          <div className="text-right bg-gray-50 px-6 py-4 rounded-lg border-2 border-gray-200">
            <p className="text-sm text-gray-500 font-medium uppercase">Deuda Actual</p>
            <p className={`text-4xl font-bold mt-2 ${currentDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${currentDebt.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {currentDebt > 0 ? 'Pendiente de pago' : 'Sin deuda'}
            </p>
          </div>
        </div>
      </div>

      {/* Solo mostramos el formulario de pago si el cliente debe dinero */}
      {currentDebt > 0 && (
        <RegisterPayment customerId={customer.id} currentDebt={currentDebt} />
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Historial de Movimientos</h2>
        {(!payments || payments.length === 0) ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No hay movimientos registrados</p>
            <p className="text-gray-300 text-sm mt-2">Los pagos y compras aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map(payment => {
              const isCompra = payment.type === 'compra';
              return (
                <div 
                  key={payment.id} 
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${isCompra ? 'bg-red-100' : 'bg-green-100'}`}>
                      {isCompra 
                        ? <FaReceipt className="text-xl text-red-600" /> 
                        : <FaMoneyBillWave className="text-xl text-green-600" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {isCompra ? '🛒 Compra a Crédito' : '💰 Pago Recibido'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(payment.created_at).toLocaleString('es-AR', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                      {payment.comment && (
                        <p className="text-xs text-gray-400 italic mt-1">
                          "{payment.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-xl ${isCompra ? 'text-red-600' : 'text-green-600'}`}>
                      {isCompra ? '+' : '-'}${payment.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isCompra ? 'Debe más' : 'Abonó'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}