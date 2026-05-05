-- ============================================================
-- 011 — Mapeo curso ↔ hito de plan de carrera (auto-progreso)
-- ============================================================

CREATE TABLE plan_carrera_hito_cursos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path_slug   TEXT NOT NULL,
  hito_index  INTEGER NOT NULL,
  curso_id    UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (path_slug, hito_index, curso_id)
);

CREATE INDEX idx_plan_hito_cursos_path ON plan_carrera_hito_cursos(path_slug);
CREATE INDEX idx_plan_hito_cursos_curso ON plan_carrera_hito_cursos(curso_id);

ALTER TABLE plan_carrera_hito_cursos ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer (necesario para empleado/manager).
CREATE POLICY "plan_hito_cursos_select" ON plan_carrera_hito_cursos
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Solo admins escriben.
CREATE POLICY "plan_hito_cursos_insert_admin" ON plan_carrera_hito_cursos
  FOR INSERT WITH CHECK (get_user_rol() IN ('super_admin', 'admin_rrhh'));

CREATE POLICY "plan_hito_cursos_delete_admin" ON plan_carrera_hito_cursos
  FOR DELETE USING (get_user_rol() IN ('super_admin', 'admin_rrhh'));
