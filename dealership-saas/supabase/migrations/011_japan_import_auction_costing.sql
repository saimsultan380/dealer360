-- Japan Import: Auction purchase tracking + costing calculator

create table if not exists japan_import_auctions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  import_case_id uuid not null references japan_import_cases(id) on delete cascade,

  auction_house text null,
  auction_location text null,
  auction_date date null,
  lot_number text null,
  grade_sheet_url text null,

  fob_price_jpy numeric null,
  auction_fee_jpy numeric null,
  inland_transport_jpy numeric null,
  notes text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (import_case_id)
);

create table if not exists japan_import_costing (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  import_case_id uuid not null references japan_import_cases(id) on delete cascade,

  jpy_to_pkr_rate numeric null,

  -- JPY-side costs (converted using rate)
  fob_price_jpy numeric null,
  auction_fee_jpy numeric null,
  inland_transport_jpy numeric null,

  -- PKR-side costs
  freight_pkr numeric null,
  duty_pkr numeric null,
  tax_pkr numeric null,
  agent_fee_pkr numeric null,
  port_charges_pkr numeric null,
  repairs_pkr numeric null,
  misc_pkr numeric null,

  -- Profit targeting
  profit_margin_pkr numeric null,
  profit_margin_percent numeric null,

  notes text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (import_case_id)
);

create index if not exists idx_japan_import_auctions_org on japan_import_auctions(organization_id);
create index if not exists idx_japan_import_costing_org on japan_import_costing(organization_id);

alter table japan_import_auctions enable row level security;
alter table japan_import_costing enable row level security;

drop policy if exists "Japan import auctions: select own org" on japan_import_auctions;
create policy "Japan import auctions: select own org"
  on japan_import_auctions for select
  using (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import auctions: insert own org" on japan_import_auctions;
create policy "Japan import auctions: insert own org"
  on japan_import_auctions for insert
  with check (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import auctions: update own org" on japan_import_auctions;
create policy "Japan import auctions: update own org"
  on japan_import_auctions for update
  using (organization_id in (select organization_id from profiles where id = auth.uid()))
  with check (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import auctions: delete own org" on japan_import_auctions;
create policy "Japan import auctions: delete own org"
  on japan_import_auctions for delete
  using (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import costing: select own org" on japan_import_costing;
create policy "Japan import costing: select own org"
  on japan_import_costing for select
  using (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import costing: insert own org" on japan_import_costing;
create policy "Japan import costing: insert own org"
  on japan_import_costing for insert
  with check (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import costing: update own org" on japan_import_costing;
create policy "Japan import costing: update own org"
  on japan_import_costing for update
  using (organization_id in (select organization_id from profiles where id = auth.uid()))
  with check (organization_id in (select organization_id from profiles where id = auth.uid()));

drop policy if exists "Japan import costing: delete own org" on japan_import_costing;
create policy "Japan import costing: delete own org"
  on japan_import_costing for delete
  using (organization_id in (select organization_id from profiles where id = auth.uid()));

