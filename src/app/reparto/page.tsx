'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { User } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import { useRouter } from 'next/navigation'
import { FaTimes, FaPlus, FaMinus, FaSearch, FaUserCircle, FaSignOutAlt, FaClipboardList, FaEdit } from 'react-icons/fa'

// --- Tipos de Datos ---
type Customer = Database['public']['Tables']['customers']['Row']
type Product = Database['public']['Tables']['products']['Row']
type CartItem = Product & { quantity: number }

// --- Componente Modal para Agregar Productos ---
function AddProductModal({ isOpen, onClose, onProductAdd }: { isOpen: boolean, onClose: () => void, onProductAdd: (product: Product) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (!isOpen) { 
      setQuery(''); 
      setResults([]); 
      return; 
    }
    if (query.length < 2) { 
      setResults([]); 
      return; 
    }
    
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').ilike('name', `%${query}%`).eq('is_active', true).limit(10);
      setResults(data || []);
    };
    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Agregar Producto</h2>
        <button onClick={onClose}><FaTimes size={20} /></button>
      </div>
      <div className="relative mb-4">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full p-2 pl-10 border border-gray-300 rounded-md"
        />
      </div>
      <ul className="flex-1 overflow-y-auto">
        {results.map(product => (
          <li
            key={product.id}
            onClick={() => { onProductAdd(product); onClose(); }}
            className="p-3 border-b flex justify-between items-center cursor-pointer hover:bg-gray-50"
          >
            <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-500">${product.price_minorista}</p>
            </div>
            <span className="text-sm text-gray-400">Stock: {product.stock}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}


export default function RepartoPage() {
  const [view, setView] = useState('new_order'); // 'new_order' o 'history'
  const [dailyOrders, setDailyOrders] = useState<any[]>([]);
  const router = useRouter();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDailyHistory = useCallback(async (userId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('orders')
      .select('id, total_amount, status, customers(full_name)')
      .eq('profile_id', userId)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('created_at', { ascending: false });
      
    if (error) {
      toast.error("No se pudo cargar el historial.");
    } else {
      setDailyOrders(data || []);
    }
  }, []);

  useEffect(() => {
    async function loadInitialData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        fetchDailyHistory(session.user.id);
      }
      
      const { data: customersData } = await supabase.from('customers').select('*').eq('is_active', true).order('full_name');
      if (customersData) {
        setCustomers(customersData);
        if (customersData.length > 0) setSelectedCustomer(customersData[0]);
      }
    }
    loadInitialData();
  }, [fetchDailyHistory]);

  const total = useMemo(() => {
    if (!selectedCustomer) return 0;
    return cart.reduce((acc, item) => {
      const price = selectedCustomer.customer_type === 'mayorista' ? item.price_mayorista : item.price_minorista;
      return acc + (price || 0) * item.quantity;
    }, 0);
  }, [cart, selectedCustomer]);

  const handleAddProduct = useCallback((productToAdd: Product) => {
    if (!selectedCustomer) { toast.error('Por favor, selecciona un cliente.'); return; }
    const existingItem = cart.find(item => item.id === productToAdd.id);
    if (existingItem) {
      if (existingItem.quantity < (productToAdd.stock || 0)) {
        setCart(cart.map(item => item.id === productToAdd.id ? { ...item, quantity: item.quantity + 1 } : item));
      } else {
        toast.error('No hay más stock disponible.');
      }
    } else {
      if ((productToAdd.stock || 0) > 0) {
        setCart([...cart, { ...productToAdd, quantity: 1 }]);
      } else {
        toast.error('Este producto no tiene stock.');
      }
    }
  }, [cart, selectedCustomer]);
  
    const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      const product = cart.find(item => item.id === productId);
      if (product && newQuantity > (product.stock || 0)) {
        toast.error('No hay más stock disponible.');
        return;
      }
      setCart(cart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
    }
  };

  const handleFinalizeOrder = async () => {
    if (!selectedCustomer || cart.length === 0 || !currentUser?.id) {
      toast.error('Faltan datos para completar el pedido.'); return;
    }
    setLoading(true);

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: selectedCustomer.id,
        profile_id: currentUser.id,
        total_amount: total,
        status: 'pendiente',
      }).select().single();

    if (orderError) {
      toast.error(`Error al registrar el pedido: ${orderError.message}`); 
      setLoading(false);
      return;
    }

    const orderItems = cart.map(item => ({
      order_id: orderData.id,
      product_id: item.id,
      quantity: item.quantity,
      price: selectedCustomer.customer_type === 'mayorista' ? item.price_mayorista : item.price_minorista,
    }));
    await supabase.from('order_items').insert(orderItems);
    
    toast.success('¡Pedido registrado exitosamente!');
    if (currentUser) {
      fetchDailyHistory(currentUser.id);
    }
    setCart([]);
    if (customers.length > 0) setSelectedCustomer(customers[0]);
    setLoading(false);
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <AddProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductAdd={handleAddProduct}
      />
      
      <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
            <FaUserCircle className="text-gray-400" size={24}/>
            <span className="font-semibold text-sm">{currentUser?.email}</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium">
            <FaSignOutAlt /> Salir
        </button>
      </header>

      <div className="p-2 bg-white flex justify-around">
        <button 
          onClick={() => setView('new_order')}
          className={`w-full py-2 text-center font-semibold ${view === 'new_order' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          <FaEdit className="inline mr-2"/>Tomar Pedido
        </button>
        <button 
          onClick={() => setView('history')}
          className={`w-full py-2 text-center font-semibold ${view === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          <FaClipboardList className="inline mr-2"/>Historial del Día
        </button>
      </div>

      {view === 'new_order' && (
        <main className="p-4 space-y-4 pb-28">
          <div className="bg-white p-4 rounded-xl shadow">
            <label className="block text-xs font-medium text-gray-500 mb-1">Cliente</label>
            <select 
              value={selectedCustomer?.id || ''} 
              onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)}
              className="w-full p-2 border border-gray-200 rounded-lg text-lg font-semibold bg-gray-50"
            >
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-gray-800">Productos</h2>
              <button onClick={() => setIsModalOpen(true)} className="text-sm font-medium text-blue-600">+ Añadir Producto</button>
            </div>
            <div className="space-y-3">
              {cart.length === 0 ? <p className="text-gray-400 text-center py-4">El pedido está vacío.</p> : cart.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      ${selectedCustomer?.customer_type === 'mayorista' ? item.price_mayorista : item.price_minorista}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded-full">-</button>
                    <span className="font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded-full">+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {view === 'history' && (
        <main className="p-4">
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-bold text-gray-800 mb-4">Pedidos de Hoy ({dailyOrders.length})</h2>
            <ul className="divide-y divide-gray-200">
              {dailyOrders.length > 0 ? dailyOrders.map(order => (
                <li key={order.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">{order.customers.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{order.status}</p>
                  </div>
                  <p className="font-bold text-gray-700">${order.total_amount.toFixed(2)}</p>
                </li>
              )) : <p className="text-center text-gray-500 py-4">Aún no has tomado pedidos hoy.</p>}
            </ul>
          </div>
        </main>
      )}
      
      {view === 'new_order' && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-top">
          <div className="flex justify-between items-center font-bold text-xl mb-3">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button 
            onClick={handleFinalizeOrder} 
            disabled={loading || cart.length === 0 || !selectedCustomer}
            className="w-full py-4 bg-green-600 text-white font-bold rounded-lg disabled:bg-gray-400 text-lg"
          >
            {loading ? 'Guardando...' : 'Guardar Pedido'}
          </button>
        </footer>
      )}
    </div>
  )
}