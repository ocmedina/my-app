'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { User } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import { useRouter } from 'next/navigation'
import { FaTimes, FaPlus, FaMinus, FaSearch, FaUserCircle, FaSignOutAlt, FaClipboardList, FaEdit, FaShoppingCart, FaUser, FaTruck, FaCheck, FaCheckCircle, FaClock } from 'react-icons/fa'

// --- Tipos de Datos ---
type Customer = Database['public']['Tables']['customers']['Row']
type Product = Database['public']['Tables']['products']['Row']
type CartItem = Product & { quantity: number }
type Order = {
  id: string
  customer_id: string
  total_amount: number
  status: string
  created_at: string
  customers: {
    full_name: string
  }
}

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Agregar Producto</h2>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 border-b">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto por nombre..."
              className="w-full py-3 pl-12 pr-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {query.length < 2 ? (
            <p className="text-center text-gray-400 py-8">Escribe al menos 2 caracteres para buscar</p>
          ) : results.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No se encontraron productos</p>
          ) : (
            <ul className="space-y-2">
              {results.map(product => (
                <li
                  key={product.id}
                  onClick={() => { onProductAdd(product); onClose(); }}
                  className="p-4 border-2 border-gray-200 rounded-xl flex justify-between items-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:text-blue-600">{product.name}</p>
                    <p className="text-sm text-green-600 font-medium mt-1">${product.price_minorista}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      Stock: {product.stock}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Modal de Confirmación de Entrega ---
function DeliveryConfirmationModal({ 
  isOpen, 
  order, 
  onClose,
  onConfirm 
}: { 
  isOpen: boolean
  order: Order | null
  onClose: () => void
  onConfirm: (orderId: string) => void
}) {
  const [isDelivering, setIsDelivering] = useState(false);

  if (!isOpen || !order) return null;

  const handleConfirm = async () => {
    setIsDelivering(true);
    await onConfirm(order.id);
    setIsDelivering(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FaTruck className="text-2xl" />
              Confirmar Entrega
            </h2>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              disabled={isDelivering}
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6 border-2 border-gray-200">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 mb-2">Cliente</p>
              <p className="text-xl font-bold text-gray-800">{order.customers.full_name}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Total del Pedido</p>
              <p className="text-3xl font-bold text-green-600">${order.total_amount.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <FaCheckCircle className="text-blue-600 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">¿Confirmar entrega?</p>
              <p className="text-xs text-blue-700">
                El vendedor verá esta entrega actualizada en tiempo real en su sistema.
              </p>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={isDelivering}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDelivering ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                Marcando como entregado...
              </>
            ) : (
              <>
                <FaCheck className="text-xl" />
                Marcar como Entregado
              </>
            )}
          </button>

          <button
            onClick={onClose}
            disabled={isDelivering}
            className="w-full mt-3 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RepartoPage() {
  const [view, setView] = useState('new_order');
  const [dailyOrders, setDailyOrders] = useState<Order[]>([]);
  const router = useRouter();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<Order | null>(null);

  // Función para cargar el historial diario
  const fetchDailyHistory = useCallback(async (userId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at, customer_id, customers(full_name)')
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

  // Cargar datos iniciales y suscribirse a cambios en tiempo real
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

  // Suscripción en tiempo real para actualizar pedidos automáticamente
  useEffect(() => {
    if (!currentUser) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Suscribirse a cambios en la tabla orders
    const ordersSubscription = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders',
          filter: `profile_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('Cambio detectado en orders:', payload);
          // Recargar el historial cuando hay cambios
          fetchDailyHistory(currentUser.id);
        }
      )
      .subscribe();

    // Cleanup al desmontar
    return () => {
      ordersSubscription.unsubscribe();
    };
  }, [currentUser, fetchDailyHistory]);

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
        toast.success('Cantidad actualizada');
      } else {
        toast.error('No hay más stock disponible.');
      }
    } else {
      if ((productToAdd.stock || 0) > 0) {
        setCart([...cart, { ...productToAdd, quantity: 1 }]);
        toast.success('Producto agregado');
      } else {
        toast.error('Este producto no tiene stock.');
      }
    }
  }, [cart, selectedCustomer]);
  
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== productId));
      toast.success('Producto eliminado');
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
    
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    
    if (itemsError) {
      toast.error('Error al guardar los productos del pedido');
      setLoading(false);
      return;
    }
    
    toast.success('¡Pedido registrado exitosamente!');
    setCart([]);
    if (customers.length > 0) setSelectedCustomer(customers[0]);
    setLoading(false);
  };

  const handleOpenDeliveryModal = (order: Order) => {
    setSelectedOrderForDelivery(order);
    setIsDeliveryModalOpen(true);
  };

  const handleConfirmDelivery = async (orderId: string) => {
    // Actualizar el estado del pedido a 'entregado' en Supabase
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'entregado',
        delivered_at: new Date().toISOString() // Guardar fecha/hora de entrega
      })
      .eq('id', orderId);

    if (error) {
      toast.error('Error al marcar el pedido como entregado');
      console.error(error);
    } else {
      toast.success('✅ Pedido marcado como entregado. El vendedor lo verá actualizado.');
      // No es necesario actualizar manualmente el estado porque la suscripción en tiempo real lo hará
    }
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const pendingOrdersCount = dailyOrders.filter(o => o.status === 'pendiente').length;
  const deliveredOrdersCount = dailyOrders.filter(o => o.status === 'entregado').length;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen font-sans">
      <AddProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductAdd={handleAddProduct}
      />

      <DeliveryConfirmationModal
        isOpen={isDeliveryModalOpen}
        order={selectedOrderForDelivery}
        onClose={() => setIsDeliveryModalOpen(false)}
        onConfirm={handleConfirmDelivery}
      />
      
      {/* Header con Logo */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FaTruck className="text-blue-600 text-2xl" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FrontStock
              </h1>
              <p className="text-xs text-gray-500 font-medium">Modo Reparto</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <FaUserCircle className="text-white text-lg"/>
              </div>
              <span className="font-semibold text-sm text-gray-700 max-w-[120px] truncate">
                {currentUser?.email?.split('@')[0]}
              </span>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors"
            >
              <FaSignOutAlt /> 
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Tabs de Navegación */}
        <div className="flex border-t border-gray-200">
          <button 
            onClick={() => setView('new_order')}
            className={`flex-1 py-3 text-center font-semibold transition-all flex items-center justify-center gap-2 ${
              view === 'new_order' 
                ? 'bg-blue-50 border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <FaEdit className="text-lg"/>
            <span>Tomar Pedido</span>
          </button>
          <button 
            onClick={() => setView('history')}
            className={`flex-1 py-3 text-center font-semibold transition-all flex items-center justify-center gap-2 relative ${
              view === 'history' 
                ? 'bg-blue-50 border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <FaClipboardList className="text-lg"/>
            <span>Mis Entregas</span>
            {pendingOrdersCount > 0 && (
              <span className="absolute top-1 right-2 sm:right-1/4 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {pendingOrdersCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {view === 'new_order' && (
        <main className="p-4 space-y-4 pb-32">
          {/* Card de Cliente */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-white">
                <FaUser />
                Cliente Seleccionado
              </label>
            </div>
            <div className="p-5">
              <select 
                value={selectedCustomer?.id || ''} 
                onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg font-semibold bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-gray-800"
              >
                {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
              {selectedCustomer && (
                <div className="mt-4 flex items-center gap-2">
                  <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                    selectedCustomer.customer_type === 'mayorista' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {selectedCustomer.customer_type === 'mayorista' ? '🏢 Mayorista' : '👤 Minorista'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Card de Productos */}
          <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <FaShoppingCart className="text-blue-600" />
                Productos del Pedido
              </h2>
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
              >
                <FaPlus /> Añadir
              </button>
            </div>
            <div className="space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <FaShoppingCart className="text-5xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">El pedido está vacío</p>
                  <p className="text-sm text-gray-400 mt-1">Agrega productos para comenzar</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-sm text-green-600 font-medium mt-1">
                        ${selectedCustomer?.customer_type === 'mayorista' ? item.price_mayorista : item.price_minorista}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} 
                        className="w-8 h-8 flex items-center justify-center bg-white border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all font-bold"
                      >
                        <FaMinus size={12} />
                      </button>
                      <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} 
                        className="w-8 h-8 flex items-center justify-center bg-white border-2 border-green-200 text-green-600 rounded-lg hover:bg-green-50 transition-all font-bold"
                      >
                        <FaPlus size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      )}

      {view === 'history' && (
        <main className="p-4 space-y-4">
          {/* Estadísticas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 font-medium">Pendientes</p>
                  <p className="text-3xl font-bold mt-1">{pendingOrdersCount}</p>
                </div>
                <FaClock className="text-4xl opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 font-medium">Entregados</p>
                  <p className="text-3xl font-bold mt-1">{deliveredOrdersCount}</p>
                </div>
                <FaCheckCircle className="text-4xl opacity-80" />
              </div>
            </div>
          </div>

          {/* Lista de Pedidos */}
          <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
              <FaClipboardList className="text-blue-600" />
              Pedidos de Hoy ({dailyOrders.length})
            </h2>
            <ul className="space-y-3">
              {dailyOrders.length > 0 ? dailyOrders.map(order => (
                <li key={order.id} className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{order.customers.full_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className="font-bold text-xl text-green-600">${order.total_amount.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                      order.status === 'pendiente' 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : order.status === 'entregado'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status === 'pendiente' ? <FaClock /> : <FaCheckCircle />}
                      {order.status === 'pendiente' ? 'Pendiente' : 'Entregado'}
                    </span>
                    {order.status === 'pendiente' && (
                      <button
                        onClick={() => handleOpenDeliveryModal(order)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
                      >
                        <FaTruck />
                        Entregar
                      </button>
                    )}
                  </div>
                </li>
              )) : (
                <div className="text-center py-12">
                  <FaClipboardList className="text-5xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">Aún no has tomado pedidos hoy</p>
                </div>
              )}
            </ul>
          </div>
        </main>
      )}
      
      {view === 'new_order' && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-2xl">
          <div className="max-w-lg mx-auto">
            <div className="flex justify-between items-center font-bold text-2xl mb-4">
              <span className="text-gray-700">Total:</span>
              <span className="text-green-600">${total.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleFinalizeOrder} 
              disabled={loading || cart.length === 0 || !selectedCustomer}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 hover:from-green-700 hover:to-green-800"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <FaCheck className="text-xl" />
                  Guardar Pedido
                </>
              )}
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}