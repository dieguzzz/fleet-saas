-- 022 — Retirar el shim de convivencia
--
-- Se aplica JUNTO con el deploy del código que usa `roles`. A partir de ese
-- momento nada lee ni escribe `contacts.role`, así que el trigger y la columna
-- sobran. Este archivo es el que cierra la ventana que abrió el 021.

DROP TRIGGER IF EXISTS contacts_sync_role_roles_trg ON contacts;
DROP FUNCTION IF EXISTS contacts_sync_role_roles();
ALTER TABLE contacts DROP COLUMN IF EXISTS role;
