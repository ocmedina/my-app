-- Create enum for movement types if it doesn't exist
DO $$ BEGIN
    CREATE TYPE movement_type AS ENUM ('venta', 'compra', 'ajuste_manual', 'devolucion', 'cancelacion');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Nullable for system actions or if user is deleted
  movement_type TEXT NOT NULL, -- Using TEXT to be flexible, but intended for movement_type enum values
  quantity INTEGER NOT NULL, -- Positive for addition, negative for subtraction
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reference_id TEXT, -- Can be order_id, purchase_id, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);

-- Add RLS policies
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users (adjust as needed based on roles)
CREATE POLICY "Enable read access for authenticated users" ON stock_movements
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow insert access to authenticated users (via RPCs mostly, but good to have)
CREATE POLICY "Enable insert access for authenticated users" ON stock_movements
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
