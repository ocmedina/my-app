// src/components/CashMovementModal.tsx (o puedes dejar LogExpenseModal.tsx y solo pegar el código)
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { FaTimes } from 'react-icons/fa'

interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMovementLogged: () => void;
  type: 'gasto' | 'fondo_inicial'; // Aceptamos un tipo para saber qué registrar
}

export default function CashMovementModal({ isOpen, onClose, onMovementLogged, type }: CashMovementModalProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const isExpense = type === 'gasto';
  const title = isExpense ? 'Registrar Gasto de Caja' : 'Registrar Fondo Inicial';
  const amountLabel = isExpense ? 'Monto del Gasto' : 'Monto Inicial';
  const descriptionLabel = isExpense ? 'Descripción del Gasto' : 'Descripción (Opcional)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const movementAmount = parseFloat(amount);
    if (!movementAmount || movementAmount <= 0) {
      toast.error('Por favor, ingresa un monto válido.'); return;
    }
    if (isExpense && !description) {
      toast.error('La descripción es obligatoria para los gastos.'); return;
    }
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    const amountToInsert = isExpense ? -movementAmount : movementAmount; // Gastos son negativos, fondos iniciales positivos

    const { error } = await supabase
      .from('cash_movements')
      .insert({
        profile_id: user?.id,
        type: type,
        amount: amountToInsert,
        description: description || `Fondo inicial del día`,
      });

    if (error) {
      toast.error(`Error al registrar el movimiento: ${error.message}`);
    } else {
      toast.success(`'${isExpense ? 'Gasto' : 'Fondo inicial'}' registrado exitosamente.`);
      onMovementLogged();
      onClose();
      setAmount('');
      setDescription('');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    // ... (El JSX del modal es casi idéntico, solo cambian los textos)
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><FaTimes /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{amountLabel}</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required className="mt-1 w-full p-2 border rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{descriptionLabel}</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} required={isExpense} className="mt-1 w-full p-2 border rounded-md"/>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md">
              {loading ? 'Guardando...' : 'Guardar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}