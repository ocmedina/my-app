-- Agregar columnas para manejo de pagos y saldos en ventas
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_pending DECIMAL(10, 2) DEFAULT 0;

-- Actualizar ventas existentes para calcular el saldo pendiente basado en payment_method
-- Las ventas en cuenta_corriente tienen todo el monto pendiente
UPDATE sales 
SET amount_pending = total_amount,
    amount_paid = 0
WHERE payment_method = 'cuenta_corriente' 
  AND (amount_pending IS NULL OR amount_pending = 0);

-- Las ventas en efectivo están completamente pagadas
UPDATE sales 
SET amount_pending = 0,
    amount_paid = total_amount
WHERE payment_method = 'efectivo' 
  AND (amount_paid IS NULL OR amount_paid = 0);

-- Comentarios sobre las columnas
COMMENT ON COLUMN sales.amount_paid IS 'Monto pagado/entregado de la venta';
COMMENT ON COLUMN sales.amount_pending IS 'Saldo pendiente de pago de la venta';
