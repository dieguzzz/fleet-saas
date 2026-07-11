-- 009 — Provisión versionada de buckets de Storage + hardening de trip-documents
--
-- Contexto:
--   Solo `invoice-attachments` (migración 004) estaba provisionado por migraciones.
--   Los buckets `avatars`, `org-logos`, `terrain-receipts` y `trip-documents` se
--   habían creado a mano en el Dashboard de Supabase, por lo que un entorno nuevo
--   (staging/fresh) no los tenía. Esta migración los deja reproducibles desde el repo.
--
--   Además, las políticas de `trip-documents` eran permisivas (cualquier usuario
--   autenticado podía escribir en cualquier ruta). Se endurecen a org-scoped,
--   igual que el resto de los buckets: el primer segmento del path debe ser un
--   organization_id al que pertenece el usuario.
--
-- Idempotente: usa ON CONFLICT y DROP POLICY IF EXISTS, seguro de re-ejecutar.
--
-- IMPORTANTe (orden de despliegue): el hardening de `trip-documents` asume que el
-- código sube a rutas `${orgId}/...`. Aplicar esta migración DESPUÉS de desplegar
-- el código que usa esas rutas (TripForm, CompleteTripButton, NewFuelRecordModal).

-- ─────────────────────────────────────────────────────────────
-- 1. Buckets (todos públicos, para servir vía getPublicUrl)
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('org-logos', 'org-logos', true),
  ('terrain-receipts', 'terrain-receipts', true),
  ('trip-documents', 'trip-documents', true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 2. avatars — cada usuario gestiona su propia carpeta (auth.uid)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO public
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO public
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO public
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- ─────────────────────────────────────────────────────────────
-- 3. org-logos — solo owners/admins de la org
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Org admins can upload logo" ON storage.objects;
CREATE POLICY "Org admins can upload logo"
ON storage.objects FOR INSERT TO public
WITH CHECK (
  bucket_id = 'org-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner'::org_role, 'admin'::org_role)
  )
);

DROP POLICY IF EXISTS "Org admins can update logo" ON storage.objects;
CREATE POLICY "Org admins can update logo"
ON storage.objects FOR UPDATE TO public
USING (
  bucket_id = 'org-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner'::org_role, 'admin'::org_role)
  )
);

DROP POLICY IF EXISTS "Org admins can delete logo" ON storage.objects;
CREATE POLICY "Org admins can delete logo"
ON storage.objects FOR DELETE TO public
USING (
  bucket_id = 'org-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner'::org_role, 'admin'::org_role)
  )
);

DROP POLICY IF EXISTS "Org logos are publicly viewable" ON storage.objects;
CREATE POLICY "Org logos are publicly viewable"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'org-logos');

-- ─────────────────────────────────────────────────────────────
-- 4. terrain-receipts — miembros de la org (get_user_org_ids)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "terrain-receipts: org members can upload" ON storage.objects;
CREATE POLICY "terrain-receipts: org members can upload"
ON storage.objects FOR INSERT TO public
WITH CHECK (
  bucket_id = 'terrain-receipts'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations WHERE id = ANY (get_user_org_ids())
  )
);

DROP POLICY IF EXISTS "terrain-receipts: org members can update" ON storage.objects;
CREATE POLICY "terrain-receipts: org members can update"
ON storage.objects FOR UPDATE TO public
USING (
  bucket_id = 'terrain-receipts'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations WHERE id = ANY (get_user_org_ids())
  )
);

DROP POLICY IF EXISTS "terrain-receipts: org members can delete" ON storage.objects;
CREATE POLICY "terrain-receipts: org members can delete"
ON storage.objects FOR DELETE TO public
USING (
  bucket_id = 'terrain-receipts'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations WHERE id = ANY (get_user_org_ids())
  )
);

-- ─────────────────────────────────────────────────────────────
-- 5. trip-documents — HARDENING: reemplaza políticas permisivas por org-scoped
--    (el path debe empezar con el organization_id del usuario)
-- ─────────────────────────────────────────────────────────────
-- Quitar las políticas permisivas anteriores
DROP POLICY IF EXISTS "Allow authenticated upload trip-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update trip-documents" ON storage.objects;

DROP POLICY IF EXISTS "trip-documents: org members can upload" ON storage.objects;
CREATE POLICY "trip-documents: org members can upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'trip-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM organization_members WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "trip-documents: org members can update" ON storage.objects;
CREATE POLICY "trip-documents: org members can update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'trip-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM organization_members WHERE user_id = auth.uid()
  )
);
