-- ============================================
-- ACTUALIZAR MÉTODOS DE PAGO EN ORDERS
-- ============================================
-- Este archivo agrega los nuevos métodos de pago: transferencia y mixto

-- Nota: En PostgreSQL, TEXT no tiene restricciones por defecto,
-- pero es buena práctica documentar los valores permitidos

-- Los valores permitidos ahora son:
-- - 'efectivo'
-- - 'fiado'
-- - 'transferencia'
-- - 'mixto'

-- Si quieres agregar una restricción CHECK (opcional):
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
-- ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check 
--   CHECK (payment_method IN ('efectivo', 'fiado', 'transferencia', 'mixto'));

-- Actualizar pedidos existentes que tengan valores antiguos
UPDATE orders 
SET payment_method = 'efectivo' 
WHERE payment_method = 'Efectivo' OR payment_method IS NULL;

UPDATE orders 
SET payment_method = 'fiado' 
WHERE payment_method = 'Fiado';

-- Verificar los valores actuales
-- SELECT DISTINCT payment_method, COUNT(*) 
-- FROM orders 
-- GROUP BY payment_method;
