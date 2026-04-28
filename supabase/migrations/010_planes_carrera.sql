-- ============================================================
-- 010 — Planes de carrera (asignaciones, progreso, DPT actual)
-- ============================================================

-- 1. profiles: DPT actual (puesto vivo del empleado)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dpt_actual_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_dpt_slug
  ON profiles(dpt_actual_slug);

-- 2. Asignación de un plan de carrera a un empleado
CREATE TYPE plan_carrera_estado AS ENUM (
  'activo',
  'pausado',
  'completado',
  'cancelado'
);

CREATE TABLE plan_carrera_asignaciones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_slug       TEXT NOT NULL,           -- referencia a CareerPath.slug (estático en código)
  asignado_por    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_inicio    DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_objetivo  DATE,
  estado          plan_carrera_estado NOT NULL DEFAULT 'activo',
  notas           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, path_slug)
);

CREATE INDEX idx_plan_asign_usuario ON plan_carrera_asignaciones(usuario_id);
CREATE INDEX idx_plan_asign_estado ON plan_carrera_asignaciones(estado);
CREATE INDEX idx_plan_asign_path ON plan_carrera_asignaciones(path_slug);

-- 3. Progreso por hito dentro de la asignación
CREATE TABLE plan_carrera_hito_progreso (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asignacion_id     UUID NOT NULL REFERENCES plan_carrera_asignaciones(id) ON DELETE CASCADE,
  hito_index        INTEGER NOT NULL,
  completado        BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_completado  TIMESTAMPTZ,
  marcado_por       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validado_por      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_validado    TIMESTAMPTZ,
  evidencia         TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (asignacion_id, hito_index)
);

CREATE INDEX idx_plan_hito_asignacion ON plan_carrera_hito_progreso(asignacion_id);

-- 4. Trigger updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_plan_asign_updated
  BEFORE UPDATE ON plan_carrera_asignaciones
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_plan_hito_updated
  BEFORE UPDATE ON plan_carrera_hito_progreso
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. RLS
ALTER TABLE plan_carrera_asignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_carrera_hito_progreso ENABLE ROW LEVEL SECURITY;

-- Helper: ¿es manager del usuario? (por tienda o departamento compartido)
CREATE OR REPLACE FUNCTION public.is_manager_of(target_user UUID)
RETURNS BOOLEAN AS $$
DECLARE
  caller_rol  user_rol;
  caller_tienda UUID;
  caller_depto  UUID;
  target_tienda UUID;
  target_depto  UUID;
BEGIN
  SELECT rol, tienda_id, departamento_id
    INTO caller_rol, caller_tienda, caller_depto
  FROM profiles WHERE id = auth.uid();

  IF caller_rol IS NULL OR caller_rol <> 'manager' THEN
    RETURN FALSE;
  END IF;

  SELECT tienda_id, departamento_id
    INTO target_tienda, target_depto
  FROM profiles WHERE id = target_user;

  RETURN (caller_tienda IS NOT NULL AND caller_tienda = target_tienda)
      OR (caller_depto  IS NOT NULL AND caller_depto  = target_depto);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─── Asignaciones ───────────────────────────────────────────
CREATE POLICY "plan_asign_select" ON plan_carrera_asignaciones
  FOR SELECT USING (
    usuario_id = auth.uid()
    OR get_user_rol() IN ('super_admin', 'admin_rrhh')
    OR is_manager_of(usuario_id)
  );

CREATE POLICY "plan_asign_insert_admin" ON plan_carrera_asignaciones
  FOR INSERT WITH CHECK (
    get_user_rol() IN ('super_admin', 'admin_rrhh')
  );

CREATE POLICY "plan_asign_update_admin" ON plan_carrera_asignaciones
  FOR UPDATE USING (
    get_user_rol() IN ('super_admin', 'admin_rrhh')
  );

CREATE POLICY "plan_asign_delete_admin" ON plan_carrera_asignaciones
  FOR DELETE USING (
    get_user_rol() IN ('super_admin', 'admin_rrhh')
  );

-- ─── Hitos ──────────────────────────────────────────────────
-- Lectura: empleado dueño, su manager, o admin
CREATE POLICY "plan_hito_select" ON plan_carrera_hito_progreso
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM plan_carrera_asignaciones a
      WHERE a.id = asignacion_id
      AND (
        a.usuario_id = auth.uid()
        OR get_user_rol() IN ('super_admin', 'admin_rrhh')
        OR is_manager_of(a.usuario_id)
      )
    )
  );

-- Insert/Update: el empleado puede marcar sus hitos; manager y admin también
CREATE POLICY "plan_hito_insert" ON plan_carrera_hito_progreso
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM plan_carrera_asignaciones a
      WHERE a.id = asignacion_id
      AND (
        a.usuario_id = auth.uid()
        OR get_user_rol() IN ('super_admin', 'admin_rrhh')
        OR is_manager_of(a.usuario_id)
      )
    )
  );

CREATE POLICY "plan_hito_update" ON plan_carrera_hito_progreso
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM plan_carrera_asignaciones a
      WHERE a.id = asignacion_id
      AND (
        a.usuario_id = auth.uid()
        OR get_user_rol() IN ('super_admin', 'admin_rrhh')
        OR is_manager_of(a.usuario_id)
      )
    )
  );

CREATE POLICY "plan_hito_delete_admin" ON plan_carrera_hito_progreso
  FOR DELETE USING (
    get_user_rol() IN ('super_admin', 'admin_rrhh')
  );
