-- ──────────────────────────────────────────────────────────
-- 008 · Geolocalización de tiendas + seed con red Te Quiero
--      en Tenerife (16 tiendas, fuente: Google My Maps).
-- ──────────────────────────────────────────────────────────

ALTER TABLE tiendas
  ADD COLUMN IF NOT EXISTS direccion TEXT,
  ADD COLUMN IF NOT EXISTS lat NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS lng NUMERIC(9, 6);

-- Índice único case-insensitive sobre el nombre para upsert seguro.
CREATE UNIQUE INDEX IF NOT EXISTS uq_tiendas_nombre_lower
  ON tiendas (LOWER(nombre));

-- ── Seed idempotente ───────────────────────────────────────
INSERT INTO tiendas (nombre, isla, lat, lng, activo) VALUES
  ('Te Quiero Ofra',            'Tenerife', 28.452765, -16.285479, TRUE),
  ('Te Quiero Taco',            'Tenerife', 28.444447, -16.300407, TRUE),
  ('Te Quiero La Laguna',       'Tenerife', 28.483795, -16.317051, TRUE),
  ('Te Quiero La Salud',        'Tenerife', 28.471391, -16.271912, TRUE),
  ('Te Quiero Chicharro',       'Tenerife', 28.466562, -16.251211, TRUE),
  ('Te Quiero Cupido',          'Tenerife', 28.414597, -16.551018, TRUE),
  ('Te Quiero Puerto De La Cruz','Tenerife', 28.413520, -16.555580, TRUE),
  ('Te Quiero San Agustín',     'Tenerife', 28.391131, -16.521244, TRUE),
  ('Te Quiero Los Realejos',    'Tenerife', 28.379755, -16.584174, TRUE),
  ('Te Quiero Las Galletas',    'Tenerife', 28.008748, -16.657588, TRUE),
  ('Te Quiero Los Gigantes',    'Tenerife', 28.239351, -16.840797, TRUE),
  ('Te Quiero San Isidro',      'Tenerife', 28.077655, -16.557550, TRUE),
  ('Te Quiero Guargacho',       'Tenerife', 28.038949, -16.631451, TRUE),
  ('Te Quiero Candelaria',      'Tenerife', 28.355458, -16.371371, TRUE),
  ('Te Quiero Galeón',          'Tenerife', 28.117240, -16.730651, TRUE),
  ('Te Quiero La Cuesta',       'Tenerife', 28.468483, -16.286532, TRUE)
ON CONFLICT (LOWER(nombre)) DO UPDATE SET
  isla = EXCLUDED.isla,
  lat  = EXCLUDED.lat,
  lng  = EXCLUDED.lng;
