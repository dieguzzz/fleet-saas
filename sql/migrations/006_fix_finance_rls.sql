-- CRÍTICO: Sincronizar RLS de financial_transactions con la lógica de permissions.ts
-- permissions.ts define 'finances:view': ['admin', 'owner'] — la RLS debe reflejar esto.
-- La política anterior (fix-finance-rls.sql en raíz) permitía a TODOS los members ver finanzas.

DROP POLICY IF EXISTS "Members can view finances" ON financial_transactions;
DROP POLICY IF EXISTS "Admins+ can view finances" ON financial_transactions;

CREATE POLICY "Admins and owners can view finances"
  ON financial_transactions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
    OR is_super_admin()
  );

DROP POLICY IF EXISTS "Admins+ can create transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Collaborators+ can create transactions" ON financial_transactions;

CREATE POLICY "Admins and owners can create transactions"
  ON financial_transactions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
    OR is_super_admin()
  );

DROP POLICY IF EXISTS "Admins+ can update transactions" ON financial_transactions;

CREATE POLICY "Admins and owners can update transactions"
  ON financial_transactions FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
    OR is_super_admin()
  );

DROP POLICY IF EXISTS "Admins+ can delete transactions" ON financial_transactions;

CREATE POLICY "Admins and owners can delete transactions"
  ON financial_transactions FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
    OR is_super_admin()
  );
