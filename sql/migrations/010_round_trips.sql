-- 010 — Soporte de viajes ida y regreso (dos tramos vinculados)
--
-- Un viaje redondo se modela como DOS filas de `trips` independientes (cada una
-- con su estado, factura y gastos), vinculadas por:
--   - round_trip_group_id: uuid compartido por ambos tramos (NULL en viajes de un tramo)
--   - leg: 'outbound' (ida) | 'return' (vuelta) (NULL en viajes de un tramo)
--
-- Columnas aditivas y nullable → seguras de aplicar en cualquier orden respecto al deploy.

ALTER TABLE trips ADD COLUMN IF NOT EXISTS round_trip_group_id uuid;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS leg text;

ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_leg_check;
ALTER TABLE trips ADD CONSTRAINT trips_leg_check CHECK (leg IN ('outbound', 'return'));

CREATE INDEX IF NOT EXISTS idx_trips_round_trip_group ON trips (round_trip_group_id);
