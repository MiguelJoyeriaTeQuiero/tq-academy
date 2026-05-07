-- Añadir tiempo límite a exámenes mensuales
ALTER TABLE examenes_mensuales
  ADD COLUMN IF NOT EXISTS tiempo_limite_min integer NULL;
