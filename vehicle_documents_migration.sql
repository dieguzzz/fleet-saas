-- ================================================================
-- Migración: Documentos con vencimiento de vehículos
-- Ejecutar en el SQL Editor del Dashboard de Supabase
-- ================================================================

CREATE TYPE vehicle_document_type AS ENUM (
  'insurance',
  'vtv',
  'registration',
  'other'
);

CREATE TABLE vehicle_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  document_type   vehicle_document_type NOT NULL,
  label           TEXT NOT NULL,
  expiry_date     DATE NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org vehicle documents"
  ON vehicle_documents FOR SELECT
  USING (organization_id = ANY(get_user_org_ids()));

CREATE POLICY "Members can insert vehicle documents"
  ON vehicle_documents FOR INSERT
  WITH CHECK (organization_id = ANY(get_user_org_ids()));

CREATE POLICY "Members can update vehicle documents"
  ON vehicle_documents FOR UPDATE
  USING (organization_id = ANY(get_user_org_ids()));

CREATE POLICY "Members can delete vehicle documents"
  ON vehicle_documents FOR DELETE
  USING (organization_id = ANY(get_user_org_ids()));

CREATE INDEX vehicle_documents_org_idx    ON vehicle_documents(organization_id);
CREATE INDEX vehicle_documents_vehicle_idx ON vehicle_documents(vehicle_id);
CREATE INDEX vehicle_documents_expiry_idx  ON vehicle_documents(expiry_date);
