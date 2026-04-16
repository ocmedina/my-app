# FrontStock

Sistema de gestion comercial construido con Next.js + Supabase.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- Supabase (Auth + Postgres)
- TailwindCSS

## Comandos principales

```bash
npm run dev
npm run build
npm run build:strict
npm run lint
```

## Exportacion e importacion de datos

```bash
npm run export:all
npm run import:all
```

Documentacion adicional:
- `scripts/EXPORT_MIGRATION_README.md`

## Estructura del repositorio

```text
src/
	app/                # Paginas y rutas (dashboard, reparto, api)
	components/         # Componentes reutilizables
	hooks/              # Hooks custom
	lib/                # Clientes, utilidades y tipos

sql/
	*.sql               # Migraciones y funciones SQL
	maintenance/        # Scripts operativos puntuales

scripts/
	checks/             # Scripts de validacion
	fixes/              # Scripts de correccion masiva
	migrations/         # Scripts de migracion
	utils/              # Utilidades de soporte

docs/
	REPO_STRUCTURE.md
	INSTRUCCIONES_ALIMENTO_SUELTO.md
```

## Convenciones

- Usar imports con alias `@/` desde `src`.
- Evitar logica duplicada: centralizar helpers en `src/lib`.
- Formateo de montos para UI en locale `es-AR`.
- Para cambios de base, preferir scripts en `sql/` con nombre descriptivo.

## Arranque rapido

1. Crear `.env.local` con credenciales de Supabase.
2. Instalar dependencias con `npm install`.
3. Ejecutar `npm run dev`.
4. Verificar build estricto con `npm run build:strict`.

## Documentacion complementaria

- `docs/REPO_STRUCTURE.md`
- `sql/README.md`
- `scripts/README.md`
