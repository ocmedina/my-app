# Scripts operativos

## Carpetas

- `checks/`: validaciones de integridad o consistencia
- `fixes/`: correcciones masivas sobre codigo o datos
- `migrations/`: migraciones asistidas por script
- `utils/`: helpers internos de soporte

## Comandos de alto nivel

- `npm run export:all`: exporta datos para migracion
- `npm run import:all`: importa bundle exportado

## Recomendaciones

1. Ejecutar scripts con backup previo cuando toquen datos.
2. Agregar logs claros para saber que se modifico.
3. Evitar scripts temporales en raiz del repo.
4. Si un script pasa a ser permanente, documentarlo aqui.
