// src/app/dashboard/ventas/nueva/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/lib/database.types'
import { User } from '@supabase/supabase-js'
import { FaTimes } from 'react-icons/fa'
import toast from 'react-hot-toast'

type Customer = Database['public']['Tables']['customers']['Row']
type Product = Database['public']['Tables']['products']['Row']
type CartItem = Product & { quantity: number }

// --- COMPONENTE INTERNO: BUSCADOR DE PRODUCTOS ---
function ProductSearch({ onProductSelect }: { onProductSelect: (product: Product) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').ilike('name', `%${query}%`).eq('is_active', true).limit(5);
      setResults(data || []);
    };
    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (product: Product) => {
    onProductSelect(product);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative">
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o SKU..." className="w-full p-2 border border-gray-300 rounded-md" />
      {results.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map(product => (
            <li key={product.id} onClick={() => handleSelect(product)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
              {product.name} (Stock: {product.stock})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function NewSalePage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [amountPaid, setAmountPaid] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadInitialData() {
      const { data: customersData } = await supabase.from('customers').select('*').eq('is_active', true);
      if (customersData) {
        setCustomers(customersData);
        let defaultCustomer = customersData.find(c => c.full_name === 'Consumidor Final');
        if (!defaultCustomer && customersData.length > 0) {
          defaultCustomer = customersData[0];
        }
        setSelectedCustomer(defaultCustomer || null);
      }
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
    }
    loadInitialData();
  }, []);
  
  useEffect(() => {
    if (!selectedCustomer) { setTotal(0); return }
    const newTotal = cart.reduce((acc, item) => {
      const price = selectedCustomer.customer_type === 'mayorista' ? item.price_mayorista : item.price_minorista;
      return acc + (price || 0) * item.quantity;
    }, 0);
    setTotal(newTotal);
    if (paymentMethod !== 'cuenta_corriente') {
      setAmountPaid(newTotal.toFixed(2));
    } else {
      setAmountPaid('0');
    }
  }, [cart, selectedCustomer, paymentMethod]);

  const handleAddProduct = useCallback((productToAdd: Product) => {
    if (!selectedCustomer) { toast.error('Por favor, selecciona un cliente.'); return }
    const existingItem = cart.find(item => item.id === productToAdd.id);
    if (existingItem) {
      if (existingItem.quantity < (productToAdd.stock || 0)) {
        setCart(cart.map(item => item.id === productToAdd.id ? { ...item, quantity: item.quantity + 1 } : item));
      } else {
        toast.error('No hay más stock disponible para este producto.');
      }
    } else {
      if ((productToAdd.stock || 0) > 0) {
        setCart([...cart, { ...productToAdd, quantity: 1 }]);
      } else {
        toast.error('Este producto no tiene stock.');
      }
    }
  }, [cart, selectedCustomer]);

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleFinalizeSale = async () => {
    if (!selectedCustomer || cart.length === 0 || !currentUser?.id) {
      toast.error('Faltan datos para completar la venta.'); return;
    }
    setLoading(true);

    const paid = parseFloat(amountPaid) || 0;
    const debtGenerated = total - paid;

    // 1. Registrar la venta
    const { data: saleData, error: saleError } = await supabase.from('sales').insert({
      customer_id: selectedCustomer.id,
      profile_id: currentUser.id,
      total_amount: total,
      payment_method: paymentMethod,
    }).select().single();
      
    if (saleError) { 
      toast.error(`Error al registrar la venta: ${saleError.message}`); 
      setLoading(false); 
      return; 
    }

    // 2. Registrar los items de la venta
    const saleItems = cart.map(item => ({
      sale_id: saleData.id,
      product_id: item.id,
      quantity: item.quantity,
      price: selectedCustomer.customer_type === 'mayorista' ? item.price_mayorista : item.price_minorista,
    }));
    await supabase.from('sale_items').insert(saleItems);

    // 3. Actualizar stock de productos
    for (const item of cart) {
      const newStock = (item.stock || 0) - item.quantity;
      await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
    }

    // 4. Actualizar deuda del cliente
    const { data: customerData } = await supabase.from('customers').select('debt').eq('id', selectedCustomer.id).single();
    const currentDebt = (customerData?.debt as number) || 0;
    const newDebt = currentDebt + debtGenerated;
    await supabase.from('customers').update({ debt: newDebt }).eq('id', selectedCustomer.id);
    
    // 5. LÓGICA CORREGIDA: Registrar movimientos en payments
    // Si hay deuda generada (compra a crédito/fiado), registramos la compra
    if (debtGenerated > 0) {
      await supabase.from('payments').insert({
        customer_id: selectedCustomer.id, 
        sale_id: saleData.id, 
        type: 'compra', 
        amount: debtGenerated, // ⚠️ SOLO la parte que quedó fiada
        comment: `Venta ${paymentMethod === 'cuenta_corriente' ? 'a crédito' : 'parcial'}`
      });
    }
    
    // Si hubo pago (total o parcial), registramos el pago
    if (paid > 0) {
      await supabase.from('payments').insert({
        customer_id: selectedCustomer.id, 
        sale_id: saleData.id, 
        type: 'pago', 
        amount: paid,
        comment: `Pago con ${paymentMethod}`
      });
    }

    toast.success('¡Venta registrada exitosamente!');
    
    // Resetear formulario
    setCart([]);
    setAmountPaid('');
    setPaymentMethod('efectivo');
    const consumerFinal = customers.find(c => c.full_name === 'Consumidor Final');
    if (consumerFinal) setSelectedCustomer(consumerFinal);
    setLoading(false);
  };

  const debtDifference = total - (parseFloat(amountPaid) || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md space-y-6">
        <h1 className="text-2xl font-bold">Nueva Venta</h1>
        <div>
          <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">1. Cliente</label>
          <select id="customer" value={selectedCustomer?.id || ''} onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)} className="w-full p-2 border border-gray-300 rounded-md">
            {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">2. Agregar Producto</label>
          <ProductSearch onProductSelect={handleAddProduct} />
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Carrito y Pago</h2>
        <div className="space-y-3 min-h-[200px] max-h-64 overflow-y-auto pr-2">
          {cart.length === 0 ? <p className="text-gray-400 text-center pt-8">El carrito está vacío.</p> : cart.map(item => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-gray-500">Cant: {item.quantity}</p>
              </div>
              <div className="flex items-center gap-2">
                <span>${((selectedCustomer?.customer_type === 'mayorista' ? item.price_mayorista : item.price_minorista) || 0) * item.quantity}</span>
                <button onClick={() => handleRemoveFromCart(item.id)} className="text-red-500 hover:text-red-700"><FaTimes /></button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-4 mt-4 space-y-4">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Método de Pago</label>
            <select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta_debito">Tarjeta de Débito</option>
              <option value="tarjeta_credito">Tarjeta de Crédito</option>
              <option value="transferencia">Transferencia</option>
              <option value="mercado_pago">Mercado Pago</option>
              <option value="cuenta_corriente">Cuenta Corriente (Fiado)</option>
            </select>
          </div>

          <div>
            <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700">Monto Pagado</label>
            <input type="number" id="amountPaid" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="0.00"/>
          </div>

          {debtDifference > 0 && (
            <div className="flex justify-between font-medium text-red-600">
              <span>Saldo Pendiente (Deuda)</span>
              <span>${debtDifference.toFixed(2)}</span>
            </div>
          )}

          <button onClick={handleFinalizeSale} disabled={cart.length === 0 || !selectedCustomer || loading} className="w-full mt-4 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400">
            {loading ? 'Procesando...' : 'Finalizar Venta'}
          </button>
        </div>
      </div>
    </div>
  )
}