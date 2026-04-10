-- 1. Agregar columna attachment_url a la tabla invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- 2. Crear el bucket de Supabase Storage para adjuntos de facturas
-- Ejecutar esto en el Dashboard de Supabase > Storage > New Bucket
-- Nombre: invoice-attachments
-- Public: true (para poder mostrar imágenes directamente)

-- 3. Política de acceso al bucket (ejecutar en SQL Editor de Supabase)
-- Permite a usuarios autenticados subir archivos a su organización
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-attachments', 'invoice-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Política: solo miembros de la org pueden subir
CREATE POLICY "Org members can upload invoice attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoice-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM organization_members WHERE user_id = auth.uid()
  )
);

-- Política: lectura pública (el bucket ya es público, esta es de refuerzo)
CREATE POLICY "Public read invoice attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoice-attachments');

-- Política: solo el uploader/miembro puede actualizar/eliminar
CREATE POLICY "Org members can update invoice attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'invoice-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM organization_members WHERE user_id = auth.uid()
  )
);
