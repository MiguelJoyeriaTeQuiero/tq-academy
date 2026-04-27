-- ============================================================
-- TQ Academy — Fase 2: Quiz, Certificados, Gamificación
-- ============================================================

-- ── QUIZ / EXÁMENES ─────────────────────────────────────────

CREATE TABLE examenes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leccion_id        UUID NOT NULL REFERENCES lecciones(id) ON DELETE CASCADE,
  preguntas         JSONB NOT NULL DEFAULT '[]',
  nota_minima       INTEGER NOT NULL DEFAULT 70 CHECK (nota_minima BETWEEN 0 AND 100),
  max_intentos      INTEGER NOT NULL DEFAULT 3,
  tiempo_limite_min INTEGER,  -- NULL = sin límite
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE intentos_examen (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  examen_id     UUID NOT NULL REFERENCES examenes(id) ON DELETE CASCADE,
  respuestas    JSONB NOT NULL DEFAULT '{}',
  nota          INTEGER CHECK (nota BETWEEN 0 AND 100),
  aprobado      BOOLEAN NOT NULL DEFAULT false,
  duracion_seg  INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intentos_usuario ON intentos_examen(usuario_id);
CREATE INDEX idx_intentos_examen  ON intentos_examen(examen_id);

-- ── CERTIFICADOS ────────────────────────────────────────────

CREATE TABLE certificados (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curso_id            UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  url_pdf             TEXT,
  fecha_emision       TIMESTAMPTZ NOT NULL DEFAULT now(),
  codigo_verificacion TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  UNIQUE(usuario_id, curso_id)
);

CREATE INDEX idx_certificados_usuario ON certificados(usuario_id);
CREATE INDEX idx_certificados_codigo  ON certificados(codigo_verificacion);

-- ── GAMIFICACIÓN ────────────────────────────────────────────

CREATE TABLE puntos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  puntos_total     INTEGER NOT NULL DEFAULT 0,
  racha_dias       INTEGER NOT NULL DEFAULT 0,
  ultima_actividad DATE
);

CREATE TABLE puntos_historial (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puntos      INTEGER NOT NULL,
  concepto    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_puntos_historial_usuario ON puntos_historial(usuario_id);
CREATE INDEX idx_puntos_historial_fecha   ON puntos_historial(created_at DESC);

CREATE TABLE insignias (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           TEXT NOT NULL,
  descripcion      TEXT,
  imagen_url       TEXT,
  condicion_tipo   TEXT NOT NULL, -- 'lecciones_completadas' | 'examen_perfecto' | 'cursos_completados' | 'racha_dias' | 'ranking_mensual'
  condicion_valor  INTEGER NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE usuario_insignias (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insignia_id    UUID NOT NULL REFERENCES insignias(id) ON DELETE CASCADE,
  fecha_obtenida TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, insignia_id)
);

CREATE INDEX idx_usuario_insignias_usuario ON usuario_insignias(usuario_id);

-- ── TRIGGERS updated_at ─────────────────────────────────────

CREATE TRIGGER examenes_updated_at
  BEFORE UPDATE ON examenes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────

ALTER TABLE examenes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE intentos_examen   ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados      ENABLE ROW LEVEL SECURITY;
ALTER TABLE puntos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE puntos_historial   ENABLE ROW LEVEL SECURITY;
ALTER TABLE insignias          ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_insignias  ENABLE ROW LEVEL SECURITY;

-- examenes: admin escribe, empleados autenticados leen
CREATE POLICY "examenes_read_auth" ON examenes
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "examenes_write_admin" ON examenes
  FOR ALL USING (get_user_rol() IN ('super_admin', 'admin_rrhh'));

-- intentos_examen: el propio usuario + admin/manager leen; usuario inserta el suyo
CREATE POLICY "intentos_select_own" ON intentos_examen
  FOR SELECT USING (
    auth.uid() = usuario_id
    OR get_user_rol() IN ('super_admin', 'admin_rrhh', 'manager')
  );
CREATE POLICY "intentos_insert_own" ON intentos_examen
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- certificados
CREATE POLICY "certificados_select_own" ON certificados
  FOR SELECT USING (
    auth.uid() = usuario_id
    OR get_user_rol() IN ('super_admin', 'admin_rrhh', 'manager')
  );
CREATE POLICY "certificados_insert_service" ON certificados
  FOR INSERT WITH CHECK (
    auth.uid() = usuario_id
    OR get_user_rol() IN ('super_admin', 'admin_rrhh')
  );
CREATE POLICY "certificados_update_service" ON certificados
  FOR UPDATE USING (get_user_rol() IN ('super_admin', 'admin_rrhh'));

-- puntos
CREATE POLICY "puntos_select_auth" ON puntos
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "puntos_upsert_own" ON puntos
  FOR ALL USING (auth.uid() = usuario_id OR get_user_rol() IN ('super_admin', 'admin_rrhh'));

-- puntos_historial
CREATE POLICY "puntos_hist_select" ON puntos_historial
  FOR SELECT USING (
    auth.uid() = usuario_id
    OR get_user_rol() IN ('super_admin', 'admin_rrhh', 'manager')
  );
CREATE POLICY "puntos_hist_insert" ON puntos_historial
  FOR INSERT WITH CHECK (
    auth.uid() = usuario_id
    OR get_user_rol() IN ('super_admin', 'admin_rrhh')
  );

-- insignias: todos leen, solo admin escribe
CREATE POLICY "insignias_select_auth" ON insignias
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "insignias_write_admin" ON insignias
  FOR ALL USING (get_user_rol() IN ('super_admin', 'admin_rrhh'));

-- usuario_insignias
CREATE POLICY "ui_select_own" ON usuario_insignias
  FOR SELECT USING (
    auth.uid() = usuario_id
    OR get_user_rol() IN ('super_admin', 'admin_rrhh', 'manager')
  );
CREATE POLICY "ui_insert" ON usuario_insignias
  FOR INSERT WITH CHECK (
    auth.uid() = usuario_id
    OR get_user_rol() IN ('super_admin', 'admin_rrhh')
  );

-- ── SEED: Insignias iniciales ────────────────────────────────

INSERT INTO insignias (nombre, descripcion, condicion_tipo, condicion_valor) VALUES
  ('Primera lección',   'Completa tu primera lección',               'lecciones_completadas', 1),
  ('Examen perfecto',   'Obtén 100 puntos en un examen',             'examen_perfecto',        100),
  ('Curso completado',  'Completa tu primer curso',                  'cursos_completados',     1),
  ('Racha de 7 días',   'Mantén una racha de 7 días consecutivos',   'racha_dias',             7),
  ('Estudiante del mes','Sé el top 1 del ranking mensual',           'ranking_mensual',        1);

-- ── Storage bucket para certificados ─────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('certificados', 'certificados', true, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "certificados_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'certificados');
CREATE POLICY "certificados_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'certificados'
    AND auth.uid() IS NOT NULL
  );
