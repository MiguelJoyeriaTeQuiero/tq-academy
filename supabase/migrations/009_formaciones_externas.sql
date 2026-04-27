-- ============================================================
-- TQ Academy — Formaciones externas del empleado
-- (másteres, cursos, talleres, certificaciones realizados fuera de la academia)
-- ============================================================

-- ── Tabla ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS formaciones_externas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN (
                    'master','postgrado','grado','curso','taller',
                    'certificacion','jornada','congreso','otro'
                  )),
  entidad         TEXT,                       -- Institución / escuela
  fecha_emision   DATE,
  horas           INTEGER CHECK (horas IS NULL OR horas >= 0),
  descripcion     TEXT,
  archivo_url     TEXT,                       -- URL pública al certificado
  archivo_path    TEXT,                       -- Path en bucket (para borrarlo)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS formaciones_externas_user_idx
  ON formaciones_externas(user_id);
CREATE INDEX IF NOT EXISTS formaciones_externas_user_fecha_idx
  ON formaciones_externas(user_id, fecha_emision DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION formaciones_externas_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_formaciones_externas_updated_at ON formaciones_externas;
CREATE TRIGGER trg_formaciones_externas_updated_at
  BEFORE UPDATE ON formaciones_externas
  FOR EACH ROW EXECUTE FUNCTION formaciones_externas_set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE formaciones_externas ENABLE ROW LEVEL SECURITY;

-- El propio usuario puede ver/crear/editar/borrar las suyas
DROP POLICY IF EXISTS "formaciones_select_own" ON formaciones_externas;
CREATE POLICY "formaciones_select_own" ON formaciones_externas
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "formaciones_insert_own" ON formaciones_externas;
CREATE POLICY "formaciones_insert_own" ON formaciones_externas
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "formaciones_update_own" ON formaciones_externas;
CREATE POLICY "formaciones_update_own" ON formaciones_externas
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "formaciones_delete_own" ON formaciones_externas;
CREATE POLICY "formaciones_delete_own" ON formaciones_externas
  FOR DELETE USING (user_id = auth.uid());

-- Admins / RRHH y manager pueden ver todas (consultivo)
DROP POLICY IF EXISTS "formaciones_select_admin" ON formaciones_externas;
CREATE POLICY "formaciones_select_admin" ON formaciones_externas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.rol IN ('super_admin','admin_rrhh','manager')
    )
  );

-- ── Bucket de archivos ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('formaciones-externas', 'formaciones-externas', true)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública (URLs aleatorias por usuario)
DROP POLICY IF EXISTS "formaciones_storage_read" ON storage.objects;
CREATE POLICY "formaciones_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'formaciones-externas');

-- Subida: cada usuario sólo en su carpeta {auth.uid}/...
DROP POLICY IF EXISTS "formaciones_storage_insert_own" ON storage.objects;
CREATE POLICY "formaciones_storage_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'formaciones-externas'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "formaciones_storage_update_own" ON storage.objects;
CREATE POLICY "formaciones_storage_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'formaciones-externas'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "formaciones_storage_delete_own" ON storage.objects;
CREATE POLICY "formaciones_storage_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'formaciones-externas'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
