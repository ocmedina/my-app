-- Función para manejar el cambio de estado de un pedido y actualizar el stock
CREATE OR REPLACE FUNCTION handle_order_status_change(
  order_id_param UUID,
  new_status_param TEXT
) RETURNS VOID AS $$
DECLARE
  current_status TEXT;
  item RECORD;
  v_current_stock INTEGER;
  v_user_id UUID;
BEGIN
  -- Obtener el estado actual del pedido
  SELECT status INTO current_status FROM orders WHERE id = order_id_param;

  -- Intentar obtener el ID del usuario actual (si está disponible en el contexto)
  v_user_id := auth.uid();

  -- Si el estado no cambia, no hacer nada
  IF current_status = new_status_param THEN
    RETURN;
  END IF;

  -- Lógica de actualización de stock
  
  -- CASO 1: Marcar como ENTREGADO (desde cualquier otro estado que no sea entregado)
  -- Se debe DESCONTAR stock
  IF new_status_param = 'entregado' AND current_status != 'entregado' THEN
    FOR item IN SELECT product_id, quantity FROM order_items WHERE order_id = order_id_param LOOP
      -- Obtener stock actual para el registro
      SELECT stock INTO v_current_stock FROM products WHERE id = item.product_id FOR UPDATE;
      
      -- Actualizar stock
      UPDATE products 
      SET stock = stock - item.quantity 
      WHERE id = item.product_id;

      -- Registrar movimiento (Venta)
      INSERT INTO stock_movements (
        product_id,
        user_id,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        reference_id,
        notes
      ) VALUES (
        item.product_id,
        v_user_id,
        'venta',
        -item.quantity, -- Cantidad negativa porque sale
        v_current_stock,
        v_current_stock - item.quantity,
        order_id_param::text,
        'Entrega de pedido #' || order_id_param::text
      );
    END LOOP;
  END IF;

  -- CASO 2: Desmarcar como ENTREGADO (pasar de entregado a pendiente o cancelado)
  -- Se debe DEVOLVER stock
  IF current_status = 'entregado' AND new_status_param != 'entregado' THEN
    FOR item IN SELECT product_id, quantity FROM order_items WHERE order_id = order_id_param LOOP
      -- Obtener stock actual para el registro
      SELECT stock INTO v_current_stock FROM products WHERE id = item.product_id FOR UPDATE;

      -- Actualizar stock
      UPDATE products 
      SET stock = stock + item.quantity 
      WHERE id = item.product_id;

      -- Registrar movimiento (Devolución)
      INSERT INTO stock_movements (
        product_id,
        user_id,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        reference_id,
        notes
      ) VALUES (
        item.product_id,
        v_user_id,
        'devolucion',
        item.quantity, -- Cantidad positiva porque entra
        v_current_stock,
        v_current_stock + item.quantity,
        order_id_param::text,
        'Cancelación/Reversión de entrega de pedido #' || order_id_param::text
      );
    END LOOP;
  END IF;

  -- Actualizar el estado del pedido
  UPDATE orders SET status = new_status_param WHERE id = order_id_param;

END;
$$ LANGUAGE plpgsql;
