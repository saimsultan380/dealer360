-- Japan Import Process Tables: shipments, customs, inspections

do $$
begin
  if not exists (select 1 from pg_type where typname = 'japan_import_clearance_status') then
    create type japan_import_clearance_status as enum (
      'pending',
      'in_progress',
      'cleared',
      'held'
    );
  end if;
end $$;

create table if not exists japan_import_shipments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  import_case_id uuid not null references japan_import_cases(id) on delete cascade,
  vessel_name text null,
  voyage_number text null,
  bill_of_lading_number text null,
  container_number text null,
  shipping_line text null,
  etd_date date null,
  eta_date date null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (import_case_id)
);

create table if not exists japan_import_customs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  import_case_id uuid not null references japan_import_cases(id) on delete cascade,
  clearance_status japan_import_clearance_status not null default 'pending',
  clearing_agent text null,
  duty_pkr numeric null,
  tax_pkr numeric null,
  other_fees_pkr numeric null,
  clearance_date date null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (import_case_id)
);

create table if not exists japan_import_inspections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  import_case_id uuid not null references japan_import_cases(id) on delete cascade,
  inspection_date date null,
  inspector_name text null,
  overall_grade text null,
  passed boolean null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (import_case_id)
);

create index if not exists idx_japan_import_shipments_org on japan_import_shipments(organization_id);
create index if not exists idx_japan_import_customs_org on japan_import_customs(organization_id);
create index if not exists idx_japan_import_inspections_org on japan_import_inspections(organization_id);

alter table japan_import_shipments enable row level security;
alter table japan_import_customs enable row level security;
alter table japan_import_inspections enable row level security;

drop policy if exists "Japan import shipments: select own org" on japan_import_shipments;
create policy "Japan import shipments: select own org"
  on japan_import_shipments for select
  using (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import shipments: insert own org" on japan_import_shipments;
create policy "Japan import shipments: insert own org"
  on japan_import_shipments for insert
  with check (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import shipments: update own org" on japan_import_shipments;
create policy "Japan import shipments: update own org"
  on japan_import_shipments for update
  using (organization_id in (select organization_id from profiles where id = auth.uid()))
  with check (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import shipments: delete own org" on japan_import_shipments;
create policy "Japan import shipments: delete own org"
  on japan_import_shipments for delete
  using (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import customs: select own org" on japan_import_customs;
create policy "Japan import customs: select own org"
  on japan_import_customs for select
  using (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import customs: insert own org" on japan_import_customs;
create policy "Japan import customs: insert own org"
  on japan_import_customs for insert
  with check (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import customs: update own org" on japan_import_customs;
create policy "Japan import customs: update own org"
  on japan_import_customs for update
  using (organization_id in (select organization_id from profiles where id = auth.uid()))
  with check (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import customs: delete own org" on japan_import_customs;
create policy "Japan import customs: delete own org"
  on japan_import_customs for delete
  using (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import inspections: select own org" on japan_import_inspections;
create policy "Japan import inspections: select own org"
  on japan_import_inspections for select
  using (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import inspections: insert own org" on japan_import_inspections;
create policy "Japan import inspections: insert own org"
  on japan_import_inspections for insert
  with check (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import inspections: update own org" on japan_import_inspections;
create policy "Japan import inspections: update own org"
  on japan_import_inspections for update
  using (organization_id in (select organization_id from profiles where id = auth.uid()))
  with check (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import inspections: delete own org" on japan_import_inspections;
create policy "Japan import inspections: delete own org"
  on japan_import_inspections for delete
  using (organization_id in (select organization_id from profiles where id = auth.uid()));

