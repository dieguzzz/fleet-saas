-- 015 — Super admins pueden operar (leer y escribir) en cualquier organización
--
-- Un super admin que impersona una org de la que no es miembro no podía ESCRIBIR
-- (la RLS de escritura es por membership), p.ej. "no se puede crear producto" en
-- nugget kitchen. La RLS de Postgres no ve el contexto de impersonación (las
-- cookies/headers solo llegan a Next), así que el acceso es GLOBAL: el super
-- admin puede escribir en cualquier org. Cada acción vía la app queda trazada en
-- audit_logs (con su user_id y el org impersonado).
--
-- Cambio de mínima superficie: se modifican los DOS helpers SECURITY DEFINER en
-- vez de ~50 policies. Backward-compatible: is_super_admin() es false para el
-- resto de los usuarios, así que no cambia nada para ellos.
--   - get_user_org_ids(): cubre la Familia A de policies (= ANY(get_user_org_ids()))
--   - has_org_role():      cubre la Familia B de policies (has_org_role(org, roles))

CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF is_super_admin() THEN
    RETURN ARRAY(SELECT id FROM organizations);
  END IF;
  RETURN ARRAY(
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_org_role(org_id uuid, allowed_roles org_role[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF is_super_admin() THEN
    RETURN TRUE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id AND user_id = auth.uid() AND role = ANY(allowed_roles)
  );
END;
$function$;
