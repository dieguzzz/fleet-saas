-- Aplicada en producción.
-- Endurece advisories de seguridad pre-existentes detectados por el linter.

-- ============================================================
-- 1. RLS en invoice_counters
-- ============================================================
ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. search_path explícito en funciones existentes
-- ============================================================
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.is_super_admin() SET search_path = public;
ALTER FUNCTION public.has_org_role(uuid, public.org_role[]) SET search_path = public;
ALTER FUNCTION public.get_user_org_ids() SET search_path = public;
ALTER FUNCTION public.is_first_org_member(uuid) SET search_path = public;

-- ============================================================
-- 3. Storage buckets: eliminar policies SELECT que permiten listing
-- ============================================================
DROP POLICY IF EXISTS "Public read invoice attachments" ON storage.objects;
DROP POLICY IF EXISTS "terrain-receipts: public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read trip-documents" ON storage.objects;
