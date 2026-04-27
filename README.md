# TQ Academy — LMS de Te Quiero Group

Plataforma de formación corporativa construida con Next.js 14, Supabase y Shadcn/ui.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript strict
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage)
- **Estilos:** Tailwind CSS + Shadcn/ui (New York)
- **Formularios:** React Hook Form + Zod

## Requisitos previos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) con proyecto creado

## Instalación

```bash
# 1. Clonar e instalar dependencias
git clone <repo>
cd tq-academy
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# 3. Ejecutar el schema SQL en Supabase
# Dashboard > SQL Editor > copiar y ejecutar el contenido de:
# supabase/migrations/001_initial.sql

# 4. (Opcional) Crear bucket de storage en Supabase
# Dashboard > Storage > New bucket > "course-media" (public)
# O descomentar y ejecutar las líneas al final del script SQL

# 5. Iniciar el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Credenciales de Supabase

Encuéntralas en: **Settings > API**

| Variable | Dónde encontrarla |
|----------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings > API > anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings > API > service_role key |

> **Importante:** La `SERVICE_ROLE_KEY` nunca debe exponerse al cliente. Solo se usa en rutas de servidor.

## Estructura del proyecto

```
tq-academy/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   ├── recuperar-password/
│   │   └── callback/
│   └── dashboard/
│       ├── admin/
│       └── empleado/
├── components/
│   ├── ui/          (shadcn/ui)
│   └── layout/      (sidebar, navbar)
├── lib/
│   └── supabase/    (client, server, middleware)
├── types/
│   └── database.ts
└── supabase/
    └── migrations/
        └── 001_initial.sql
```

## Roles de usuario

| Rol | Acceso |
|-----|--------|
| `super_admin` | Acceso total, gestión de todo |
| `admin_rrhh` | Gestión de usuarios, cursos y reportes |
| `manager` | Vista de su tienda/departamento |
| `empleado` | Sus cursos asignados y catálogo libre |

## Crear primer super admin

Tras ejecutar el SQL, crea un usuario en Supabase Auth y luego actualiza su rol manualmente:

```sql
UPDATE profiles SET rol = 'super_admin' WHERE email = 'tu@email.com';
```

## Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linter
```
