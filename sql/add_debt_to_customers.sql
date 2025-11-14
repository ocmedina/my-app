-- ============================================
-- AGREGAR CAMPO DEBT A TABLA CUSTOMERS
-- ============================================
-- Este campo almacena la deuda pendiente de cada cliente

-- Agregar columna debt si no existe
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS debt DECIMAL(10, 2) DEFAULT 0.00;

-- Actualizar clientes existentes que no tengan valor
UPDATE customers 
SET debt = 0.00 
WHERE debt IS NULL;

-- Verificar que se agregó correctamente
SELECT id, full_name, debt 
FROM customers 
LIMIT 5;
