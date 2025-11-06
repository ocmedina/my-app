'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { User } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import { FaTimes, FaShoppingCart, FaPlus, FaBoxOpen } from 'react-icons/fa'

type Supplier = Database['public']['Tables']['suppliers']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type CartItem = {
  product: Product;
  quantity: number;
  cost_price: string;
};

// Modal para crear nuevo producto
function NewProductModal({ 
  isOpen, 
  onClose, 
  onProductCreated 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: Product) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    cost_price: '',
    sale_price: '',
    category: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre del producto es obligatorio');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creando producto...');

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: formData.name.trim(),
          sku: formData.sku.trim() || null,
          cost_price: parseFloat(formData.cost_price) || 0,
          sale_price: parseFloat(formData.sale_price) || 0,
          category: formData.category.trim() || null,
          stock: 0, // Comienza en 0, se sumará con la compra
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Producto creado exitosamente', { id: toastId });
      onProductCreated(data);
      handleClose();
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Error al crear el producto', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      sku: '',
      cost_price: '',
      sale_price: '',
      category: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FaBoxOpen className="text-blue-600" />
              Crear Nuevo Producto
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Aceite Motor 10W40"
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU / Código
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={e => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="Opcional"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Costo
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_price}
                  onChange={e => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                  placeholder="0.00"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Venta
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sale_price}
                  onChange={e => setFormData(prev => ({ ...prev, sale_price: e.target.value }))}
                  placeholder="0.00"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Ej: Lubricantes, Filtros, etc."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> El producto se creará con stock inicial en 0. 
                La cantidad que agregues en esta compra se sumará automáticamente.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Componente de Búsqueda de Producto
function ProductSearch({ 
  onProductSelect, 
  cartProductIds,
  onNewProductClick 
}: { 
  onProductSelect: (product: Product) => void;
  cartProductIds: string[];
  onNewProductClick: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      toast.error('Error cargando productos');
      console.error(error);
    }
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const availableProducts = products.filter(p => !cartProductIds.includes(p.id));

  return (
    <div className="flex gap-2">
      <select 
        onChange={e => {
          const product = products.find(p => p.id === e.target.value);
          if (product) {
            onProductSelect(product);
            e.target.value = ''; // Reset select
          }
        }} 
        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={loading}
      >
        <option value="">
          {loading ? 'Cargando productos...' : 'Seleccionar producto existente...'}
        </option>
        {availableProducts.map(p => (
          <option key={p.id} value={p.id}>
            {p.name} (Stock actual: {p.stock})
          </option>
        ))}
      </select>
      
      <button
        onClick={onNewProductClick}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
        title="Crear nuevo producto"
      >
        <FaPlus /> Nuevo
      </button>
    </div>
  );
}

