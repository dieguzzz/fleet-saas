-- Allow all organization members to VIEW financial transactions
DROP POLICY IF EXISTS "Admins+ can view finances" ON financial_transactions;

CREATE POLICY "Members can view finances"
  ON financial_transactions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    ) 
    OR is_super_admin()
  );

-- OPTIONAL: Allow collaborators to CREATE transactions (if desired)
-- Uncomment if needed:
/*
DROP POLICY IF EXISTS "Admins+ can create transactions" ON financial_transactions;
CREATE POLICY "Collaborators+ can create transactions"
  ON financial_transactions FOR INSERT
  WITH CHECK (has_org_role(organization_id, ARRAY['owner', 'admin', 'collaborator']::org_role[]));
*/
