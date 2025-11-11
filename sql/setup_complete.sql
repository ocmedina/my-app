-- ============================================
-- SQL SETUP COMPLETO PARA FRONTSTOCK
-- ============================================
-- Este archivo contiene todos los comandos SQL necesarios
-- para que funcionen las nuevas funcionalidades implementadas

-- ============================================
-- 1. TABLA ORDERS (Pedidos/Reparto)
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendiente',
  payment_method TEXT DEFAULT 'Efectivo',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ============================================
-- 2. TABLA ORDER_ITEMS (Items de Pedidos)
-- ============================================

CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ============================================
-- 3. POLÍTICAS RLS PARA ORDERS
-- ============================================

-- Habilitar RLS en la tabla orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuarios autenticados pueden ver todos los pedidos
CREATE POLICY "Users can view all orders"
ON orders FOR SELECT
TO authenticated
USING (true);

-- Política para INSERT: usuarios autenticados pueden crear pedidos
CREATE POLICY "Users can insert orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para UPDATE: usuarios autenticados pueden actualizar pedidos
CREATE POLICY "Users can update orders"
ON orders FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para DELETE: usuarios autenticados pueden eliminar pedidos
CREATE POLICY "Users can delete orders"
ON orders FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 4. POLÍTICAS RLS PARA ORDER_ITEMS
-- ============================================

-- Habilitar RLS en la tabla order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuarios autenticados pueden ver todos los items
CREATE POLICY "Users can view all order_items"
ON order_items FOR SELECT
TO authenticated
USING (true);

-- Política para INSERT: usuarios autenticados pueden crear items
CREATE POLICY "Users can insert order_items"
ON order_items FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para UPDATE: usuarios autenticados pueden actualizar items
CREATE POLICY "Users can update order_items"
ON order_items FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para DELETE: usuarios autenticados pueden eliminar items
CREATE POLICY "Users can delete order_items"
ON order_items FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 5. FUNCIÓN PARA ACTUALIZAR updated_at
-- ============================================

-- Crear función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. VERIFICAR TABLAS EXISTENTES
-- ============================================

-- Si ya tienes las tablas customers, products, sales, sale_items
-- asegúrate de que tengan las columnas necesarias:

-- Verificar que customers tenga customer_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'customer_type'
  ) THEN
    ALTER TABLE customers ADD COLUMN customer_type TEXT DEFAULT 'minorista';
  END IF;
END $$;

-- Verificar que sales tenga payment_method
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE sales ADD COLUMN payment_method TEXT DEFAULT 'Efectivo';
  END IF;
END $$;

-- ============================================
-- 7. DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- Puedes descomentar esto si quieres datos de prueba

/*
-- Insertar un pedido de ejemplo
INSERT INTO orders (customer_id, total_amount, status, payment_method, notes)
VALUES (
  (SELECT id FROM customers LIMIT 1), -- Toma el primer customer
  1500.00,
  'pendiente',
  'Efectivo',
  'Pedido de prueba'
);

-- Insertar items del pedido
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT 
  (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1),
  id,
  2,
  price_minorista,
  price_minorista * 2
FROM products
LIMIT 3;
*/

-- ============================================
-- 8. GRANTS (Permisos)
-- ============================================

-- Dar permisos a usuarios autenticados
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;

-- Dar permisos para secuencias (si existen)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Para verificar que todo se creó correctamente:
SELECT 'Orders table' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'Order items table', COUNT(*) FROM order_items;
