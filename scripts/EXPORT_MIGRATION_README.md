# Exportación total para migración (bases distintas)

## Objetivo
Generar un paquete completo de exportación desde este sistema para migrar a otro con estructura diferente.

## Comando
```bash
npm run export:all
```

## Requisitos
- `.env.local` con:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Salida
Se crea una carpeta con timestamp en:
- `exports/system_export_YYYYMMDD_HHMMSS/`

Dentro vas a tener:
- `all_tables.xlsx` (todas las tablas en hojas separadas)
- `csv/*.csv` (un archivo por tabla)
- `json/*.json` (un archivo por tabla)
- `mapping_template.csv` (plantilla para mapear campos al sistema destino)
- `integrity_summary.json` (totales de control para validar migración)
- `export_report.json` (estado por tabla y errores)
- `import_order.txt` (orden sugerido de importación)

## Flujo recomendado para migrar
1. Exportar con `npm run export:all`
2. Completar `mapping_template.csv` con campos reales del sistema destino
3. Importar siguiendo `import_order.txt`
4. Validar contra `integrity_summary.json` y conteos por tabla

## Notas
- Si alguna tabla falla por permisos o porque no existe, el proceso sigue y queda registrado en `export_report.json`.
- El archivo usa `service_role`, por lo que accede a datos completos (usar solo en entorno seguro).
