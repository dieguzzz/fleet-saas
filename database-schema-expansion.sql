-- ============================================
-- FLEET SAAS DATABASE EXPANSION
-- Invoices, Inventory, and Trip Expenses
-- ============================================

-- ============================================
-- 1. INVOICES & FINANCIALS
-- ============================================

CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status invoice_status DEFAULT 'draft',
  items JSONB DEFAULT '[]', -- Array of {description, quantity, unit_price, total}
  subtotal DECIMAL(12, 2) DEFAULT 0,
  tax DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, invoice_number)
);

-- Link financial transactions to invoices
ALTER TABLE financial_transactions 
ADD COLUMN invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- ============================================
-- 2. INVENTORY & PARTS
-- ============================================

CREATE TYPE inventory_movement_type AS ENUM ('in', 'out', 'adjustment');

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  category TEXT,
  current_stock INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  unit TEXT DEFAULT 'pcs',
  cost_per_unit DECIMAL(10, 2),
  supplier_contacts_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, sku)
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  type inventory_movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reference_type TEXT, -- 'maintenance_job', 'purchase_order', 'manual_adjustment'
  reference_id UUID,
  performed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update maintenance records to link to inventory if needed
ALTER TABLE maintenance_records
ADD COLUMN parts_cost DECIMAL(10, 2) DEFAULT 0;

-- ============================================
-- 3. TRIP EXPENSES
-- ============================================

CREATE TABLE trip_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'fuel', 'toll', 'food', 'maintenance', 'other'
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  expense_date TIMESTAMPTZ DEFAULT NOW(),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;

-- Invoices Policies
CREATE POLICY "Members can view org invoices"
  ON invoices FOR SELECT
  USING (organization_id = ANY(get_user_org_ids()) OR is_super_admin());

CREATE POLICY "Admins+ can manage invoices"
  ON invoices FOR ALL
  USING (has_org_role(organization_id, ARRAY['owner', 'admin']::org_role[]))
  WITH CHECK (has_org_role(organization_id, ARRAY['owner', 'admin']::org_role[]));

-- Inventory Items Policies
CREATE POLICY "Members can view org inventory"
  ON inventory_items FOR SELECT
  USING (organization_id = ANY(get_user_org_ids()) OR is_super_admin());

CREATE POLICY "Collaborators+ can manage inventory"
  ON inventory_items FOR ALL
  USING (has_org_role(organization_id, ARRAY['owner', 'admin', 'collaborator']::org_role[]))
  WITH CHECK (has_org_role(organization_id, ARRAY['owner', 'admin', 'collaborator']::org_role[]));

-- Inventory Movements Policies
CREATE POLICY "Members can view org inventory movements"
  ON inventory_movements FOR SELECT
  USING (organization_id = ANY(get_user_org_ids()) OR is_super_admin());

CREATE POLICY "Collaborators+ can create movements"
  ON inventory_movements FOR INSERT
  WITH CHECK (has_org_role(organization_id, ARRAY['owner', 'admin', 'collaborator']::org_role[]));

-- Trip Expenses Policies
CREATE POLICY "Members can view org trip expenses"
  ON trip_expenses FOR SELECT
  USING (organization_id = ANY(get_user_org_ids()) OR is_super_admin());

CREATE POLICY "Collaborators+ can manage trip expenses"
  ON trip_expenses FOR ALL
  USING (has_org_role(organization_id, ARRAY['owner', 'admin', 'collaborator']::org_role[]))
  WITH CHECK (has_org_role(organization_id, ARRAY['owner', 'admin', 'collaborator']::org_role[]));


-- ============================================
-- TRIGGERS (Updated_at)
-- ============================================

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_expenses_updated_at
  BEFORE UPDATE ON trip_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: Trigger to auto-update stock on movement
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'in' THEN
    UPDATE inventory_items 
    SET current_stock = current_stock + NEW.quantity 
    WHERE id = NEW.item_id;
  ELSIF NEW.type = 'out' THEN
     UPDATE inventory_items 
    SET current_stock = current_stock - NEW.quantity 
    WHERE id = NEW.item_id;
  ELSIF NEW.type = 'adjustment' THEN
     UPDATE inventory_items 
    SET current_stock = NEW.quantity 
    WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- NOTE: This simple trigger might conflict if you manually set 'previous_stock' etc.
-- For now, let's keep logic in application layer or refined trigger later.
