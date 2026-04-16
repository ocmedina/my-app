-- Script para investigar y corregir la deuda negativa de "Consumidor Final"
-- Fecha: 2026-02-10

-- 1. Ver el estado actual del cliente "Consumidor Final"
SELECT 
    id,
    full_name,
    debt,
    is_active,
    created_at
FROM customers
WHERE full_name = 'Consumidor Final';

-- 2. Ver todas las ventas asociadas a este cliente
SELECT 
    s.id,
    s.created_at,
    s.total_amount,
    s.amount_paid,
    s.amount_pending,
    s.payment_method,
    s.is_cancelled
FROM sales s
JOIN customers c ON s.customer_id = c.id
WHERE c.full_name = 'Consumidor Final'
ORDER BY s.created_at DESC;

-- 3. Ver todos los pagos registrados para este cliente
SELECT 
    p.id,
    p.created_at,
    p.type,
    p.amount,
    p.comment
FROM payments p
JOIN customers c ON p.customer_id = c.id
WHERE c.full_name = 'Consumidor Final'
ORDER BY p.created_at DESC;

-- 4. Ver todos los pedidos (orders) asociados a este cliente
SELECT 
    o.id,
    o.created_at,
    o.total_amount,
    o.amount_paid,
    o.amount_pending,
    o.status
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE c.full_name = 'Consumidor Final'
ORDER BY o.created_at DESC;

-- 5. Calcular la deuda real basada en las transacciones
WITH customer_data AS (
    SELECT id FROM customers WHERE full_name = 'Consumidor Final'
),
sales_debt AS (
    SELECT COALESCE(SUM(amount_pending), 0) as total
    FROM sales
    WHERE customer_id = (SELECT id FROM customer_data)
      AND payment_method = 'cuenta_corriente'
      AND is_cancelled = false
),
orders_debt AS (
    SELECT COALESCE(SUM(amount_pending), 0) as total
    FROM orders
    WHERE customer_id = (SELECT id FROM customer_data)
      AND status != 'cancelado'
)
SELECT 
    (SELECT total FROM sales_debt) as deuda_ventas,
    (SELECT total FROM orders_debt) as deuda_pedidos,
    (SELECT total FROM sales_debt) + (SELECT total FROM orders_debt) as deuda_total_calculada,
    (SELECT debt FROM customers WHERE id = (SELECT id FROM customer_data)) as deuda_en_tabla;

-- 6. CORRECCIÓN: Actualizar la deuda del cliente al valor correcto
-- IMPORTANTE: Ejecutar solo después de revisar los resultados anteriores

-- Opción A: Si la deuda calculada es correcta, actualizar la columna debt
UPDATE customers
SET debt = (
    SELECT COALESCE(
        (SELECT SUM(amount_pending) FROM sales 
         WHERE customer_id = customers.id 
           AND payment_method = 'cuenta_corriente' 
           AND is_cancelled = false),
        0
    ) + COALESCE(
        (SELECT SUM(amount_pending) FROM orders 
         WHERE customer_id = customers.id 
           AND status != 'cancelado'),
        0
    )
)
WHERE full_name = 'Consumidor Final';

-- Opción B: Si el cliente no debería tener deuda, resetear a 0
-- UPDATE customers
-- SET debt = 0
-- WHERE full_name = 'Consumidor Final';

-- 7. Verificar el resultado
SELECT 
    id,
    full_name,
    debt,
    is_active
FROM customers
WHERE full_name = 'Consumidor Final';
