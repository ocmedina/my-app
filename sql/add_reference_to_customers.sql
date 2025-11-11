-- Agregar columna 'reference' a la tabla customers
-- Esta columna almacena información de referencia para ubicar la dirección del cliente
-- Por ejemplo: "Entre Callao y Rodríguez Peña", "Esquina con Av. Santa Fe", etc.

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS reference TEXT;

-- Comentario descriptivo
COMMENT ON COLUMN customers.reference IS 'Referencia o punto de ubicación adicional para la dirección del cliente';
