-- Agregar campo is_cancelled a la tabla sales para anular ventas
-- Ejecutar en Supabase SQL Editor

ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT false;

-- Crear índice para búsquedas más rápidas
CREATE INDEX IF NOT EXISTS idx_sales_is_cancelled ON sales(is_cancelled);

-- Comentario para documentar
COMMENT ON COLUMN sales.is_cancelled IS 'Indica si la venta fue anulada. Cuando es true, el stock fue devuelto y la deuda revertida.';
