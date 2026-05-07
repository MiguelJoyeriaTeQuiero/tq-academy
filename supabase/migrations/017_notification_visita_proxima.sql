-- Add visita_proxima preference to notification_preferences
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS visita_proxima BOOLEAN NOT NULL DEFAULT TRUE;

-- Dedup index specific to visita notifications (keyed on visita_id, not curso_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedup_visita
  ON notifications(usuario_id, tipo, (metadata->>'visita_id'))
  WHERE status = 'pending' AND tipo = 'visita_proxima';
