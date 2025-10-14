// src/components/RegisterPayment.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface RegisterPaymentProps {
  customerId: string;
  currentDebt: number;
}

export default function RegisterPayment({ customerId, currentDebt }: RegisterPaymentProps) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const paymentAmount = parseFloat(amount)

    if (!paymentAmount || paymentAmount <= 0) {
      alert('Por favor, ingresa un monto válido.')
      return
    }

    setLoading(true)

    // 1. Calcular la nueva deuda
    const newDebt = currentDebt - paymentAmount

    // 2. Actualizar la deuda del cliente en la tabla 'customers'
    const { error: updateError } = await supabase
      .from('customers')
      .update({ debt: newDebt })
      .eq('id', customerId)

    if (updateError) {
      alert(`Error al actualizar la deuda: ${updateError.message}`)
      setLoading(false)
      return
    }

    // 3. Registrar el movimiento en la tabla 'payments'
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        customer_id: customerId,
        type: 'pago',
        amount: paymentAmount,
        comment: comment || 'Pago a cuenta',
      })
      
    if (paymentError) {
      alert(`Error al registrar el pago: ${paymentError.message}`)
    } else {
      alert('¡Pago registrado exitosamente!')
      setAmount('')
      setComment('')
      router.refresh() // Recarga la página para mostrar los datos actualizados
    }
    
    setLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">Registrar un Pago</h2>
      <form onSubmit={handleRegisterPayment} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Monto a Pagar</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            placeholder="0.00"
            required
          />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Comentario (Opcional)</label>
          <input
            type="text"
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            placeholder="Ej: Entrega semanal"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Registrando...' : 'Registrar Pago'}
        </button>
      </form>
    </div>
  )
}