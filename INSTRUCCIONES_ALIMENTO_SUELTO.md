INSERT INTO products (
  name,
  sku,
  price_minorista,
  price_mayorista,
  stock,
  is_active
) VALUES (
  'Alimento suelto',
  'SUELTO',
  0,
  0,
  999999,
  true
)
ON CONFLICT (sku) DO NOTHING;
