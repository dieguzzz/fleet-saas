// ============================================
// DATABASE TYPES - Generated from Supabase Schema
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enum types
export type OrgRole = 'owner' | 'admin' | 'collaborator' | 'viewer';
export type VehicleStatus = 'active' | 'maintenance' | 'inactive';
export type TripStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type TransactionType = 'income' | 'expense';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type InventoryMovementType = 'in' | 'out' | 'adjustment';
export type InventoryCategory = 'parts' | 'fluids' | 'tires' | 'tools' | 'consumables' | 'other';

export const INVENTORY_CATEGORY_LABELS: Record<InventoryCategory, string> = {
  parts: 'Repuestos',
  fluids: 'Fluidos',
  tires: 'Neumáticos',
  tools: 'Herramientas',
  consumables: 'Consumibles',
  other: 'Otro',
};

// Entity interfaces for easier usage
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  settings: Json | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_super_admin: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  invited_by: string | null;
  joined_at: string | null;
  // Joined data
  profile?: Profile;
  organization?: Organization;
}

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: OrgRole;
  token: string;
  invited_by: string;
  status: InvitationStatus | null;
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string | null;
  // Joined data
  organization?: Organization;
  inviter?: Profile;
}

export interface Vehicle {
  id: string;
  organization_id: string;
  name: string;
  type: string | null;
  plate_number: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  status: VehicleStatus | null;
  metadata: Json | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Trip {
  id: string;
  organization_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  origin: string;
  destination: string;
  origin_coords: Json | null;
  destination_coords: Json | null;
  started_at: string | null;
  ended_at: string | null;
  distance_km: number | null;
  fuel_consumed: number | null;
  notes: string | null;
  status: TripStatus | null;
  start_invoice_url: string | null;
  end_invoice_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined data
  vehicle?: Vehicle;
  driver?: Profile;
}

export interface MaintenanceRecord {
  id: string;
  organization_id: string;
  vehicle_id: string;
  type: string;
  description: string | null;
  cost: number | null;
  odometer_reading: number | null;
  performed_by: string | null;
  performed_at: string;
  next_due_at: string | null;
  next_due_km: number | null;
  attachments: Json | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined data
  vehicle?: Vehicle;
}

export interface FinancialTransaction {
  id: string;
  organization_id: string;
  type: TransactionType;
  category: string;
  subcategory: string | null;
  amount: number;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  transaction_date: string;
  attachments: Json | null;
  created_at: string | null;
  updated_at: string | null;
}

export type ContactRole =
  | 'customer' | 'supplier'
  | 'mechanic' | 'workshop' | 'tow_truck' | 'tire_service' | 'insurance' | 'other';

export const CONTACT_ROLE_LABELS: Record<string, string> = {
  customer: 'Cliente',
  supplier: 'Proveedor',
  mechanic: 'Mecánico',
  workshop: 'Taller',
  tow_truck: 'Grúa',
  tire_service: 'Gomería',
  insurance: 'Seguro',
  other: 'Otro',
  driver: 'Conductor',
};

export const SERVICE_ROLES: ContactRole[] = ['mechanic', 'workshop', 'tow_truck', 'tire_service', 'insurance', 'other'];

export const SERVICE_ROLE_COLORS: Record<string, string> = {
  mechanic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  workshop: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  tow_truck: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  tire_service: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  insurance: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  other: 'bg-muted text-muted-foreground',
  driver: 'bg-muted text-muted-foreground',
};

export interface Contact {
  id: string;
  organization_id: string;
  name: string;
  role: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  is_emergency: boolean | null;
  metadata: Json | null;
  created_at: string | null;
  updated_at: string | null;
}

export type EmployeeStatus = 'active' | 'inactive' | 'on_leave';
export type FuelType = 'diesel' | 'gasoline' | 'gasoil';

export interface Employee {
  id: string;
  organization_id: string;
  full_name: string;
  position: string | null;
  document_number: string | null;
  phone: string | null;
  email: string | null;
  license_number: string | null;
  license_expiry: string | null;
  hire_date: string | null;
  status: EmployeeStatus;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface FuelRecord {
  id: string;
  organization_id: string;
  vehicle_id: string | null;
  employee_id: string | null;
  fuel_type: FuelType;
  liters: number;
  price_per_liter: number;
  total_cost: number;
  odometer: number | null;
  station: string | null;
  fuel_date: string;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined
  vehicle?: Vehicle;
  employee?: Employee;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  action: 'create' | 'update' | 'delete';
  resource_type: string;
  resource_id: string | null;
  resource_label: string | null;
  metadata: Json | null;
  created_at: string;
  // joined
  user?: { full_name: string | null; email: string };
}

export interface ImpersonationLog {
  id: string;
  super_admin_id: string;
  organization_id: string;
  started_at: string | null;
  ended_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  actions_performed: Json | null;
}

export interface Invoice {
  id: string;
  organization_id: string;
  customer_id: string | null;
  supplier_id: string | null;
  invoice_number: string;
  invoice_type: string;
  date: string;
  due_date: string | null;
  status: InvoiceStatus | null;
  items: Json | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  notes: string | null;
  attachment_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined
  customer?: Contact;
  supplier?: Contact;
}

export interface InventoryItem {
  id: string;
  organization_id: string;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  current_stock: number | null;
  min_stock_level: number | null;
  unit: string | null;
  cost_per_unit: number | null;
  supplier_contacts_id: string | null;
  location: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined
  supplier?: Contact;
}

export interface InventoryMovement {
  id: string;
  organization_id: string;
  item_id: string;
  type: InventoryMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_type: string | null;
  reference_id: string | null;
  performed_by: string | null;
  notes: string | null;
  created_at: string | null;
  // Joined
  item?: InventoryItem;
  performer?: Profile;
}

export type VehicleDocumentType = 'insurance' | 'vtv' | 'registration' | 'other';

export const VEHICLE_DOCUMENT_LABELS: Record<VehicleDocumentType, string> = {
  insurance: 'Seguro',
  vtv: 'Rev. Técnica (VTV)',
  registration: 'Patente',
  other: 'Otro',
};

export interface VehicleDocument {
  id: string;
  organization_id: string;
  vehicle_id: string;
  document_type: VehicleDocumentType;
  label: string;
  expiry_date: string;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined
  vehicle?: Vehicle;
}

export type LandTenantStatus = 'active' | 'inactive';
export type LandPaymentStatus = 'pending' | 'paid' | 'overdue';
export type LandPaymentMethod = 'cash' | 'transfer' | 'check' | 'card';

export interface LandTenant {
  id: string;
  organization_id: string;
  name: string;
  phone: string | null;
  equipment_description: string | null;
  monthly_amount: number;
  due_day: number;
  start_date: string;
  status: LandTenantStatus;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface LandPayment {
  id: string;
  organization_id: string;
  tenant_id: string;
  period_year: number;
  period_month: number;
  due_date: string;
  amount: number;
  status: LandPaymentStatus;
  paid_date: string | null;
  paid_amount: number | null;
  payment_method: LandPaymentMethod | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined
  tenant?: LandTenant;
}

export interface TripExpense {
  id: string;
  organization_id: string;
  trip_id: string;
  category: string;
  amount: number;
  currency: string | null;
  expense_date: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined
  trip?: Trip;
}

// ============================================
// SUPABASE DATABASE TYPE DEFINITION
// ============================================

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: Contact;
        Insert: Omit<Contact, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Contact, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      financial_transactions: {
        Row: FinancialTransaction;
        Insert: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<FinancialTransaction, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at' | 'user'>;
        Update: never;
        Relationships: [];
      };
      impersonation_logs: {
        Row: ImpersonationLog;
        Insert: Omit<ImpersonationLog, 'id' | 'started_at'>;
        Update: Partial<Pick<ImpersonationLog, 'ended_at' | 'actions_performed'>>;
        Relationships: [];
      };
      invitations: {
        Row: Invitation;
        Insert: Omit<Invitation, 'id' | 'token' | 'status' | 'expires_at' | 'accepted_at' | 'created_at'>;
        Update: Partial<Pick<Invitation, 'status' | 'accepted_at'>>;
        Relationships: [];
      };
      maintenance_records: {
        Row: MaintenanceRecord;
        Insert: Omit<MaintenanceRecord, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MaintenanceRecord, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      organization_members: {
        Row: OrganizationMember;
        Insert: Omit<OrganizationMember, 'id' | 'joined_at'>;
        Update: Partial<Pick<OrganizationMember, 'role'>>;
        Relationships: [];
      };
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      trips: {
        Row: Trip;
        Insert: Omit<Trip, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Trip, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      vehicles: {
        Row: Vehicle;
        Insert: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Vehicle, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      invoices: {
        Row: Invoice;
        Insert: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'customer' | 'supplier'>;
        Update: Partial<Omit<Invoice, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'customer' | 'supplier'>>;
        Relationships: [];
      };
      inventory_items: {
        Row: InventoryItem;
        Insert: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<InventoryItem, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      inventory_movements: {
        Row: InventoryMovement;
        Insert: Omit<InventoryMovement, 'id' | 'created_at'>;
        Update: Partial<Omit<InventoryMovement, 'id' | 'organization_id' | 'created_at' >>;
        Relationships: [];
      };
      trip_expenses: {
        Row: TripExpense;
        Insert: Omit<TripExpense, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TripExpense, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      employees: {
        Row: Employee;
        Insert: Omit<Employee, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Employee, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      fuel_records: {
        Row: FuelRecord;
        Insert: Omit<FuelRecord, 'id' | 'created_at' | 'updated_at' | 'vehicle' | 'employee'>;
        Update: Partial<Omit<FuelRecord, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'vehicle' | 'employee'>>;
        Relationships: [];
      };
      land_tenants: {
        Row: LandTenant;
        Insert: Omit<LandTenant, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LandTenant, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      land_payments: {
        Row: LandPayment;
        Insert: Omit<LandPayment, 'id' | 'created_at' | 'updated_at' | 'tenant'>;
        Update: Partial<Omit<LandPayment, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'tenant'>>;
        Relationships: [];
      };
      vehicle_documents: {
        Row: VehicleDocument;
        Insert: Omit<VehicleDocument, 'id' | 'created_at' | 'updated_at' | 'vehicle'>;
        Update: Partial<Omit<VehicleDocument, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'vehicle'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_org_ids: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      has_org_role: {
        Args: {
          org_id: string;
          allowed_roles: OrgRole[];
        };
        Returns: boolean;
      };
      is_super_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      invitation_status: InvitationStatus;
      org_role: OrgRole;
      transaction_type: TransactionType;
      trip_status: TripStatus;
      vehicle_status: VehicleStatus;
      invoice_status: InvoiceStatus;
      inventory_movement_type: InventoryMovementType;
      employee_status: EmployeeStatus;
      fuel_type: FuelType;
      vehicle_document_type: VehicleDocumentType;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
