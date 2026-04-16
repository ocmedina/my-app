# SQL del proyecto

## Estructura

- `sql/*.sql`: scripts de esquema y funciones reutilizables
- `sql/maintenance/*.sql`: scripts operativos puntuales

## Scripts importantes

- `setup_complete.sql`: base integral para entorno nuevo
- `bootstrap_new_database.sql`: bootstrap completo de tablas, funciones y politicas
- `create_finalize_sale_transaction.sql`: transaccion atomica de cierre de venta
- `create_register_customer_payment_transaction.sql`: registro atomico de pago de cliente
- `create_cancel_customer_payment_transaction.sql`: anulacion atomica de pago de cliente

## Orden sugerido para entorno nuevo

1. `bootstrap_new_database.sql`
2. `setup_complete.sql` (si corresponde al entorno objetivo)
3. Scripts `create_*_transaction.sql` faltantes
4. Scripts `add_*` y `fix_*` segun necesidad de datos existentes

## Buenas practicas

- Ejecutar en entorno de staging antes de produccion.
- Mantener scripts idempotentes (`create if not exists`, `drop if exists` cuando aplique).
- Documentar impacto funcional en commit/PR.
