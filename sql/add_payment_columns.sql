-- Agregar columnas para manejo de pagos y saldos en pedidos
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'efectivo',
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_pending DECIMAL(10, 2) DEFAULT 0;

-- Actualizar pedidos existentes para calcular el saldo pendiente
UPDATE orders 
SET amount_pending = total_amount 
WHERE amount_pending IS NULL OR amount_pending = 0;

-- Comentarios sobre las columnas
COMMENT ON COLUMN orders.payment_method IS 'Método de pago: efectivo o fiado';
COMMENT ON COLUMN orders.amount_paid IS 'Monto pagado/entregado del pedido';
COMMENT ON COLUMN orders.amount_pending IS 'Saldo pendiente de pago';
