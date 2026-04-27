-- ──────────────────────────────────────────────────────────
-- 007 · Texto pre-extraído de lecciones PDF para acelerar
--      el chatbot (evita que Anthropic re-parsee el PDF
--      en cada pregunta).
-- ──────────────────────────────────────────────────────────

ALTER TABLE lecciones
  ADD COLUMN IF NOT EXISTS contenido_texto TEXT,
  ADD COLUMN IF NOT EXISTS contenido_texto_actualizado_en TIMESTAMPTZ;

-- Índice GIN para futuras búsquedas full-text (opcional pero barato).
CREATE INDEX IF NOT EXISTS idx_lecciones_contenido_texto_fts
  ON lecciones
  USING GIN (to_tsvector('spanish', COALESCE(contenido_texto, '')));

COMMENT ON COLUMN lecciones.contenido_texto IS
  'Texto plano extraído del PDF (lecciones tipo=pdf). Lo usa el chatbot como contexto.';
