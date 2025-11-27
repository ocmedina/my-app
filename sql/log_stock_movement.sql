CREATE OR REPLACE FUNCTION log_stock_movement(
  p_product_id UUID,
  p_movement_type TEXT,
  p_quantity INTEGER,
  p_user_id UUID DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  -- Get current stock and lock the row
  SELECT stock INTO v_current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF v_current_stock IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Calculate new stock
  v_new_stock := v_current_stock + p_quantity;

  -- Prevent negative stock if desired (optional, but good practice)
  IF v_new_stock < 0 THEN
     -- Allow it for now or raise exception depending on business logic. 
     -- Let's allow it but maybe warn? For now, we just proceed.
     -- RAISE EXCEPTION 'Insufficient stock';
  END IF;

  -- Update product stock
  UPDATE products
  SET stock = v_new_stock
  WHERE id = p_product_id;

  -- Insert movement record
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
    p_product_id,
    p_user_id,
    p_movement_type,
    p_quantity,
    v_current_stock,
    v_new_stock,
    p_reference_id,
    p_notes
  );
END;
$$ LANGUAGE plpgsql;
