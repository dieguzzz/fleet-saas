-- ============================================
-- MULTI-TENANT SAAS COMPLETE DATABASE SCHEMA
-- Fleet Management System
-- ============================================
-- 
-- This SQL file contains the complete database schema
-- that was applied to the Supabase project: fleet-saas
-- Project ID: kcvogpobvulxhhyonmfd
--
-- Run these queries in order in the Supabase SQL Editor
-- if you need to recreate or modify the schema.
-- ============================================

-- ====================
-- PART 1: INITIAL SCHEMA
-- ====================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE org_role AS ENUM ('owner', 'admin', 'collaborator', 'viewer');
CREATE TYPE vehicle_status AS ENUM ('active', 'maintenance', 'inactive');
CREATE TYPE trip_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- ============================================
-- CORE TABLES
-- ============================================

-- Organizations (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization memberships
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role org_role NOT NULL DEFAULT 'viewer',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID NOT NULL REFERENCES profiles(id),
  status invitation_status DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FEATURE TABLES
-- ============================================

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  plate_number TEXT,
  brand TEXT,
  model TEXT,
  year INTEGER,
  status vehicle_status DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES profiles(id),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  origin_coords JSONB,
  destination_coords JSONB,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  distance_km DECIMAL(10, 2),
  fuel_consumed DECIMAL(10, 2),
  notes TEXT,
  status trip_status DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Records
CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  cost DECIMAL(10, 2),
  odometer_reading INTEGER,
  performed_by TEXT,
  performed_at DATE NOT NULL,
  next_due_at DATE,
  next_due_km INTEGER,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Transactions
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  transaction_date DATE NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  is_emergency BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Impersonation Logs (audit)
CREATE TABLE impersonation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  super_admin_id UUID NOT NULL REFERENCES profiles(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  actions_performed JSONB DEFAULT '[]'
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_vehicles_org ON vehicles(organization_id);
CREATE INDEX idx_trips_org ON trips(organization_id);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_maintenance_org ON maintenance_records(organization_id);
CREATE INDEX idx_maintenance_vehicle ON maintenance_records(vehicle_id);
CREATE INDEX idx_transactions_org ON financial_transactions(organization_id);
CREATE INDEX idx_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX idx_contacts_org ON contacts(organization_id);
CREATE INDEX idx_invitations_org ON invitations(organization_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_impersonation_super_admin ON impersonation_logs(super_admin_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at
  BEFORE UPDATE ON maintenance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ====================
-- PART 2: RLS POLICIES
-- ====================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE impersonation_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_super_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has a role in an organization
CREATE OR REPLACE FUNCTION has_org_role(org_id UUID, allowed_roles org_role[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role = ANY(allowed_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all org IDs user belongs to
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PROFILES POLICIES
-- ============================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_super_admin());

-- ============================================
-- ORGANIZATIONS POLICIES
-- ============================================

CREATE POLICY "Members can view their organizations"
  ON organizations FOR SELECT
  USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    OR is_super_admin()
  );

CREATE POLICY "Owners and admins can update organization"
  ON organizations FOR UPDATE
  USING (has_org_role(id, ARRAY['owner', 'admin']::org_role[]));

CREATE POLICY "Only owners can delete organization"
  ON organizations FOR DELETE
  USING (has_org_role(id, ARRAY['owner']::org_role[]));

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- ORGANIZATION MEMBERS POLICIES
-- ============================================

CREATE POLICY "Members can view org members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    OR is_super_admin()
  );

CREATE POLICY "Owners and admins can add members"
  ON organization_members FOR INSERT
  WITH CHECK (
    has_org_role(organization_id, ARRAY['owner', 'admin']::org_role[])
    OR (
      auth.uid() = user_id
      AND NOT EXISTS (SELECT 1 FROM organization_members WHERE organization_id = organization_members.organization_id)
    )
  );

CREATE POLICY "Owners and admins can update members"
  ON organization_members FOR UPDATE
  USING (has_org_role(organization_id, ARRAY['owner', 'admin']::org_role[]));

CREATE POLICY "Owners and admins can remove members"
  ON organization_members FOR DELETE
  USING (
    has_org_role(organization_id, ARRAY['owner', 'admin']::org_role[])
    OR user_id = auth.uid()
  );

-- ============================================
-- INVITATIONS POLICIES
-- ============================================

CREATE POLICY "Members can view org invitations"
  ON invitations FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Owners and admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (has_org_role(organization_id, ARRAY['owner', 'admin']::org_role[]));

CREATE POLICY "Owners and admins can update invitations"
  ON invitations FOR UPDATE
  USING (has_org_role(organization_id, ARRAY['owner', 'admin']::org_role[]));

CREATE POLICY "Anyone can view invitation by token"
  ON invitations FOR SELECT
  USING (status = 'pending' AND expires_at > NOW());

-- ============================================
-- VEHICLES POLICIES
-- ============================================

CREATE POLICY "Members can view org vehicles"
  ON vehicles FOR SELECT
  USING (organization_id = ANY(get_user_org_ids()) OR is_super_admin());

CREATE POLICY "Owners and admins can create vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (has_org_role(organization_id, ARRAY['owner', 'admin']::org_role[]));

CREATE POLICY "Owners and admins can update vehicles"
  ON vehicles FOR UPDATE
  USING (has_org_role(organization_id, ARRAY['owner', 'admin']::org_role[]));

CREATE POLICY "Only owners can delete vehicles"
  ON vehicles FOR DELETE
  USING (has_org_role(organization_id, ARRAY['owner']::org_role[]));

-- ============================================
-- TRIPS POLICIES
-- ============================================

CREATE POLICY "Members can view org trips"
  ON trips FOR SELECT
  USING (organization_id = ANY(get_user_org_ids()) OR is_super_admin());

CREATE POLICY "Collaborators+ can create trips"
  ON trips FOR INSERT
  WITH CHECK (has_org_role(organization_id, ARRAY['owner', 'admin', 'collaborator']::org_role[]));

CREATE POLICY "Collaborators+ can update trips"
  ON trips FOR UPDATE
  USING (has_org_role(organization_id, ARRAY['owner', 'admin', 'collaborator']::org_role[]));

CREATE POLICY "Admins+ can delete trips"
  ON trips FOR DELETE
  USING (has_org_role(organization_id, ARRAY['owner', 'admin']::org_role[]));

-- ============================================
-- MAINTENANCE RECORDS POLICIES
-- ============================================

CREATE POLICY "Members can view org maintenance"
  ON maintenance_records FOR SELECT
  USING (organization_id = ANY(get_user_org_ids()) OR is_super_admin());

CREATE POLICY "Collaborators+ can create maintenance"
  ON maintenance_records FOR INSERT
  WITH CHECK (has_org_role(organization_id, ARRAY['owner', 'admin', 'collaborator']::org_role[]));

CREATE POLICY "Admins+ can update maintenance"
  ON maintenance_records FOR UPDATE
  USING (has_org_role(organization_id, ARRAY['owner', 'admin']::org_role[]));

CREATE POLICY "Only owners can delete maintenance"
  ON maintenance_records FOR DELETE
  USING (has_org_role(organization_id, ARRAY['owner']::org_role[]));

-- ============================================
-- FINANCIAL TRANSACTIONS POLICIES
-- ============================================

CREATE POLICY "Admins+ can view finances"
  ON financial_transactions FOR SELECT
  USING (has_org_role(organization_id, ARRAY['owner', 'admin']::org_role[]) OR is_super_admin());

CREATE POLICY "Admins+ can create transactions"
  ON financial_transactions FOR INSERT
  WITH CHECK (has_org_role(organization_id, ARRAY['owner', 'admin']::org_role[]));

CREATE POLICY "Admins+ can update transactions"
  ON financial_transactions FOR UPDATE
  USING (has_org_role(organization_id, ARRAY['owner', 'admin']::org_role[]));

CREATE POLICY "Only owners can delete transactions"
  ON financial_transactions FOR DELETE
  USING (has_org_role(organization_id, ARRAY['owner']::org_role[]));

-- ============================================
-- CONTACTS POLICIES
-- ============================================

CREATE POLICY "Members can view org contacts"
  ON contacts FOR SELECT
  USING (organization_id = ANY(get_user_org_ids()) OR is_super_admin());

CREATE POLICY "Collaborators+ can create contacts"
  ON contacts FOR INSERT
  WITH CHECK (has_org_role(organization_id, ARRAY['owner', 'admin', 'collaborator']::org_role[]));

CREATE POLICY "Admins+ can update contacts"
  ON contacts FOR UPDATE
  USING (has_org_role(organization_id, ARRAY['owner', 'admin']::org_role[]));

CREATE POLICY "Admins+ can delete contacts"
  ON contacts FOR DELETE
  USING (has_org_role(organization_id, ARRAY['owner', 'admin']::org_role[]));

-- ============================================
-- IMPERSONATION LOGS POLICIES
-- ============================================

CREATE POLICY "Only super admins can view impersonation logs"
  ON impersonation_logs FOR SELECT
  USING (is_super_admin());

CREATE POLICY "Only super admins can create logs"
  ON impersonation_logs FOR INSERT
  WITH CHECK (is_super_admin() AND super_admin_id = auth.uid());

CREATE POLICY "Only super admins can update their logs"
  ON impersonation_logs FOR UPDATE
  USING (is_super_admin() AND super_admin_id = auth.uid());

-- ============================================
-- END OF SCHEMA
-- ============================================
