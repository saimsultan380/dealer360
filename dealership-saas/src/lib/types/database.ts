// =============================================================================
// DATABASE TYPE DEFINITIONS
// =============================================================================
// These types mirror the Supabase schema for type-safe queries
// =============================================================================

export type SubscriptionStatus = "trial" | "active" | "suspended" | "cancelled";
export type SubscriptionPlan = "basic" | "professional" | "enterprise";
export type UserRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "salesperson"
  | "accountant";
export type VehicleStatus = "available" | "reserved" | "sold" | "in_service";
export type VehicleCondition = "new" | "used" | "certified";
export type FuelType = "petrol" | "diesel" | "hybrid" | "electric" | "cng";
export type Transmission = "manual" | "automatic";
export type LeadSource =
  | "walk_in"
  | "phone"
  | "whatsapp"
  | "website"
  | "referral"
  | "facebook"
  | "other";
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "negotiating"
  | "won"
  | "lost";
export type LeadPriority = "low" | "medium" | "high";
export type DealStatus = "pending" | "completed" | "cancelled";
export type PaymentMethod =
  | "cash"
  | "bank_transfer"
  | "easypaisa"
  | "jazzcash"
  | "financing"
  | "cheque";
export type SubscriptionPaymentMethod =
  | "easypaisa"
  | "jazzcash"
  | "bank_transfer"
  | "stripe";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type DocumentType =
  | "cnic_front"
  | "cnic_back"
  | "registration"
  | "invoice"
  | "receipt"
  | "other";
export type EntityType = "vehicle" | "deal" | "lead";
export type InvestorStatus = "active" | "inactive" | "closed";
export type InvestmentTransactionType = "investment" | "withdrawal";
export type InvestmentTransactionStatus = "pending" | "completed" | "cancelled";
export type InvestmentPaymentMethod =
  | "cash"
  | "bank_transfer"
  | "easypaisa"
  | "jazzcash"
  | "cheque";
export type ClientStatus = "active" | "inactive" | "blacklisted";
export type ClientTransactionType = "purchase" | "sale" | "payment" | "refund";
export type ClientTransactionStatus =
  | "pending"
  | "completed"
  | "cancelled"
  | "refunded";
export type FinancingType = "finance" | "lease";
export type EMIPaymentStatus =
  | "pending"
  | "completed"
  | "late"
  | "overdue"
  | "waived";
export type LoanStatus = "active" | "completed" | "defaulted" | "cancelled";
export type CashTransactionType = "cash_in" | "cash_out" | "expense";
export type CashTransactionStatus = "pending" | "completed" | "cancelled";
export type RelatedEntityType =
  | "deal"
  | "vehicle"
  | "client"
  | "investor"
  | "other";
export type DealershipType = "local" | "japan_import" | "hybrid";

// Japan import module
export type JapanImportStatus =
  | "planned"
  | "purchased"
  | "in_transit"
  | "arrived_port"
  | "customs"
  | "ready_for_sale"
  | "sold"
  | "cancelled";

export type JapanImportDocumentType =
  | "auction_sheet"
  | "export_certificate"
  | "bill_of_lading"
  | "invoice"
  | "inspection_report"
  | "customs_document"
  | "other";

export type JapanImportClearanceStatus =
  | "pending"
  | "in_progress"
  | "cleared"
  | "held";

// Feature flags for organizations
export interface FeatureFlags {
  max_vehicles: number;
  max_users: number;
  enable_documents: boolean;
  enable_leads: boolean;
  enable_deals: boolean;
  enable_analytics: boolean;

  /**
   * Hybrid approach:
   * - Dealership can be local, japan import, or both.
   * - Individual modules can be enabled/disabled per organization.
   *
   * Note: optional for backward compatibility with existing org rows.
   */
  dealership_type?: DealershipType;

  // Core modules (optional; if omitted, treat as enabled based on existing app behavior)
  enable_inventory?: boolean;
  enable_sales?: boolean;
  enable_exchange_deals?: boolean;
  enable_financing?: boolean;
  enable_investors?: boolean;
  enable_clients?: boolean;
  enable_cash_flow?: boolean;
  enable_ledger?: boolean;

