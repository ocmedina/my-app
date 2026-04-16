# Estructura recomendada del repositorio

## Objetivo
Mantener una organizacion estable para que el codigo sea facil de navegar, mantener y escalar.

## Mapa principal

- `src/app`: rutas de Next.js (paginas, layouts, api)
- `src/components`: componentes compartidos de UI
	- `src/components/payments`: componentes de pagos
	- `src/components/exports`: botones de exportacion
	- `src/components/pdf`: documentos y descargas PDF
- `src/hooks`: hooks reutilizables
- `src/contexts`: providers y contexto global
- `src/lib`: clientes, utilidades, tipos y helpers de dominio

- `sql`: scripts SQL de esquema, funciones y ajustes
- `sql/maintenance`: scripts operativos puntuales (correcciones manuales)

- `scripts/checks`: validaciones y chequeos de consistencia
- `scripts/fixes`: scripts correctivos
- `scripts/migrations`: migraciones asistidas por script
- `scripts/utils`: utilidades de apoyo

- `docs`: documentacion funcional y tecnica
- `public`: assets estaticos

## Reglas de ubicacion

1. Si un helper se usa en mas de un modulo, moverlo a `src/lib`.
2. Si un SQL es una correccion puntual no estructural, guardarlo en `sql/maintenance`.
3. Si un script toca datos productivos, debe vivir en `scripts/` con nombre explicito.
4. No dejar archivos operativos sueltos en la raiz.

## Convencion de nombres

- SQL: `create_<feature>.sql`, `add_<campo>_to_<tabla>.sql`, `fix_<tema>.sql`
- Scripts: `<accion>-<objeto>.js`
- Componentes React: PascalCase (`RegisterPayment.tsx`)
- Utilidades: camelCase (`numberFormat.ts`)

## Checklist rapido antes de agregar archivos

- Esta en la carpeta correcta segun su rol.
- Tiene nombre descriptivo.
- Si afecta datos, esta documentado en README del area.
