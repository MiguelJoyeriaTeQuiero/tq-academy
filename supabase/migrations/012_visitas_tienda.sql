-- ══════════════════════════════════════════════════════════════
-- 012_visitas_tienda.sql
-- Checklist de visitas a tienda para admins
-- ══════════════════════════════════════════════════════════════

-- ── Plantillas de checklist ────────────────────────────────────
CREATE TABLE checklist_plantillas (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       TEXT        NOT NULL,
  descripcion  TEXT,
  activo       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_by   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Secciones de plantilla ─────────────────────────────────────
CREATE TABLE checklist_secciones (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  plantilla_id UUID        NOT NULL REFERENCES checklist_plantillas(id) ON DELETE CASCADE,
  nombre       TEXT        NOT NULL,
  orden        SMALLINT    NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Ítems de cada sección ──────────────────────────────────────
CREATE TABLE checklist_items (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  seccion_id  UUID        NOT NULL REFERENCES checklist_secciones(id) ON DELETE CASCADE,
  texto       TEXT        NOT NULL,
  orden       SMALLINT    NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Visitas a tienda ───────────────────────────────────────────
CREATE TABLE visitas_tienda (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tienda_id            UUID        NOT NULL REFERENCES tiendas(id),
  admin_id             UUID        NOT NULL REFERENCES auth.users(id),
  plantilla_id         UUID        NOT NULL REFERENCES checklist_plantillas(id),
  fecha_visita         DATE        NOT NULL DEFAULT CURRENT_DATE,
  estado               TEXT        NOT NULL DEFAULT 'en_curso'
                                   CHECK (estado IN ('en_curso', 'completada')),
  notas_generales      TEXT,
  requiere_seguimiento BOOLEAN     NOT NULL DEFAULT FALSE,
  proxima_visita       DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Respuestas por ítem ────────────────────────────────────────
CREATE TABLE visita_respuestas (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  visita_id  UUID        NOT NULL REFERENCES visitas_tienda(id) ON DELETE CASCADE,
  item_id    UUID        NOT NULL REFERENCES checklist_items(id),
  estado     TEXT        CHECK (estado IN ('ok', 'incidencia', 'no_aplica')),
  notas      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (visita_id, item_id)
);

-- ── Adjuntos (fotos / vídeos) por visita ──────────────────────
CREATE TABLE visita_adjuntos (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  visita_id     UUID        NOT NULL REFERENCES visitas_tienda(id) ON DELETE CASCADE,
  tipo          TEXT        NOT NULL CHECK (tipo IN ('imagen', 'video')),
  storage_path  TEXT        NOT NULL,
  url           TEXT        NOT NULL,
  nombre        TEXT,
  tamano_bytes  INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Storage bucket ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('visitas-media', 'visitas-media', false)
ON CONFLICT DO NOTHING;

-- ── Índices ────────────────────────────────────────────────────
CREATE INDEX idx_visitas_tienda_id     ON visitas_tienda(tienda_id);
CREATE INDEX idx_visitas_admin_id      ON visitas_tienda(admin_id);
CREATE INDEX idx_visitas_estado        ON visitas_tienda(estado);
CREATE INDEX idx_visitas_proxima       ON visitas_tienda(proxima_visita) WHERE proxima_visita IS NOT NULL;
CREATE INDEX idx_respuestas_visita     ON visita_respuestas(visita_id);
CREATE INDEX idx_respuestas_estado     ON visita_respuestas(estado);
CREATE INDEX idx_adjuntos_visita       ON visita_adjuntos(visita_id);
CREATE INDEX idx_secciones_plantilla   ON checklist_secciones(plantilla_id, orden);
CREATE INDEX idx_items_seccion         ON checklist_items(seccion_id, orden);

-- ── Triggers updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION tq_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER visitas_tienda_updated_at
  BEFORE UPDATE ON visitas_tienda
  FOR EACH ROW EXECUTE FUNCTION tq_set_updated_at();

CREATE TRIGGER visita_respuestas_updated_at
  BEFORE UPDATE ON visita_respuestas
  FOR EACH ROW EXECUTE FUNCTION tq_set_updated_at();

CREATE TRIGGER checklist_plantillas_updated_at
  BEFORE UPDATE ON checklist_plantillas
  FOR EACH ROW EXECUTE FUNCTION tq_set_updated_at();

-- ── RLS ────────────────────────────────────────────────────────
ALTER TABLE checklist_plantillas ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_secciones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas_tienda       ENABLE ROW LEVEL SECURITY;
ALTER TABLE visita_respuestas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE visita_adjuntos      ENABLE ROW LEVEL SECURITY;

-- Plantillas: todos authenticated leen, solo admins escriben
CREATE POLICY "plantillas_select" ON checklist_plantillas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "plantillas_write" ON checklist_plantillas
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND rol IN ('super_admin','admin_rrhh')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND rol IN ('super_admin','admin_rrhh')
  ));

CREATE POLICY "secciones_select" ON checklist_secciones
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "secciones_write" ON checklist_secciones
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND rol IN ('super_admin','admin_rrhh')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND rol IN ('super_admin','admin_rrhh')
  ));

CREATE POLICY "items_select" ON checklist_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "items_write" ON checklist_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND rol IN ('super_admin','admin_rrhh')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND rol IN ('super_admin','admin_rrhh')
  ));

-- Visitas: admins todo, managers ven las completadas de su tienda
CREATE POLICY "visitas_admin" ON visitas_tienda
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND rol IN ('super_admin','admin_rrhh')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND rol IN ('super_admin','admin_rrhh')
  ));

CREATE POLICY "visitas_manager_read" ON visitas_tienda
  FOR SELECT TO authenticated
  USING (
    estado = 'completada'
    AND tienda_id IN (
      SELECT tienda_id FROM profiles
      WHERE id = auth.uid() AND rol = 'manager'
    )
  );

-- Respuestas: admins todo, managers leen las de visitas completadas de su tienda
CREATE POLICY "respuestas_admin" ON visita_respuestas
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND rol IN ('super_admin','admin_rrhh')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND rol IN ('super_admin','admin_rrhh')
  ));

CREATE POLICY "respuestas_manager_read" ON visita_respuestas
  FOR SELECT TO authenticated
  USING (
    visita_id IN (
      SELECT v.id FROM visitas_tienda v
      JOIN profiles p ON p.tienda_id = v.tienda_id
      WHERE p.id = auth.uid() AND p.rol = 'manager'
        AND v.estado = 'completada'
    )
  );

-- Adjuntos: solo admins
CREATE POLICY "adjuntos_admin" ON visita_adjuntos
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND rol IN ('super_admin','admin_rrhh')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND rol IN ('super_admin','admin_rrhh')
  ));

-- Storage policies
CREATE POLICY "visitas_media_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'visitas-media'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid()
      AND rol IN ('super_admin','admin_rrhh')
    )
  );

CREATE POLICY "visitas_media_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'visitas-media'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid()
      AND rol IN ('super_admin','admin_rrhh')
    )
  );

CREATE POLICY "visitas_media_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'visitas-media'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid()
      AND rol IN ('super_admin','admin_rrhh')
    )
  );
