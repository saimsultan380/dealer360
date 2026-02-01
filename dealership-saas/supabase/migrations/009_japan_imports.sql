-- Japan Import Module (Hybrid dealership support)
-- Creates core tables to track imported vehicles, documents, and process status.

-- =========================
-- ENUMS
-- =========================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'japan_import_status') then
    create type japan_import_status as enum (
      'planned',
      'purchased',
      'in_transit',
      'arrived_port',
      'customs',
      'ready_for_sale',
      'sold',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'japan_import_document_type') then
    create type japan_import_document_type as enum (
      'auction_sheet',
      'export_certificate',
      'bill_of_lading',
      'invoice',
      'inspection_report',
      'customs_document',
      'other'
    );
  end if;
end $$;

-- =========================
-- TABLES
-- =========================
create table if not exists japan_import_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vehicle_id uuid null references vehicles(id) on delete set null,

  stock_code text null,
  make text not null,
  model text not null,
  year integer null,
  variant text null,

  chassis_number text null,
  engine_number text null,
  auction_grade text null,
  odometer_km integer null,
  color text null,

  purchase_price_jpy numeric null,
  purchase_price_pkr numeric null,
  estimated_total_cost_pkr numeric null,

  shipment_port_from text null,
  shipment_port_to text null,
  eta_date date null,

  status japan_import_status not null default 'planned',
  notes text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists japan_import_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  import_case_id uuid not null references japan_import_cases(id) on delete cascade,

  document_type japan_import_document_type not null,
  title text null,
  file_url text not null,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  notes text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- INDEXES
-- =========================
create index if not exists idx_japan_import_cases_org on japan_import_cases(organization_id);
create index if not exists idx_japan_import_cases_status on japan_import_cases(status);
create index if not exists idx_japan_import_documents_org on japan_import_documents(organization_id);
create index if not exists idx_japan_import_documents_case on japan_import_documents(import_case_id);

-- =========================
-- RLS
-- =========================
alter table japan_import_cases enable row level security;
alter table japan_import_documents enable row level security;

-- Allow members of org to read/write within org.
-- Assumes profiles table with org mapping exists.
drop policy if exists "Japan import cases: select own org" on japan_import_cases;
create policy "Japan import cases: select own org"
  on japan_import_cases for select
  using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

drop policy if exists "Japan import cases: insert own org" on japan_import_cases;
create policy "Japan import cases: insert own org"
  on japan_import_cases for insert
  with check (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

drop policy if exists "Japan import cases: update own org" on japan_import_cases;
create policy "Japan import cases: update own org"
  on japan_import_cases for update
  using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  )
  with check (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

drop policy if exists "Japan import cases: delete own org" on japan_import_cases;
create policy "Japan import cases: delete own org"
  on japan_import_cases for delete
  using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

drop policy if exists "Japan import documents: select own org" on japan_import_documents;
create policy "Japan import documents: select own org"
  on japan_import_documents for select
  using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

drop policy if exists "Japan import documents: insert own org" on japan_import_documents;
create policy "Japan import documents: insert own org"
  on japan_import_documents for insert
  with check (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

drop policy if exists "Japan import documents: update own org" on japan_import_documents;
create policy "Japan import documents: update own org"
  on japan_import_documents for update
  using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  )
  with check (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

drop policy if exists "Japan import documents: delete own org" on japan_import_documents;
create policy "Japan import documents: delete own org"
  on japan_import_documents for delete
  using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

