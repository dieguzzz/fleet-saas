-- 014 — Adjuntos de factura: bucket privado + SELECT org-scoped
--
-- El bucket 'invoice-attachments' estaba marcado public=true, por lo que sus
-- objetos (PDFs con datos personales) eran accesibles por cualquiera con la URL
-- '/object/public/...' sin autenticación. Se pasa a privado y se agrega una
-- policy SELECT org-scoped: solo los miembros de la organización pueden leer los
-- archivos (el primer segmento del path es el organization_id). La app los sirve
-- vía el proxy autenticado /api/pdf-proxy, que descarga con la sesión del usuario.
--
-- Las policies INSERT/UPDATE ya eran org-scoped; solo faltaba cerrar la lectura.

UPDATE storage.buckets SET public = false WHERE id = 'invoice-attachments';

DROP POLICY IF EXISTS "Org members can view invoice attachments" ON storage.objects;
CREATE POLICY "Org members can view invoice attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoice-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);