export default function NewPurchasePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      const [suppliersResult, userResult] = await Promise.all([
        supabase.from('suppliers').select('*').eq('is_active', true).order('name'),
        supabase.auth.getUser()
      ]);

      if (suppliersResult.error) {
        toast.error('Error cargando proveedores');
        console.error(suppliersResult.error);
      } else {
        setSuppliers(suppliersResult.data || []);
      }

      if (userResult.data.user) {
        setCurrentUser(userResult.data.user);
      } else {
        toast.error('Usuario no autenticado');
        router.push('/login');
      }
    };

    fetchInitialData();
  }, [router]);

  const handleAddProduct = (product: Product) => {
    setCart(prev => [...prev, { 
      product, 
      quantity: 1, 
      cost_price: product.cost_price?.toString() || '' 
    }]);
    toast.success(`${product.name} agregado al carrito`);
  };

  const handleProductCreated = (product: Product) => {
    handleAddProduct(product);
    toast.success('Producto creado y agregado al carrito');
  };

  const handleCartChange = (productId: string, field: 'quantity' | 'cost_price', value: string) => {
    setCart(prev => 
      prev.map(item => 
        item.product.id === productId 
          ? { ...item, [field]: field === 'quantity' ? Math.max(1, parseInt(value) || 1) : value }
          : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    toast.success('Producto eliminado del carrito');
  };
  
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const price = parseFloat(item.cost_price) || 0;
      return sum + (quantity * price);
    }, 0);
  }, [cart]);

  const validateForm = (): boolean => {
    if (!selectedSupplier) {
      toast.error('Debes seleccionar un proveedor');
      return false;
    }

    if (cart.length === 0) {
      toast.error('Debes agregar al menos un producto');
      return false;
    }

    if (!currentUser?.id) {
      toast.error('Usuario no autenticado');
      return false;
    }

    // Validar que todos los productos tengan precio de costo
    const invalidItems = cart.filter(item => !item.cost_price || parseFloat(item.cost_price) <= 0);
    if (invalidItems.length > 0) {
      toast.error(`Debes completar el costo unitario de: ${invalidItems.map(i => i.product.name).join(', ')}`);
      return false;
    }

    return true;
  };

  const handleFinalizePurchase = async () => {
    if (!validateForm()) return;

    setLoading(true);
    let toastId = toast.loading('Registrando compra...');

    try {
      const paid = parseFloat(amountPaid) || 0;
      const debtGenerated = totalAmount - paid;

      // 1. Crear el registro de la compra
      toast.loading('Guardando factura...', { id: toastId });
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          supplier_id: selectedSupplier,
          profile_id: currentUser!.id,
          invoice_number: invoiceNumber || null,
          total_amount: totalAmount,
          amount_paid: paid
        })
        .select()
        .single();

      if (purchaseError) throw new Error(`Error al guardar compra: ${purchaseError.message}`);

      // 2. Insertar los items de la compra
      toast.loading('Guardando productos...', { id: toastId });
      const purchaseItems = cart.map(item => ({
        purchase_id: purchase.id,
        product_id: item.product.id,
        quantity: item.quantity,
        cost_price: parseFloat(item.cost_price)
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItems);

      if (itemsError) throw new Error(`Error al guardar items: ${itemsError.message}`);

      // 3. Actualizar stock de todos los productos
      toast.loading('Actualizando inventario...', { id: toastId });
      const stockUpdatePromises = cart.map(item => 
        supabase.rpc('increment_stock', {
          product_id_in: item.product.id, 
          quantity_in: item.quantity 
        })
      );

      const stockResults = await Promise.allSettled(stockUpdatePromises);
      
      // Verificar si hubo errores en las actualizaciones de stock
      const failedStockUpdates = stockResults
        .map((result, index) => ({ result, item: cart[index] }))
        .filter(({ result }) => result.status === 'rejected');

      if (failedStockUpdates.length > 0) {
        console.error('Stock update errors:', failedStockUpdates);
        toast.error('Algunos productos no actualizaron su stock correctamente', { id: toastId });
        // Continuar de todos modos, pero notificar
      }

      // 4. Actualizar deuda del proveedor (si corresponde)
      if (debtGenerated !== 0) {
        toast.loading('Actualizando cuenta del proveedor...', { id: toastId });
        const { error: debtError } = await supabase.rpc('increment_supplier_debt', {
          supplier_id_in: selectedSupplier,
          amount_in: debtGenerated
        });

        if (debtError) {
          console.error('Debt update error:', debtError);
          toast.error('Error al actualizar deuda del proveedor', { id: toastId });
        }
      }
      
      toast.success('¡Compra registrada exitosamente!', { id: toastId });
      
      // Pequeño delay para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        router.push('/dashboard/proveedores');
        router.refresh();
      }, 500);

    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al registrar la compra', { id: toastId });
      setLoading(false);
    }
  };

  const cartProductIds = cart.map(item => item.product.id);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Registrar Factura de Compra</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor <span className="text-red-500">*</span>
                </label>
                <select 
                  value={selectedSupplier} 
                  onChange={e => setSelectedSupplier(e.target.value)} 
                  required 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.debt > 0 && `(Deuda: $${s.debt.toFixed(2)})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nº de Factura/Remito
                </label>
                <input 
                  type="text" 
                  value={invoiceNumber} 
                  onChange={e => setInvoiceNumber(e.target.value)} 
                  placeholder="Opcional"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agregar Producto al Carrito
              </label>
              <ProductSearch 
                onProductSelect={handleAddProduct} 
                cartProductIds={cartProductIds}
                onNewProductClick={() => setShowNewProductModal(true)}
              />
            </div>

            <div className="border-t pt-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FaShoppingCart className="mx-auto text-4xl mb-2" />
                  <p>No hay productos en el carrito</p>
                  <p className="text-sm">Selecciona productos existentes o crea uno nuevo</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left text-sm font-medium text-gray-700 p-3">Producto</th>
                        <th className="text-left text-sm font-medium text-gray-700 p-3">Cantidad</th>
                        <th className="text-left text-sm font-medium text-gray-700 p-3">
                          Costo Unit. <span className="text-red-500">*</span>
                        </th>
                        <th className="text-left text-sm font-medium text-gray-700 p-3">Subtotal</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {cart.map(item => {
                        const subtotal = item.quantity * (parseFloat(item.cost_price) || 0);
                        return (
                          <tr key={item.product.id} className="hover:bg-gray-50">
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{item.product.name}</p>
                                <p className="text-xs text-gray-500">Stock actual: {item.product.stock}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <input 
                                type="number" 
                                min="1"
                                value={item.quantity} 
                                onChange={e => handleCartChange(item.product.id, 'quantity', e.target.value)} 
                                className="w-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                value={item.cost_price} 
                                onChange={e => handleCartChange(item.product.id, 'cost_price', e.target.value)} 
                                placeholder="0.00"
                                required 
                                className="w-28 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </td>
                            <td className="p-3 font-medium">
                              ${subtotal.toFixed(2)}
                            </td>
                            <td className="p-3">
                              <button 
                                onClick={() => handleRemoveFromCart(item.product.id)} 
                                className="text-red-500 hover:text-red-700 transition-colors p-1"
                                title="Eliminar producto"
                              >
                                <FaTimes />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md space-y-4 h-fit sticky top-6">
            <h2 className="text-xl font-bold text-gray-800">Resumen de Compra</h2>
            
            <div className="space-y-2 py-4 border-y">
              <div className="flex justify-between text-gray-600">
                <span>Productos:</span>
                <span>{cart.length}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Unidades totales:</span>
                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
            </div>

            <div className="flex justify-between font-bold text-2xl text-gray-800">
              <span>Total Factura:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto Pagado (opcional)
              </label>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                max={totalAmount}
                value={amountPaid} 
                onChange={e => setAmountPaid(e.target.value)} 
                placeholder="0.00"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            
            <div className={`flex justify-between font-bold text-lg ${totalAmount - (parseFloat(amountPaid) || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              <span>Deuda Generada:</span>
              <span>${(totalAmount - (parseFloat(amountPaid) || 0)).toFixed(2)}</span>
            </div>
            
            <button 
              onClick={handleFinalizePurchase} 
              disabled={loading || cart.length === 0}
              className="w-full py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Procesando...' : 'Finalizar Compra y Agregar Stock'}
            </button>

            {cart.length === 0 && (
              <p className="text-xs text-center text-gray-500">
                Agrega productos para continuar
              </p>
            )}
          </div>
        </div>
      </div>

      <NewProductModal
        isOpen={showNewProductModal}
        onClose={() => setShowNewProductModal(false)}
        onProductCreated={handleProductCreated}
      />
    </>
  );
}