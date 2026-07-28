-- 018 — Fecha, carga, cliente y valor por tramo de viaje
--
-- Contexto:
--   Un viaje redondo (migración 010) ya modela ida y vuelta como dos filas
--   independientes de `trips`. Esta migración agrega, a nivel de tramo, lo que
--   hace falta para planificar y cobrar cada uno por separado: qué carga, para
--   qué cliente, a qué fecha y por cuánto.
--
-- Por qué `trip_date` es una columna separada de `started_at` / `ended_at`:
--   `started_at` y `ended_at` registran cuándo el tramo arrancó y terminó
--   *de verdad* — quedan NULL hasta que el viaje pasa a en progreso / completado.
--   `trip_date` es la fecha operativa que el usuario declara al planificar el
--   viaje, antes de que exista ningún timestamp real. Sin esta columna, un
--   viaje planificado para el jueves que viene no tiene ninguna fecha propia
--   que mostrar en la lista ni con la que ordenar.
--
-- Por qué `invoice_id` es una columna separada de `start_invoice_url` /
-- `end_invoice_url`:
--   Esas dos columnas guardan comprobantes escaneados que el conductor adjunta
--   (fotos o PDFs sueltos, sin relación con el sistema de facturación). `invoice_id`
--   en cambio referencia una factura real generada por el módulo de finanzas
--   (tabla `invoices`), con numeración, cliente y monto propios. Son cosas
--   distintas: un tramo puede tener un comprobante adjunto y no tener factura
--   del sistema, o viceversa.
--
-- Columnas aditivas y nullable, backfill idempotente vía WHERE, constraint e
-- índices con guardas IF NOT EXISTS → seguras de aplicar en cualquier orden
-- respecto al deploy y de re-ejecutar sin romper nada.

ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_date date;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS cargo text;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_value numeric(12,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL;

-- Backfill de los viajes existentes antes de exigir NOT NULL. El WHERE hace
-- este UPDATE idempotente: en un replay, las filas que ya tienen trip_date no
-- se vuelven a tocar.
UPDATE trips
SET trip_date = COALESCE(started_at::date, created_at::date, CURRENT_DATE)
WHERE trip_date IS NULL;

ALTER TABLE trips ALTER COLUMN trip_date SET NOT NULL;
ALTER TABLE trips ALTER COLUMN trip_date SET DEFAULT CURRENT_DATE;

ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_trip_value_non_negative;
ALTER TABLE trips ADD CONSTRAINT trips_trip_value_non_negative
  CHECK (trip_value IS NULL OR trip_value >= 0);

-- Orden de la lista de viajes.
CREATE INDEX IF NOT EXISTS trips_org_date_idx ON trips (organization_id, trip_date DESC);

-- Búsqueda de tramos por factura vinculada.
CREATE INDEX IF NOT EXISTS trips_invoice_idx ON trips (invoice_id) WHERE invoice_id IS NOT NULL;
