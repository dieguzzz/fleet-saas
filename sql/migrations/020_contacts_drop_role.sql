-- 020 — Borrar contacts.role
--
-- Complemento de la 019. Se separan porque entre una y otra hay que migrar el
-- código: borrar la columna antes deja el build roto durante varias tareas.
-- Las dos se aplican en el mismo deploy.
--
-- Este es un cambio incompatible hacia atrás: entre que corre y que el deploy
-- termina, la app vieja lee una columna que ya no existe. Aplicar junto con el
-- deploy, no antes.

ALTER TABLE contacts DROP COLUMN IF EXISTS role;

-- El NOT NULL vive acá y no en la 019 a propósito: recién ahora todo el código
-- escribe `roles` siempre, así que endurecer la columna no rompe ningún insert.
-- En la 019 habría vuelto obligatorio el tipo Insert generado y dejado
-- createContact sin compilar durante dos tareas.
ALTER TABLE contacts ALTER COLUMN roles SET NOT NULL;
