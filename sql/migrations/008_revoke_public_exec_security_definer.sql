-- Aplicada en producción.
-- Revoca EXECUTE de PUBLIC en funciones SECURITY DEFINER y otorga explícitamente
-- solo a los roles que correspondan.

REVOKE EXECUTE ON FUNCTION public.create_organization_for_user(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization_for_user(text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_next_invoice_number(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_next_invoice_number(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_trip_financials(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_trip_financials(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_org_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_org_ids() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_org_role(uuid, public.org_role[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_org_role(uuid, public.org_role[]) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_first_org_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_first_org_member(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- handle_new_user es trigger interno — nadie debe invocarla via RPC
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- AMD: pre-auth, requiere acceso anon
REVOKE EXECUTE ON FUNCTION public.is_amd_setup() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_amd_setup() TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.setup_amd_user(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_amd_user(text, text) TO anon, authenticated;
