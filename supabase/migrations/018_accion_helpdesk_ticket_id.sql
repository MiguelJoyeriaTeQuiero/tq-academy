-- Añade referencia al ticket de helpdesk en cada acción correctiva de visita.
-- Permite sincronización bidireccional: TQ Academy crea el ticket en TQ-HELP
-- y TQ-HELP notifica via webhook cuando el ticket se resuelve/cierra.

ALTER TABLE acciones_visita
  ADD COLUMN IF NOT EXISTS helpdesk_ticket_id TEXT;

-- Índice para búsquedas rápidas por ticket ID (el webhook recibe este valor)
CREATE INDEX IF NOT EXISTS idx_acciones_visita_helpdesk_ticket_id
  ON acciones_visita(helpdesk_ticket_id)
  WHERE helpdesk_ticket_id IS NOT NULL;
