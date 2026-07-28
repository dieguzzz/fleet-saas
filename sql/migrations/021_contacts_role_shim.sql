-- 021 — Shim temporal: convivencia de `role` y `roles`
--
-- Las migraciones 019 y 020 se aplicaron a producción ANTES de deployar el
-- código que las acompaña. El código en producción todavía lee y escribe
-- `contacts.role`, que la 020 borró, así que el alta de contactos y los
-- selectores de factura quedaron rotos.
--
-- Este shim devuelve `role` y lo mantiene sincronizado con `roles` en los dos
-- sentidos, para que el código viejo y el nuevo funcionen a la vez.
-- La migración 022 lo retira, y se aplica JUNTO con el deploy.

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS role text;

UPDATE contacts SET role = roles[1] WHERE role IS NULL AND roles IS NOT NULL;

CREATE OR REPLACE FUNCTION contacts_sync_role_roles() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  -- Código viejo actualizando: tocó `role` y no `roles`, así que `roles` lo sigue.
  IF TG_OP = 'UPDATE'
     AND NEW.role IS DISTINCT FROM OLD.role
     AND NEW.roles IS NOT DISTINCT FROM OLD.roles THEN
    NEW.roles := ARRAY[COALESCE(NULLIF(NEW.role, ''), 'other')];
  END IF;

  -- Insert del código viejo: no manda `roles`. Se completa desde `role` antes
  -- de que se evalúe el NOT NULL, porque este trigger es BEFORE.
  IF NEW.roles IS NULL OR cardinality(NEW.roles) = 0 THEN
    NEW.roles := ARRAY[COALESCE(NULLIF(NEW.role, ''), 'other')];
  END IF;

  -- `role` siempre refleja el primer rol, para que el código viejo lo lea bien.
  NEW.role := NEW.roles[1];
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contacts_sync_role_roles_trg ON contacts;
CREATE TRIGGER contacts_sync_role_roles_trg
BEFORE INSERT OR UPDATE ON contacts
FOR EACH ROW EXECUTE FUNCTION contacts_sync_role_roles();
