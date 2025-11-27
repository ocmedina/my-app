-- Agregar columna barcode a la tabla products
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Crear índice para búsquedas rápidas por código de barras
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
