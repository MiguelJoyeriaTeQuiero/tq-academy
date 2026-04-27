-- ============================================================
-- TQ Academy — Schema inicial
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TIPOS ENUMERADOS
-- ============================================================

CREATE TYPE user_rol AS ENUM ('super_admin', 'admin_rrhh', 'manager', 'empleado');
CREATE TYPE leccion_tipo AS ENUM ('video', 'pdf', 'quiz', 'scorm');
CREATE TYPE tipo_destino AS ENUM ('usuario', 'tienda', 'departamento');

-- ============================================================
-- TABLAS
-- ============================================================

-- Tiendas
CREATE TABLE tiendas (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       TEXT NOT NULL,
  isla         TEXT NOT NULL,
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Departamentos
CREATE TABLE departamentos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       TEXT NOT NULL,
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perfiles de usuario (extiende auth.users)
CREATE TABLE profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT NOT NULL,
  nombre           TEXT NOT NULL DEFAULT '',
  apellido         TEXT NOT NULL DEFAULT '',
  rol              user_rol NOT NULL DEFAULT 'empleado',
  tienda_id        UUID REFERENCES tiendas(id) ON DELETE SET NULL,
  departamento_id  UUID REFERENCES departamentos(id) ON DELETE SET NULL,
  avatar_url       TEXT,
  activo           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rutas de aprendizaje
CREATE TABLE rutas_aprendizaje (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo       TEXT NOT NULL,
  descripcion  TEXT,
  imagen_url   TEXT,
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cursos
CREATE TABLE cursos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ruta_id      UUID REFERENCES rutas_aprendizaje(id) ON DELETE SET NULL,
  titulo       TEXT NOT NULL,
  descripcion  TEXT,
  imagen_url   TEXT,
  orden        INTEGER NOT NULL DEFAULT 0,
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Módulos
CREATE TABLE modulos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curso_id     UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  titulo       TEXT NOT NULL,
  orden        INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lecciones
CREATE TABLE lecciones (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modulo_id             UUID NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  titulo                TEXT NOT NULL,
  tipo                  leccion_tipo NOT NULL DEFAULT 'video',
  contenido_url         TEXT,
  duracion_minutos      INTEGER,
  orden                 INTEGER NOT NULL DEFAULT 0,
  completado_minimo_pct INTEGER NOT NULL DEFAULT 80,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asignaciones de cursos
CREATE TABLE asignaciones (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curso_id       UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  tipo_destino   tipo_destino NOT NULL,
  destino_id     UUID NOT NULL,
  fecha_limite   DATE,
  obligatorio    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (curso_id, tipo_destino, destino_id)
);

-- Progreso por lección
CREATE TABLE progreso_lecciones (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leccion_id   UUID NOT NULL REFERENCES lecciones(id) ON DELETE CASCADE,
  completado   BOOLEAN NOT NULL DEFAULT FALSE,
  porcentaje   INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, leccion_id)
);

-- Progreso por curso
CREATE TABLE progreso_cursos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curso_id         UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  completado       BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_completado TIMESTAMPTZ,
  porcentaje       INTEGER NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, curso_id)
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_profiles_rol ON profiles(rol);
CREATE INDEX idx_profiles_tienda ON profiles(tienda_id);
CREATE INDEX idx_profiles_departamento ON profiles(departamento_id);
CREATE INDEX idx_cursos_ruta ON cursos(ruta_id);
CREATE INDEX idx_modulos_curso ON modulos(curso_id);
CREATE INDEX idx_lecciones_modulo ON lecciones(modulo_id);
CREATE INDEX idx_asignaciones_curso ON asignaciones(curso_id);
CREATE INDEX idx_asignaciones_destino ON asignaciones(tipo_destino, destino_id);
CREATE INDEX idx_progreso_lecciones_usuario ON progreso_lecciones(usuario_id);
CREATE INDEX idx_progreso_lecciones_leccion ON progreso_lecciones(leccion_id);
CREATE INDEX idx_progreso_cursos_usuario ON progreso_cursos(usuario_id);
CREATE INDEX idx_progreso_cursos_curso ON progreso_cursos(curso_id);

-- ============================================================
-- TRIGGER: crear profile al registrar usuario
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre, apellido, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    COALESCE((NEW.raw_user_meta_data->>'rol')::user_rol, 'empleado')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para updated_at en profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER progreso_lecciones_updated_at
  BEFORE UPDATE ON progreso_lecciones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER progreso_cursos_updated_at
  BEFORE UPDATE ON progreso_cursos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas_aprendizaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE progreso_lecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE progreso_cursos ENABLE ROW LEVEL SECURITY;

-- Helper function: obtener rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_rol()
RETURNS user_rol AS $$
  SELECT rol FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: obtener tienda_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_tienda()
RETURNS UUID AS $$
  SELECT tienda_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: obtener departamento_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_departamento()
RETURNS UUID AS $$
  SELECT departamento_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- PROFILES ----
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR get_user_rol() IN ('super_admin', 'admin_rrhh')
  );

CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT WITH CHECK (
    get_user_rol() IN ('super_admin', 'admin_rrhh')
    OR id = auth.uid()  -- allow trigger to insert own profile
  );

CREATE POLICY "profiles_update_admin_or_own" ON profiles
  FOR UPDATE USING (
    get_user_rol() IN ('super_admin', 'admin_rrhh')
    OR id = auth.uid()
  );

CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (
    get_user_rol() IN ('super_admin', 'admin_rrhh')
  );

-- ---- TIENDAS ----
CREATE POLICY "tiendas_select_all" ON tiendas
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "tiendas_write_admin" ON tiendas
  FOR ALL USING (get_user_rol() IN ('super_admin', 'admin_rrhh'));

-- ---- DEPARTAMENTOS ----
CREATE POLICY "departamentos_select_all" ON departamentos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "departamentos_write_admin" ON departamentos
  FOR ALL USING (get_user_rol() IN ('super_admin', 'admin_rrhh'));

-- ---- RUTAS_APRENDIZAJE ----
CREATE POLICY "rutas_select_all" ON rutas_aprendizaje
  FOR SELECT USING (auth.uid() IS NOT NULL AND activo = TRUE OR get_user_rol() IN ('super_admin', 'admin_rrhh'));

CREATE POLICY "rutas_write_admin" ON rutas_aprendizaje
  FOR ALL USING (get_user_rol() IN ('super_admin', 'admin_rrhh'));

-- ---- CURSOS ----
CREATE POLICY "cursos_select_all" ON cursos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "cursos_write_admin" ON cursos
  FOR ALL USING (get_user_rol() IN ('super_admin', 'admin_rrhh'));

-- ---- MODULOS ----
CREATE POLICY "modulos_select_all" ON modulos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "modulos_write_admin" ON modulos
  FOR ALL USING (get_user_rol() IN ('super_admin', 'admin_rrhh'));

-- ---- LECCIONES ----
CREATE POLICY "lecciones_select_all" ON lecciones
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "lecciones_write_admin" ON lecciones
  FOR ALL USING (get_user_rol() IN ('super_admin', 'admin_rrhh'));

-- ---- ASIGNACIONES ----
-- Empleado ve asignaciones que le corresponden (por usuario, tienda o departamento)
CREATE POLICY "asignaciones_select_empleado" ON asignaciones
  FOR SELECT USING (
    get_user_rol() IN ('super_admin', 'admin_rrhh', 'manager')
    OR (tipo_destino = 'usuario' AND destino_id = auth.uid())
    OR (tipo_destino = 'tienda' AND destino_id = get_user_tienda())
    OR (tipo_destino = 'departamento' AND destino_id = get_user_departamento())
  );

CREATE POLICY "asignaciones_write_admin" ON asignaciones
  FOR ALL USING (get_user_rol() IN ('super_admin', 'admin_rrhh'));

-- ---- PROGRESO_LECCIONES ----
CREATE POLICY "progreso_lecciones_own" ON progreso_lecciones
  FOR ALL USING (
    usuario_id = auth.uid()
    OR get_user_rol() IN ('super_admin', 'admin_rrhh')
  );

-- ---- PROGRESO_CURSOS ----
CREATE POLICY "progreso_cursos_own" ON progreso_cursos
  FOR ALL USING (
    usuario_id = auth.uid()
    OR get_user_rol() IN ('super_admin', 'admin_rrhh')
  );

-- ============================================================
-- DATOS DE PRUEBA INICIALES
-- ============================================================

-- Tiendas de ejemplo
INSERT INTO tiendas (nombre, isla) VALUES
  ('Tienda Lanzarote Centro', 'Lanzarote'),
  ('Tienda Tenerife Norte', 'Tenerife'),
  ('Tienda Gran Canaria Sur', 'Gran Canaria');

-- Departamentos de ejemplo
INSERT INTO departamentos (nombre) VALUES
  ('Ventas'),
  ('Atención al Cliente'),
  ('Logística'),
  ('RRHH');

-- Ruta de aprendizaje de ejemplo
INSERT INTO rutas_aprendizaje (titulo, descripcion) VALUES
  ('Onboarding Nuevos Empleados', 'Formación inicial obligatoria para todos los nuevos empleados de Te Quiero Group');

-- ============================================================
-- STORAGE: crear buckets necesarios
-- ============================================================
-- Ejecutar esto por separado si necesitas storage:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('course-media', 'course-media', true)
-- ON CONFLICT DO NOTHING;
--
-- CREATE POLICY "Media accesible por usuarios autenticados"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'course-media' AND auth.role() = 'authenticated');
--
-- CREATE POLICY "Solo admin puede subir media"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'course-media'
--   AND (SELECT rol FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'admin_rrhh')
-- );
