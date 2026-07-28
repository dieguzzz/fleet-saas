-- 019 — Un contacto puede tener varios roles
--
-- `contacts.role` era un string único: un contacto era cliente o proveedor,
-- nunca las dos cosas. La consecuencia era cargar la misma persona dos veces.
--
-- Esta migración agrega `roles text[]` y backfillea desde `role`, pero NO borra
-- `role`: eso lo hace la 020, después de que el código haya migrado. Partirlo en
-- dos mantiene el build compilando entre una y otra.

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS roles text[];

-- El backfill va detrás de un IF EXISTS para que la migración sea replayable:
-- una vez aplicada la 020, `role` ya no existe y esta sentencia se saltea.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'role'
  ) THEN
    UPDATE contacts
    SET roles = ARRAY[COALESCE(NULLIF(role, ''), 'other')]
    WHERE roles IS NULL;
  END IF;
END $$;

ALTER TABLE contacts ALTER COLUMN roles SET NOT NULL;

-- cardinality, no array_length: array_length('{}', 1) devuelve NULL y un CHECK
-- que evalúa a NULL pasa, con lo cual no impediría un array vacío.
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_roles_no_vacio;
ALTER TABLE contacts ADD CONSTRAINT contacts_roles_no_vacio
  CHECK (cardinality(roles) >= 1);

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_roles_conocidos;
ALTER TABLE contacts ADD CONSTRAINT contacts_roles_conocidos
  CHECK (roles <@ ARRAY['customer','supplier','mechanic','workshop',
                        'tow_truck','tire_service','insurance','other','driver']::text[]);
