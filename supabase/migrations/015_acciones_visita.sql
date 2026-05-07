-- ══════════════════════════════════════════════════════════════
-- 015_acciones_visita.sql
-- Plan de acción post-visita: tabla de acciones pendientes
-- ══════════════════════════════════════════════════════════════

CREATE TABLE acciones_visita (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visita_id     UUID NOT NULL REFERENCES visitas_tienda(id) ON DELETE CASCADE,
  respuesta_id  UUID REFERENCES visita_respuestas(id) ON DELETE SET NULL,
  titulo        TEXT NOT NULL,
  responsable_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_limite  DATE,
  estado        TEXT NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
  notas         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_acciones_visita_visita ON acciones_visita(visita_id);
CREATE INDEX idx_acciones_visita_estado ON acciones_visita(estado) WHERE estado != 'completada';

CREATE TRIGGER acciones_visita_updated_at
  BEFORE UPDATE ON acciones_visita
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE acciones_visita ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acciones_select_auth" ON acciones_visita
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "acciones_insert_auth" ON acciones_visita
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "acciones_update_auth" ON acciones_visita
  FOR UPDATE USING (auth.uid() IS NOT NULL);
