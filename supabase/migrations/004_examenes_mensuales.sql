-- ============================================================
-- TQ Academy — Fase 4: Exámenes mensuales generados por IA
-- ============================================================
-- Distintos de `examenes` (que están atados a una lección).
-- Un examen mensual cubre un curso completo en un periodo (YYYY-MM)
-- y se genera automáticamente con Claude a partir de las lecciones.
-- ============================================================

CREATE TABLE examenes_mensuales (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id     UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  periodo      TEXT NOT NULL,                                       -- 'YYYY-MM'
  titulo       TEXT NOT NULL,
  preguntas    JSONB NOT NULL DEFAULT '[]',
  nota_minima  INTEGER NOT NULL DEFAULT 70 CHECK (nota_minima BETWEEN 0 AND 100),
  max_intentos INTEGER NOT NULL DEFAULT 2,
  publicado    BOOLEAN NOT NULL DEFAULT false,
  generado_por TEXT NOT NULL DEFAULT 'ia',                          -- 'ia' | 'manual'
  modelo_ia    TEXT,                                                 -- ej: 'claude-sonnet-4-6'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (curso_id, periodo)
);

CREATE INDEX idx_examenes_mensuales_curso   ON examenes_mensuales(curso_id);
CREATE INDEX idx_examenes_mensuales_periodo ON examenes_mensuales(periodo);

CREATE TABLE intentos_examen_mensual (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  examen_mensual_id  UUID NOT NULL REFERENCES examenes_mensuales(id) ON DELETE CASCADE,
  respuestas         JSONB NOT NULL DEFAULT '{}',
  nota               INTEGER CHECK (nota BETWEEN 0 AND 100),
  aprobado           BOOLEAN NOT NULL DEFAULT false,
  duracion_seg       INTEGER,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intentos_em_usuario ON intentos_examen_mensual(usuario_id);
CREATE INDEX idx_intentos_em_examen  ON intentos_examen_mensual(examen_mensual_id);

CREATE TRIGGER examenes_mensuales_updated_at
  BEFORE UPDATE ON examenes_mensuales
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE examenes_mensuales        ENABLE ROW LEVEL SECURITY;
ALTER TABLE intentos_examen_mensual   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "em_read_publicado_o_admin" ON examenes_mensuales
  FOR SELECT USING (
    publicado = true
    OR get_user_rol() IN ('super_admin', 'admin_rrhh', 'manager')
  );
CREATE POLICY "em_write_admin" ON examenes_mensuales
  FOR ALL USING (get_user_rol() IN ('super_admin', 'admin_rrhh'));

CREATE POLICY "iem_select_own" ON intentos_examen_mensual
  FOR SELECT USING (
    auth.uid() = usuario_id
    OR get_user_rol() IN ('super_admin', 'admin_rrhh', 'manager')
  );
CREATE POLICY "iem_insert_own" ON intentos_examen_mensual
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);
