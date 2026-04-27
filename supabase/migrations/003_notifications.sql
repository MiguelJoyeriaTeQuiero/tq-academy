-- ============================================================
-- TQ Academy — Fase 3: Sistema de Notificaciones (outbox)
-- ============================================================
-- Diseño: outbox pattern. La aplicación encola notificaciones en
-- `notifications` (status = 'pending'). Un dispatcher externo (o
-- endpoint /api/notifications/dispatch) las consume y delega en
-- un EmailProvider. Esto permite operar sin proveedor de email.
-- ============================================================

-- ── PREFERENCIAS POR USUARIO ────────────────────────────────

CREATE TABLE notification_preferences (
  usuario_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  curso_asignado        BOOLEAN NOT NULL DEFAULT TRUE,
  deadline_proximo      BOOLEAN NOT NULL DEFAULT TRUE,
  curso_completado      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Crear preferencias automáticamente al crear profile
CREATE OR REPLACE FUNCTION public.create_notification_preferences()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notification_preferences (usuario_id)
  VALUES (NEW.id)
  ON CONFLICT (usuario_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_create_notification_prefs
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_notification_preferences();

-- Backfill para usuarios existentes
INSERT INTO notification_preferences (usuario_id)
SELECT id FROM profiles
ON CONFLICT (usuario_id) DO NOTHING;

-- ── OUTBOX DE NOTIFICACIONES ────────────────────────────────

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL, -- 'curso_asignado' | 'deadline_proximo' | 'curso_completado'
  canal           TEXT NOT NULL DEFAULT 'email', -- futuro: 'push', 'in_app'
  destinatario    TEXT NOT NULL, -- email en el momento de encolar (snapshot)
  subject         TEXT NOT NULL,
  body_html       TEXT NOT NULL,
  body_text       TEXT NOT NULL,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb, -- { curso_id, asignacion_id, ... }
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'sent' | 'failed' | 'skipped'
  scheduled_for   TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at         TIMESTAMPTZ,
  attempts        INTEGER NOT NULL DEFAULT 0,
  last_error      TEXT,
  provider        TEXT, -- nombre del provider que la envió
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notifications_status_check
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped'))
);

CREATE INDEX idx_notifications_pending
  ON notifications(status, scheduled_for)
  WHERE status = 'pending';
CREATE INDEX idx_notifications_usuario
  ON notifications(usuario_id, created_at DESC);
CREATE INDEX idx_notifications_tipo
  ON notifications(tipo, created_at DESC);

-- Deduplicación: una notificación del mismo tipo por (usuario, curso)
-- sólo puede existir una vez pendiente. Evita duplicar recordatorios.
CREATE UNIQUE INDEX idx_notifications_dedup_pending
  ON notifications(usuario_id, tipo, (metadata->>'curso_id'))
  WHERE status = 'pending' AND metadata ? 'curso_id';

-- ── RLS ─────────────────────────────────────────────────────

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications            ENABLE ROW LEVEL SECURITY;

-- preferences: cada usuario ve/edita las suyas; admin ve todas
CREATE POLICY "prefs_select" ON notification_preferences
  FOR SELECT USING (
    auth.uid() = usuario_id
    OR get_user_rol() IN ('super_admin', 'admin_rrhh')
  );
CREATE POLICY "prefs_update_own" ON notification_preferences
  FOR UPDATE USING (
    auth.uid() = usuario_id
    OR get_user_rol() IN ('super_admin', 'admin_rrhh')
  );
CREATE POLICY "prefs_insert" ON notification_preferences
  FOR INSERT WITH CHECK (
    auth.uid() = usuario_id
    OR get_user_rol() IN ('super_admin', 'admin_rrhh')
  );

-- notifications: el usuario ve las suyas; admin ve todo; inserción
-- se hace siempre desde código de servidor con service role o bajo auth.
CREATE POLICY "notif_select" ON notifications
  FOR SELECT USING (
    auth.uid() = usuario_id
    OR get_user_rol() IN ('super_admin', 'admin_rrhh')
  );
CREATE POLICY "notif_insert_auth" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "notif_update_admin" ON notifications
  FOR UPDATE USING (get_user_rol() IN ('super_admin', 'admin_rrhh'));
