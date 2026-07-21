-- 016 — Buckets privados: trip-documents + terrain-receipts
--
-- Contienen facturas de viaje/combustible y comprobantes de pago de terreno
-- (datos financieros). Estaban públicos: cualquiera con la URL accedía sin login.
-- Se pasan a privados con SELECT org-scoped; la app los sirve por el proxy
-- autenticado /api/pdf-proxy (que descarga con la sesión del usuario).
-- El primer segmento del path es el organization_id. get_user_org_ids() incluye
-- todas las orgs para super admins, así que ellos también pueden verlos.
--
-- ⚠️ DEPLOY-ORDERING: aplicar DESPUÉS del deploy con el código que guarda el
-- path y usa el proxy. Si se aplica antes, el código viejo (getPublicUrl) deja
-- de poder ver los adjuntos.

UPDATE storage.buckets SET public = false WHERE id IN ('trip-documents', 'terrain-receipts');

DROP POLICY IF EXISTS "Org members can view trip documents" ON storage.objects;
CREATE POLICY "Org members can view trip documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'trip-documents'
  AND ((storage.foldername(name))[1])::uuid = ANY(get_user_org_ids())
);

DROP POLICY IF EXISTS "Org members can view terrain receipts" ON storage.objects;
CREATE POLICY "Org members can view terrain receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'terrain-receipts'
  AND ((storage.foldername(name))[1])::uuid = ANY(get_user_org_ids())
);
