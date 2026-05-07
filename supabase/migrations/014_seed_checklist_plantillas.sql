-- ══════════════════════════════════════════════════════════════
-- 014_seed_checklist_plantillas.sql
-- Hace nullable created_by (consistente con ON DELETE SET NULL)
-- e inserta las plantillas por defecto del checklist de visitas
-- ══════════════════════════════════════════════════════════════

-- Permitir plantillas de sistema sin usuario propietario
ALTER TABLE checklist_plantillas
  ALTER COLUMN created_by DROP NOT NULL;

-- ══════════════════════════════════════════════════════════════
-- Seed de plantillas por defecto (idempotente)
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  p_express   UUID;
  p_ampliada  UUID;
  sec         UUID;
BEGIN

  -- ── 1. VISITA EXPRESS ────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM checklist_plantillas WHERE nombre = 'Checklist Visita Express'
  ) THEN
    INSERT INTO checklist_plantillas (nombre, descripcion, activo, created_by)
    VALUES (
      'Checklist Visita Express',
      'Revisión rápida de los puntos clave de la tienda',
      TRUE, NULL
    ) RETURNING id INTO p_express;

    -- Imagen general
    INSERT INTO checklist_secciones (plantilla_id, nombre, orden)
    VALUES (p_express, 'Imagen general', 1) RETURNING id INTO sec;
    INSERT INTO checklist_items (seccion_id, texto, orden) VALUES
      (sec, 'Tienda ordenada y limpia',   1),
      (sec, 'Mostrador correcto',         2),
      (sec, 'Escaparate alineado',        3);

    -- Comunicación visual
    INSERT INTO checklist_secciones (plantilla_id, nombre, orden)
    VALUES (p_express, 'Comunicación visual', 2) RETURNING id INTO sec;
    INSERT INTO checklist_items (seccion_id, texto, orden) VALUES
      (sec, 'TV encendida',      1),
      (sec, 'Vídeo actualizado', 2);

    -- Equipo
    INSERT INTO checklist_secciones (plantilla_id, nombre, orden)
    VALUES (p_express, 'Equipo', 3) RETURNING id INTO sec;
    INSERT INTO checklist_items (seccion_id, texto, orden) VALUES
      (sec, 'Uniforme correcto',    1),
      (sec, 'Lanyard visible',      2),
      (sec, 'Actitud profesional',  3);

    -- Producto
    INSERT INTO checklist_secciones (plantilla_id, nombre, orden)
    VALUES (p_express, 'Producto', 4) RETURNING id INTO sec;
    INSERT INTO checklist_items (seccion_id, texto, orden) VALUES
      (sec, 'Vitrinas ordenadas',           1),
      (sec, 'Producto estratégico visible', 2);

    -- Operativa clave
    INSERT INTO checklist_secciones (plantilla_id, nombre, orden)
    VALUES (p_express, 'Operativa clave', 5) RETURNING id INTO sec;
    INSERT INTO checklist_items (seccion_id, texto, orden) VALUES
      (sec, 'Caja fuerte correcta',             1),
      (sec, 'Reservas / devoluciones al día',   2);

    -- Resultado visita
    INSERT INTO checklist_secciones (plantilla_id, nombre, orden)
    VALUES (p_express, 'Resultado visita', 6) RETURNING id INTO sec;
    INSERT INTO checklist_items (seccion_id, texto, orden) VALUES
      (sec, 'Todo correcto',             1),
      (sec, 'Ajustes menores',           2),
      (sec, 'Requiere visita ampliada',  3);
  END IF;

  -- ── 2. VISITA AMPLIADA ───────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM checklist_plantillas WHERE nombre = 'Checklist Visita Ampliada'
  ) THEN
    INSERT INTO checklist_plantillas (nombre, descripcion, activo, created_by)
    VALUES (
      'Checklist Visita Ampliada',
      'Auditoría completa de estándares, producto, equipo y operativa',
      TRUE, NULL
    ) RETURNING id INTO p_ampliada;

    -- Objetivo de la visita
    INSERT INTO checklist_secciones (plantilla_id, nombre, orden)
    VALUES (p_ampliada, 'Objetivo de la visita', 1) RETURNING id INTO sec;
    INSERT INTO checklist_items (seccion_id, texto, orden) VALUES
      (sec, 'Seguimiento general',      1),
      (sec, 'Organización',             2),
      (sec, 'Implantación campaña',     3),
      (sec, 'Equipo',                   4),
      (sec, 'Incidencias',              5),
      (sec, 'Auditoría de estándares',  6);

    -- Imagen, orden y seguridad
    INSERT INTO checklist_secciones (plantilla_id, nombre, orden)
    VALUES (p_ampliada, 'Imagen, orden y seguridad', 2) RETURNING id INTO sec;
    INSERT INTO checklist_items (seccion_id, texto, orden) VALUES
      (sec, 'Limpieza general',                   1),
      (sec, 'Mostrador ordenado',                 2),
      (sec, 'Almacén organizado',                 3),
      (sec, 'Caja fuerte revisada',               4),
      (sec, 'Protocolo apertura/cierre correcto', 5);

    -- Comunicación visual e imagen corporativa
    INSERT INTO checklist_secciones (plantilla_id, nombre, orden)
    VALUES (p_ampliada, 'Comunicación visual e imagen corporativa', 3) RETURNING id INTO sec;
    INSERT INTO checklist_items (seccion_id, texto, orden) VALUES
      (sec, 'TV encendida',                  1),
      (sec, 'Vídeo corporativo actualizado', 2),
      (sec, 'Uniforme correcto',             3),
      (sec, 'Lanyard visible',               4);

    -- Escaparate y campaña
    INSERT INTO checklist_secciones (plantilla_id, nombre, orden)
    VALUES (p_ampliada, 'Escaparate y campaña', 4) RETURNING id INTO sec;
    INSERT INTO checklist_items (seccion_id, texto, orden) VALUES
      (sec, 'Campaña implantada correctamente', 1),
      (sec, 'Cartelería actualizada',           2),
      (sec, 'Materiales en buen estado',        3),
      (sec, 'Iluminación correcta',             4);

    -- Vitrinas y producto
    INSERT INTO checklist_secciones (plantilla_id, nombre, orden)
    VALUES (p_ampliada, 'Vitrinas y producto', 5) RETURNING id INTO sec;
    INSERT INTO checklist_items (seccion_id, texto, orden) VALUES
      (sec, 'Orden correcto',      1),
      (sec, 'Rotación adecuada',   2),
      (sec, 'Exceso de mercancía', 3),
      (sec, 'Limpieza vitrinas',   4),
      (sec, 'Etiquetado correcto', 5);

    -- Operativa
    INSERT INTO checklist_secciones (plantilla_id, nombre, orden)
    VALUES (p_ampliada, 'Operativa', 6) RETURNING id INTO sec;
    INSERT INTO checklist_items (seccion_id, texto, orden) VALUES
      (sec, 'Reservas anuladas',                        1),
      (sec, 'Devoluciones VE',                          2),
      (sec, 'Productos defectuosos / Revisar pre-reserva', 3),
      (sec, 'Inventario correcto / En revisión',        4);

    -- Equipo y clima
    INSERT INTO checklist_secciones (plantilla_id, nombre, orden)
    VALUES (p_ampliada, 'Equipo y clima', 7) RETURNING id INTO sec;
    INSERT INTO checklist_items (seccion_id, texto, orden) VALUES
      (sec, 'Alineación con objetivos', 1),
      (sec, 'Roles claros',             2),
      (sec, 'Necesita seguimiento',     3);

    -- Acciones pendientes
    INSERT INTO checklist_secciones (plantilla_id, nombre, orden)
    VALUES (p_ampliada, 'Acciones pendientes', 8) RETURNING id INTO sec;
    INSERT INTO checklist_items (seccion_id, texto, orden) VALUES
      (sec, 'Acciones realizadas documentadas', 1),
      (sec, 'Responsable asignado',             2),
      (sec, 'Fecha límite establecida',         3);

  END IF;

END;
$$;
