-- ══════════════════════════════════════════════════════════════
-- 016_visita_respuesta_foto.sql
-- Permite adjuntar una foto a cada respuesta de incidencia
-- ══════════════════════════════════════════════════════════════

ALTER TABLE visita_respuestas
  ADD COLUMN IF NOT EXISTS foto_path TEXT,
  ADD COLUMN IF NOT EXISTS foto_url  TEXT;
