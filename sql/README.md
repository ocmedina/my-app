# 📋 COMANDOS SQL PARA FRONTSTOCK

## 🎯 Resumen

Este documento contiene todos los comandos SQL necesarios para que funcionen las nuevas funcionalidades implementadas en el dashboard de FrontStock.

---

## ✅ Funcionalidades que Requieren SQL

### 1. **Sistema de Pedidos/Reparto**

- Tabla `orders` para gestionar pedidos
- Tabla `order_items` para items de pedidos
- Usado en: Dashboard principal (balance Local vs Reparto), página de gráficos

### 2. **Análisis de Ventas (Gráficos)**

- Consultas que combinan ventas locales (`sales`) y pedidos (`orders`)
- Filtrado por estado "entregado" para incluir solo pedidos completados
- Top productos considerando ambos canales de venta

---

## 🚀 Cómo Ejecutar los Comandos

### **Opción 1: Supabase Dashboard (Recomendado)**

1. Ve a tu proyecto en [Supabase](https://app.supabase.com)
2. Navega a **SQL Editor** en el menú lateral
3. Haz clic en **"New Query"**
4. Copia y pega el contenido del archivo `sql/setup_complete.sql`
5. Haz clic en **"Run"** o presiona `Ctrl + Enter`

### **Opción 2: CLI de Supabase**

```bash
# Si tienes Supabase CLI instalado
npx supabase db push --db-url "tu_connection_string"
```

### **Opción 3: Ejecutar por Secciones**

Si prefieres ejecutar por partes, sigue este orden:

#### 1️⃣ Crear tabla ORDERS

```sql
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendiente',
  payment_method TEXT DEFAULT 'Efectivo',
  notes TEXT,
  delivery_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
```

#### 2️⃣ Crear tabla ORDER_ITEMS

```sql
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
```

#### 3️⃣ Configurar RLS (Row Level Security)

```sql
-- ORDERS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert orders" ON orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update orders" ON orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can delete orders" ON orders FOR DELETE TO authenticated USING (true);

-- ORDER_ITEMS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all order_items" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert order_items" ON order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update order_items" ON order_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can delete order_items" ON order_items FOR DELETE TO authenticated USING (true);
```

#### 4️⃣ Función para updated_at automático

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 5️⃣ Verificar columnas existentes

```sql
-- Verificar customer_type en customers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'customer_type'
  ) THEN
    ALTER TABLE customers ADD COLUMN customer_type TEXT DEFAULT 'minorista';
  END IF;
END $$;

-- Verificar payment_method en sales
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE sales ADD COLUMN payment_method TEXT DEFAULT 'Efectivo';
  END IF;
END $$;
```

#### 6️⃣ Permisos

```sql
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

---

## 🔍 Verificación

Después de ejecutar los comandos, verifica que todo esté correcto:

```sql
-- Ver estructura de las tablas
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('orders', 'order_items')
ORDER BY table_name, ordinal_position;

-- Verificar políticas RLS
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('orders', 'order_items');

-- Contar registros (deben estar en 0 si es nueva instalación)
SELECT 'Orders' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'Order Items', COUNT(*) FROM order_items;
```

---

## ⚠️ Notas Importantes

1. **Backup**: Antes de ejecutar, haz un backup de tu base de datos si ya tienes datos importantes
2. **Orden**: Es importante ejecutar los comandos en el orden indicado
3. **Permisos**: Asegúrate de estar ejecutando con permisos de administrador
4. **IF NOT EXISTS**: Los comandos usan `IF NOT EXISTS` para evitar errores si las tablas ya existen
5. **Testing**: Después de ejecutar, prueba crear un pedido desde la interfaz

---

## 🐛 Solución de Problemas

### Error: "relation orders already exists"

✅ Esto es normal, significa que la tabla ya existe. Continúa con los siguientes pasos.

### Error: "permission denied for table orders"

❌ Ejecuta los comandos GRANT del paso 6.

### Error: "column customer_type does not exist"

❌ Ejecuta el bloque DO $$ del paso 5 para agregar las columnas faltantes.

### Los gráficos no muestran datos de pedidos

❌ Verifica que:

- Las tablas `orders` y `order_items` existan
- Tengas pedidos con status "entregado"
- Las políticas RLS estén configuradas correctamente

---

## 📊 Estructura de Datos

### Tabla `orders`

| Campo          | Tipo      | Descripción                                      |
| -------------- | --------- | ------------------------------------------------ |
| id             | UUID      | ID único del pedido                              |
| customer_id    | UUID      | Referencia al cliente                            |
| created_at     | TIMESTAMP | Fecha de creación                                |
| updated_at     | TIMESTAMP | Fecha de última actualización                    |
| total_amount   | DECIMAL   | Monto total del pedido                           |
| status         | TEXT      | Estado: pendiente/en_proceso/entregado/cancelado |
| payment_method | TEXT      | Método de pago: Efectivo/Fiado                   |
| notes          | TEXT      | Notas adicionales                                |
| delivery_date  | DATE      | Fecha de entrega programada                      |
| created_by     | UUID      | Usuario que creó el pedido                       |

### Tabla `order_items`

| Campo      | Tipo      | Descripción                       |
| ---------- | --------- | --------------------------------- |
| id         | UUID      | ID único del item                 |
| order_id   | UUID      | Referencia al pedido              |
| product_id | UUID      | Referencia al producto            |
| quantity   | INTEGER   | Cantidad                          |
| unit_price | DECIMAL   | Precio unitario                   |
| subtotal   | DECIMAL   | Subtotal (quantity \* unit_price) |
| created_at | TIMESTAMP | Fecha de creación                 |

---

## ✨ Funcionalidades Habilitadas

Después de ejecutar estos comandos SQL, tendrás funcionando:

✅ **Dashboard Principal**

- Sección "Balance Local vs Reparto"
- Tarjetas con ventas locales y de reparto
- Indicador de dominancia de canal

✅ **Página de Gráficos**

- Evolución de ventas diarias (Local vs Reparto)
- Gráfico de torta con distribución
- Métodos de pago
- Top 10 productos (ventas + pedidos)
- Tendencia mensual (6 meses)
- Selector de rango: 7 días / 30 días / 1 año

✅ **Gestión de Pedidos**

- Crear nuevos pedidos
- Ver detalle de pedidos
- Editar pedidos
- Cambiar estado de pedidos
- Buscar clientes al crear pedido

---

## 📞 Soporte

Si tienes problemas ejecutando estos comandos:

1. Verifica que estés en el proyecto correcto de Supabase
2. Asegúrate de tener permisos de administrador
3. Revisa los logs del SQL Editor para ver errores específicos
4. Consulta la documentación de Supabase sobre políticas RLS

---

**Creado para FrontStock** 🏪
**Última actualización**: 11 de noviembre de 2025
