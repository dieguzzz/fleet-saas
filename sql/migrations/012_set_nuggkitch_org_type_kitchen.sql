-- 012 — Corrige el tipo de organización de "nugget kitchen"
--
-- La org se creó sin org_type explícito y cayó al default 'fleet', por lo que el
-- sidebar no mostraba las secciones de Productos/Cocina para su dueño. Es un
-- data-fix puntual.

UPDATE public.organizations SET org_type = 'kitchen' WHERE slug = 'nuggkitch';
