export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          organization_id: string
          resource_id: string | null
          resource_label: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id: string
          resource_id?: string | null
          resource_label?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          resource_id?: string | null
          resource_label?: string | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          is_emergency: boolean | null
          metadata: Json | null
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_emergency?: boolean | null
          metadata?: Json | null
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_emergency?: boolean | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          document_number: string | null
          email: string | null
          full_name: string
          hire_date: string | null
          id: string
          license_expiry: string | null
          license_number: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          position: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_number?: string | null
          email?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          position?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_number?: string | null
          email?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          position?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          attachments: Json | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          invoice_id: string | null
          organization_id: string
          reference_id: string | null
          reference_type: string | null
          subcategory: string | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
        }
        Insert: {
          amount: number
          attachments?: Json | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          organization_id: string
          reference_id?: string | null
          reference_type?: string | null
          subcategory?: string | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Update: {
          amount?: number
          attachments?: Json | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          organization_id?: string
          reference_id?: string | null
          reference_type?: string | null
          subcategory?: string | null
          transaction_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_records: {
        Row: {
          created_at: string | null
          employee_id: string | null
          fuel_date: string
          fuel_type: string
          id: string
          liters: number
          notes: string | null
          odometer: number | null
          organization_id: string
          price_per_liter: number
          station: string | null
          total_cost: number
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          fuel_date?: string
          fuel_type?: string
          id?: string
          liters: number
          notes?: string | null
          odometer?: number | null
          organization_id: string
          price_per_liter: number
          station?: string | null
          total_cost: number
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          fuel_date?: string
          fuel_type?: string
          id?: string
          liters?: number
          notes?: string | null
          odometer?: number | null
          organization_id?: string
          price_per_liter?: number
          station?: string | null
          total_cost?: number
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      impersonation_logs: {
        Row: {
          actions_performed: Json | null
          ended_at: string | null
          id: string
          ip_address: string | null
          organization_id: string
          started_at: string | null
          super_admin_id: string
          user_agent: string | null
        }
        Insert: {
          actions_performed?: Json | null
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          organization_id: string
          started_at?: string | null
          super_admin_id: string
          user_agent?: string | null
        }
        Update: {
          actions_performed?: Json | null
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          organization_id?: string
          started_at?: string | null
          super_admin_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impersonation_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impersonation_logs_super_admin_id_fkey"
            columns: ["super_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          cost_per_unit: number | null
          created_at: string | null
          current_stock: number | null
          description: string | null
          id: string
          location: string | null
          min_stock_level: number | null
          name: string
          organization_id: string
          sku: string | null
          supplier_contacts_id: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          location?: string | null
          min_stock_level?: number | null
          name: string
          organization_id: string
          sku?: string | null
          supplier_contacts_id?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          location?: string | null
          min_stock_level?: number | null
          name?: string
          organization_id?: string
          sku?: string | null
          supplier_contacts_id?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_supplier_contacts_id_fkey"
            columns: ["supplier_contacts_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          new_stock: number
          notes: string | null
          organization_id: string
          performed_by: string | null
          previous_stock: number
          quantity: number
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["inventory_movement_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          new_stock: number
          notes?: string | null
          organization_id: string
          performed_by?: string | null
          previous_stock: number
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          type: Database["public"]["Enums"]["inventory_movement_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          new_stock?: number
          notes?: string | null
          organization_id?: string
          performed_by?: string | null
          previous_stock?: number
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: Database["public"]["Enums"]["inventory_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: Database["public"]["Enums"]["invitation_status"] | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["invitation_status"] | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["invitation_status"] | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_counters: {
        Row: {
          last_number: number
          organization_id: string
          year: number
        }
        Insert: {
          last_number?: number
          organization_id: string
          year: number
        }
        Update: {
          last_number?: number
          organization_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_counters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          attachment_url: string | null
          created_at: string | null
          customer_id: string | null
          date: string
          due_date: string | null
          id: string
          invoice_number: string
          invoice_type: string
          items: Json | null
          notes: string | null
          organization_id: string
          status: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number | null
          supplier_id: string | null
          tax: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string | null
          customer_id?: string | null
          date?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          invoice_type?: string
          items?: Json | null
          notes?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number | null
          supplier_id?: string | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          attachment_url?: string | null
          created_at?: string | null
          customer_id?: string | null
          date?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          invoice_type?: string
          items?: Json | null
          notes?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number | null
          supplier_id?: string | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      land_payments: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          id: string
          notes: string | null
          organization_id: string
          paid_amount: number | null
          paid_date: string | null
          payment_method: string | null
          period_month: number
          period_year: number
          receipt_url: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          due_date: string
          id?: string
          notes?: string | null
          organization_id: string
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          period_month: number
          period_year: number
          receipt_url?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          organization_id?: string
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          period_month?: number
          period_year?: number
          receipt_url?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "land_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "land_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      land_tenants: {
        Row: {
          created_at: string | null
          due_day: number
          equipment_description: string | null
          id: string
          monthly_amount: number
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          due_day?: number
          equipment_description?: string | null
          id?: string
          monthly_amount?: number
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          due_day?: number
          equipment_description?: string | null
          id?: string
          monthly_amount?: number
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "land_tenants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          attachments: Json | null
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          next_due_at: string | null
          next_due_km: number | null
          odometer_reading: number | null
          organization_id: string
          parts_cost: number | null
          performed_at: string
          performed_by: string | null
          type: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          attachments?: Json | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          next_due_at?: string | null
          next_due_km?: number | null
          odometer_reading?: number | null
          organization_id: string
          parts_cost?: number | null
          performed_at: string
          performed_by?: string | null
          type: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          attachments?: Json | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          next_due_at?: string | null
          next_due_km?: number | null
          odometer_reading?: number | null
          organization_id?: string
          parts_cost?: number | null
          performed_at?: string
          performed_by?: string | null
          type?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_super_admin: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_super_admin?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trip_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          currency: string | null
          expense_date: string | null
          id: string
          notes: string | null
          organization_id: string
          receipt_url: string | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          currency?: string | null
          expense_date?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          receipt_url?: string | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          currency?: string | null
          expense_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          receipt_url?: string | null
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string | null
          destination: string
          destination_coords: Json | null
          distance_km: number | null
          driver_id: string | null
          end_invoice_url: string | null
          ended_at: string | null
          fuel_consumed: number | null
          id: string
          notes: string | null
          organization_id: string
          origin: string
          origin_coords: Json | null
          start_invoice_url: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["trip_status"] | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          destination: string
          destination_coords?: Json | null
          distance_km?: number | null
          driver_id?: string | null
          end_invoice_url?: string | null
          ended_at?: string | null
          fuel_consumed?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          origin: string
          origin_coords?: Json | null
          start_invoice_url?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"] | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          destination?: string
          destination_coords?: Json | null
          distance_km?: number | null
          driver_id?: string | null
          end_invoice_url?: string | null
          ended_at?: string | null
          fuel_consumed?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          origin?: string
          origin_coords?: Json | null
          start_invoice_url?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"] | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          model: string | null
          name: string
          organization_id: string
          plate_number: string | null
          status: Database["public"]["Enums"]["vehicle_status"] | null
          type: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model?: string | null
          name: string
          organization_id: string
          plate_number?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          type?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model?: string | null
          name?: string
          organization_id?: string
          plate_number?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          type?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization_for_user: {
        Args: { p_name: string; p_slug: string }
        Returns: {
          org_id: string
          org_name: string
          org_slug: string
        }[]
      }
      get_next_invoice_number: { Args: { org_id: string }; Returns: string }
      get_user_org_ids: { Args: never; Returns: string[] }
      has_org_role: {
        Args: {
          allowed_roles: Database["public"]["Enums"]["org_role"][]
          org_id: string
        }
        Returns: boolean
      }
      is_first_org_member: { Args: { org_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      inventory_movement_type: "in" | "out" | "adjustment"
      invitation_status: "pending" | "accepted" | "expired" | "cancelled"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      org_role: "owner" | "admin" | "collaborator" | "viewer"
      transaction_type: "income" | "expense"
      trip_status: "planned" | "in_progress" | "completed" | "cancelled"
      vehicle_status: "active" | "maintenance" | "inactive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      inventory_movement_type: ["in", "out", "adjustment"],
      invitation_status: ["pending", "accepted", "expired", "cancelled"],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      org_role: ["owner", "admin", "collaborator", "viewer"],
      transaction_type: ["income", "expense"],
      trip_status: ["planned", "in_progress", "completed", "cancelled"],
      vehicle_status: ["active", "maintenance", "inactive"],
    },
  },
} as const