  // Japan import modules
  enable_japan_import?: boolean;
  enable_import_documents?: boolean;
  enable_import_shipments?: boolean;
  enable_import_customs?: boolean;
  enable_import_inspections?: boolean;
}

// Platform-wide statistics for Super Admin
export interface PlatformStats {
  total_organizations: number;
  active_subscriptions: number;
  total_users: number;
  total_vehicles: number;
  total_leads: number;
  active_leads?: number;
  total_deals: number;
  completed_deals: number;
  total_revenue: number;
}

export interface PlatformPublicSettings {
  id: number;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  brand_name: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformSettings {
  id: number;
  default_currency: string;
  default_country: string;
  default_timezone: string;
  session_timeout_minutes: number;
  support_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformEmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  body: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformSubscriptionPlan {
  id: string;
  code: string;
  name: string;
  price: number;
  currency: string;
  billing_period: "monthly" | "yearly";
  limits: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformAuditLog {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

// =============================================================================
// TABLE TYPES
// =============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  owner_cnic?: string | null;
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
  subscription_expires_at: string | null;
  settings: Record<string, unknown>;
  feature_flags: FeatureFlags;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id: string | null;
  email: string | null;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  organization_id: string;
  make: string;
  model: string;
  variant: string | null;
  body_type?: "sedan" | "suv" | "hatchback" | "truck" | "van" | "other" | null;
  year: number;
  color: string | null;
  registration_number: string | null;
  engine_number: string | null;
  chassis_number: string | null;
  purchase_price: number | null;
  selling_price: number | null;
  minimum_price: number | null;
  status: VehicleStatus;
  condition: VehicleCondition;
  mileage: number | null;
  fuel_type: FuelType | null;
  transmission: Transmission | null;
  description: string | null;
  added_by: string | null;
  sold_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleImage {
  id: string;
  vehicle_id: string;
  organization_id: string;
  url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface JapanImportCase {
  id: string;
  organization_id: string;
  // optional link to inventory vehicle (once registered/added to stock)
  vehicle_id: string | null;

  stock_code: string | null; // internal code used by importer
  make: string;
  model: string;
  year: number | null;
  variant: string | null;

  chassis_number: string | null;
  engine_number: string | null;
  auction_grade: string | null;
  odometer_km: number | null;
  color: string | null;

  purchase_price_jpy: number | null;
  purchase_price_pkr: number | null;
  estimated_total_cost_pkr: number | null;

  shipment_port_from: string | null;
  shipment_port_to: string | null;
  eta_date: string | null;

  status: JapanImportStatus;
  notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface JapanImportDocument {
  id: string;
  organization_id: string;
  import_case_id: string;
  document_type: JapanImportDocumentType;
  title: string | null;
  file_url: string;
  status: "pending" | "verified" | "rejected";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface JapanImportShipment {
  id: string;
  organization_id: string;
  import_case_id: string;
  vessel_name: string | null;
  voyage_number: string | null;
  bill_of_lading_number: string | null;
  container_number: string | null;
  shipping_line: string | null;
  etd_date: string | null;
  eta_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface JapanImportCustoms {
  id: string;
  organization_id: string;
  import_case_id: string;
  clearance_status: JapanImportClearanceStatus;
  clearing_agent: string | null;
  duty_pkr: number | null;
  tax_pkr: number | null;
  other_fees_pkr: number | null;
  clearance_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface JapanImportInspection {
  id: string;
  organization_id: string;
  import_case_id: string;
  inspection_date: string | null;
  inspector_name: string | null;
  overall_grade: string | null;
  passed: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface JapanImportAuction {
  id: string;
  organization_id: string;
  import_case_id: string;
  auction_house: string | null;
  auction_location: string | null;
  auction_date: string | null;
  lot_number: string | null;
  grade_sheet_url: string | null;
  fob_price_jpy: number | null;
  auction_fee_jpy: number | null;
  inland_transport_jpy: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface JapanImportCosting {
  id: string;
  organization_id: string;
  import_case_id: string;
  jpy_to_pkr_rate: number | null;

  fob_price_jpy: number | null;
  auction_fee_jpy: number | null;
  inland_transport_jpy: number | null;

  freight_pkr: number | null;
  duty_pkr: number | null;
  tax_pkr: number | null;
  agent_fee_pkr: number | null;
  port_charges_pkr: number | null;
  repairs_pkr: number | null;
  misc_pkr: number | null;

  profit_margin_pkr: number | null;
  profit_margin_percent: number | null;

  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_cnic: string | null;
  customer_address: string | null;
  source: LeadSource | null;
  status: LeadStatus;
  priority: LeadPriority;
  interested_vehicle_id: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_makes: string[] | null;
  notes: string | null;
  assigned_to: string | null;
  next_follow_up: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  organization_id: string;
  vehicle_id: string;
  lead_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_cnic: string | null;
  customer_address: string | null;
  sale_price: number;
  down_payment: number;
  payment_method: PaymentMethod | null;
  status: DealStatus;
  salesperson_id: string | null;
  commission_amount: number;
  commission_paid: boolean;
  deal_date: string;
  delivery_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  organization_id: string;
  entity_type: EntityType;
  entity_id: string;
  document_type: DocumentType;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  organization_id: string;
  amount: number;
  currency: string;
  payment_method: SubscriptionPaymentMethod;
  status: PaymentStatus;
  transaction_id: string | null;
  external_reference: string | null;
  subscription_plan: string | null;
  period_start: string | null;
  period_end: string | null;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Investor {
  id: string;
  organization_id: string;
  name: string;
  swdo_name?: string | null;
  email: string | null;
  phone: string;
  cnic: string | null;
  address: string | null;
  avatar_url?: string | null;
  status: InvestorStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestmentTransaction {
  id: string;
  organization_id: string;
  investor_id: string;
  transaction_type: InvestmentTransactionType;
  amount: number;
  currency: string;
  payment_method: InvestmentPaymentMethod | null;
  transaction_reference: string | null;
  transaction_date: string;
  status: InvestmentTransactionStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  swdo_name?: string | null;
  email: string | null;
  phone: string;
  cnic: string | null;
  address: string | null;
  avatar_url: string | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientTransaction {
  id: string;
  organization_id: string;
  client_id: string;
  deal_id: string | null;
  transaction_type: ClientTransactionType;
  amount: number;
  currency: string;
  payment_method: PaymentMethod | null;
  transaction_reference: string | null;
  vehicle_id: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  transaction_date: string;
  status: ClientTransactionStatus;
  total_amount: number | null;
  paid_amount: number;
  remaining_due: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CashTransaction {
  id: string;
  organization_id: string;
  transaction_type: CashTransactionType;
  amount: number;
  currency: string;
  expense_category_id: string | null;
  payment_method: PaymentMethod | null;
  description: string;
  reference_number: string | null;
  transaction_date: string;
  related_entity_type: RelatedEntityType | null;
  related_entity_id: string | null;
  status: CashTransactionStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// FINANCING & LOAN INTERFACES
// =============================================================================

export interface FinancingLoan {
  id: string;
  organization_id: string;
  sale_id: string | null;
  vehicle_id: string;
  customer_id: string | null;
  financing_type: FinancingType;
  principal_amount: number;
  down_payment: number;
  loan_amount: number;
  annual_interest_rate: number;
  loan_tenure_months: number;
  emi_amount: number;
  loan_start_date: string;
  loan_end_date: string;
  bank_name: string | null;
  bank_reference_number: string | null;
  contact_person: string | null;
  contact_number: string | null;
  status: LoanStatus;
  terms_and_conditions: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EMIPayment {
  id: string;
  organization_id: string;
  financing_loan_id: string;
  payment_number: number;
  due_date: string;
  emi_amount: number;
  status: EMIPaymentStatus;
  paid_amount: number;
  paid_date: string | null;
  payment_method: string | null;
  transaction_reference: string | null;
  days_late: number;
  late_fee: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaseDetail {
  id: string;
  organization_id: string;
  financing_loan_id: string;
  lessor_name: string;
  lessor_contact: string | null;
  lease_agreement_number: string | null;
  mileage_limit: number | null;
  mileage_overage_charge: number;
  maintenance_included: boolean;
  insurance_included: boolean;
  residual_value: number | null;
  buyout_option: boolean;
  buyout_price: number | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// DATABASE SCHEMA TYPE (for Supabase client)
// =============================================================================

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Organization, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at" | "email"> & {
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      vehicles: {
        Row: Vehicle;
        Insert: Omit<Vehicle, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<Vehicle, "id" | "organization_id" | "created_at" | "updated_at">
        >;
        Relationships: [];
      };
      vehicle_images: {
        Row: VehicleImage;
        Insert: Omit<VehicleImage, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<VehicleImage, "id" | "created_at">>;
        Relationships: [];
      };
      leads: {
        Row: Lead;
        Insert: Omit<Lead, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<Lead, "id" | "organization_id" | "created_at" | "updated_at">
        >;
        Relationships: [];
      };
      deals: {
        Row: Deal;
        Insert: Omit<Deal, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<Deal, "id" | "organization_id" | "created_at" | "updated_at">
        >;
        Relationships: [];
      };
      documents: {
        Row: Document;
        Insert: Omit<Document, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Document, "id" | "created_at">>;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<Payment, "id" | "organization_id" | "created_at" | "updated_at">
        >;
        Relationships: [];
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      investors: {
        Row: Investor;
        Insert: Omit<Investor, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<Investor, "id" | "organization_id" | "created_at" | "updated_at">
        >;
        Relationships: [];
      };
      investment_transactions: {
        Row: InvestmentTransaction;
        Insert: Omit<
          InvestmentTransaction,
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<
            InvestmentTransaction,
            "id" | "organization_id" | "created_at" | "updated_at"
          >
        >;
        Relationships: [];
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<Client, "id" | "organization_id" | "created_at" | "updated_at">
        >;
        Relationships: [];
      };
      client_transactions: {
        Row: ClientTransaction;
        Insert: Omit<ClientTransaction, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<
            ClientTransaction,
            "id" | "organization_id" | "created_at" | "updated_at"
          >
        >;
        Relationships: [];
      };
      expense_categories: {
        Row: ExpenseCategory;
        Insert: Omit<ExpenseCategory, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<
            ExpenseCategory,
            "id" | "organization_id" | "created_at" | "updated_at"
          >
        >;
        Relationships: [];
      };
      cash_transactions: {
        Row: CashTransaction;
        Insert: Omit<CashTransaction, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<
            CashTransaction,
            "id" | "organization_id" | "created_at" | "updated_at"
          >
        >;
        Relationships: [];
      };
      platform_public_settings: {
        Row: PlatformPublicSettings;
        Insert: Omit<PlatformPublicSettings, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<PlatformPublicSettings, "created_at" | "updated_at">
        >;
        Relationships: [];
      };
      platform_settings: {
        Row: PlatformSettings;
        Insert: Omit<PlatformSettings, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<PlatformSettings, "created_at" | "updated_at">>;
        Relationships: [];
      };
      platform_email_templates: {
        Row: PlatformEmailTemplate;
        Insert: Omit<
          PlatformEmailTemplate,
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<PlatformEmailTemplate, "id" | "created_at" | "updated_at">
        >;
        Relationships: [];
      };
      platform_subscription_plans: {
        Row: PlatformSubscriptionPlan;
        Insert: Omit<
          PlatformSubscriptionPlan,
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<PlatformSubscriptionPlan, "id" | "created_at" | "updated_at">
        >;
        Relationships: [];
      };
      platform_audit_logs: {
        Row: PlatformAuditLog;
        Insert: Omit<PlatformAuditLog, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_auth_org_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      has_role: {
        Args: { required_role: string };
        Returns: boolean;
      };
      is_super_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_investor_balance: {
        Args: { p_investor_id: string };
        Returns: number;
      };
      get_client_total_dues: {
        Args: { p_client_id: string };
        Returns: number;
      };
      get_client_total_spent: {
        Args: { p_client_id: string };
        Returns: number;
      };
      get_cash_balance: {
        Args: { p_org_id: string };
        Returns: number;
      };
      get_total_cash_in: {
        Args: { p_org_id: string; p_start_date?: string; p_end_date?: string };
        Returns: number;
      };
      get_total_cash_out: {
        Args: { p_org_id: string; p_start_date?: string; p_end_date?: string };
        Returns: number;
      };
      get_total_expenses: {
        Args: { p_org_id: string; p_start_date?: string; p_end_date?: string };
        Returns: number;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
