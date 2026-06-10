-- Compact Read Model Strategy (013)
-- Additive migration: compact sc_rm_* tables for web app reads.
-- Does NOT truncate raw staging tables. No Express write-back.

-- ── 1. Product master ────────────────────────────────────────────────────────
create table if not exists public.sc_rm_product_master (
  room_code varchar(20) not null,
  product_code varchar(50) not null,
  product_name varchar(255),
  product_group varchar(100),
  category varchar(100),
  unit_code varchar(20),
  barcode varchar(100),
  active_status varchar(30) default 'active',
  synced_at timestamptz default now(),
  constraint sc_rm_product_master_uk unique (room_code, product_code)
);

comment on table public.sc_rm_product_master is
  'Compact product master for Product Master / SKU Admin — pushed from local mirror.';

-- ── 2. Customer master ───────────────────────────────────────────────────────
create table if not exists public.sc_rm_customer_master (
  room_code varchar(20) not null,
  customer_code varchar(50) not null,
  customer_name varchar(255),
  tax_id varchar(50),
  customer_group varchar(100),
  channel varchar(100),
  phone varchar(100),
  address text,
  active_status varchar(30) default 'active',
  synced_at timestamptz default now(),
  constraint sc_rm_customer_master_uk unique (room_code, customer_code)
);

comment on table public.sc_rm_customer_master is
  'Compact customer master for search, registration, reports.';

-- ── 3. Stock balance ─────────────────────────────────────────────────────────
create table if not exists public.sc_rm_stock_balance (
  room_code varchar(20) not null,
  product_code varchar(50) not null,
  product_name varchar(255),
  warehouse_code varchar(50) not null default '',
  location_code varchar(50) not null default '',
  lot_no varchar(50) not null default '',
  qty_on_hand numeric(18, 4) default 0,
  qty_reserved numeric(18, 4) default 0,
  qty_available numeric(18, 4) default 0,
  synced_at timestamptz default now(),
  constraint sc_rm_stock_balance_uk unique (
    room_code, product_code, warehouse_code, location_code, lot_no
  )
);

comment on table public.sc_rm_stock_balance is
  'Current stock snapshot for WMS dashboard, ATP, stock balance pages.';

-- ── 4. Open SO headers ───────────────────────────────────────────────────────
create table if not exists public.sc_rm_open_so_headers (
  room_code varchar(20) not null,
  document_no varchar(50) not null,
  document_date date,
  customer_code varchar(50),
  customer_name varchar(255),
  status varchar(50),
  ship_date date,
  total_amount numeric(18, 4) default 0,
  synced_at timestamptz default now(),
  constraint sc_rm_open_so_headers_uk unique (room_code, document_no)
);

comment on table public.sc_rm_open_so_headers is
  'Open sales order headers only — not full historical SO archive.';

-- ── 5. Open SO lines ─────────────────────────────────────────────────────────
create table if not exists public.sc_rm_open_so_lines (
  room_code varchar(20) not null,
  document_no varchar(50) not null,
  line_no integer not null default 0,
  product_code varchar(50),
  product_name varchar(255),
  order_qty numeric(18, 4) default 0,
  shipped_qty numeric(18, 4) default 0,
  remaining_qty numeric(18, 4) default 0,
  warehouse_code varchar(50),
  ship_date date,
  status varchar(50),
  synced_at timestamptz default now(),
  constraint sc_rm_open_so_lines_uk unique (room_code, document_no, line_no)
);

comment on table public.sc_rm_open_so_lines is
  'Open SO lines only — compact replacement for full sc_express_so_lines in Supabase.';

-- ── 6. Sales daily summary ───────────────────────────────────────────────────
create table if not exists public.sc_rm_sales_daily_summary (
  room_code varchar(20) not null,
  sales_date date not null,
  customer_code varchar(50) not null default '',
  customer_name varchar(255),
  product_code varchar(50) not null default '',
  product_name varchar(255),
  product_group varchar(100),
  sales_qty numeric(18, 4) default 0,
  sales_amount numeric(18, 4) default 0,
  invoice_count integer default 0,
  synced_at timestamptz default now(),
  constraint sc_rm_sales_daily_summary_uk unique (
    room_code, sales_date, customer_code, product_code
  )
);

comment on table public.sc_rm_sales_daily_summary is
  'Daily sales aggregates — replaces raw invoice detail in Supabase.';

-- ── 7. Sales monthly summary ─────────────────────────────────────────────────
create table if not exists public.sc_rm_sales_monthly_summary (
  room_code varchar(20) not null,
  sales_month varchar(7) not null,
  customer_code varchar(50) not null default '',
  customer_name varchar(255),
  product_code varchar(50) not null default '',
  product_name varchar(255),
  product_group varchar(100),
  sales_qty numeric(18, 4) default 0,
  sales_amount numeric(18, 4) default 0,
  invoice_count integer default 0,
  synced_at timestamptz default now(),
  constraint sc_rm_sales_monthly_summary_uk unique (
    room_code, sales_month, customer_code, product_code
  )
);

comment on table public.sc_rm_sales_monthly_summary is
  'Monthly sales aggregates for executive dashboard and reports.';

-- ── 8. Consignment branch stock ──────────────────────────────────────────────
create table if not exists public.sc_rm_consi_branch_stock (
  room_code varchar(20) not null,
  customer_code varchar(50) not null default '',
  customer_name varchar(255),
  branch_code varchar(50) not null default '',
  branch_name varchar(255),
  product_code varchar(50) not null default '',
  product_name varchar(255),
  qty_on_branch numeric(18, 4) default 0,
  qty_sold numeric(18, 4) default 0,
  qty_returned numeric(18, 4) default 0,
  synced_at timestamptz default now(),
  constraint sc_rm_consi_branch_stock_uk unique (
    room_code, customer_code, branch_code, product_code
  )
);

comment on table public.sc_rm_consi_branch_stock is
  'Consignment branch stock snapshot for CONSI dashboard.';

-- ── 9. Sync health monitor ───────────────────────────────────────────────────
create table if not exists public.sc_rm_sync_health (
  id uuid primary key default gen_random_uuid(),
  room_code varchar(20),
  source_name varchar(100),
  sync_type varchar(50),
  status varchar(50),
  row_count integer default 0,
  started_at timestamptz,
  finished_at timestamptz,
  message text,
  created_at timestamptz default now()
);

create index if not exists idx_sc_rm_sync_health_room on public.sc_rm_sync_health(room_code);
create index if not exists idx_sc_rm_sync_health_created on public.sc_rm_sync_health(created_at desc);

comment on table public.sc_rm_sync_health is
  'Local mirror push health log for admin/sync monitor dashboard.';

-- ── Grants: SELECT-only for web app roles ────────────────────────────────────
grant select on public.sc_rm_product_master to anon, authenticated;
grant select on public.sc_rm_customer_master to anon, authenticated;
grant select on public.sc_rm_stock_balance to anon, authenticated;
grant select on public.sc_rm_open_so_headers to anon, authenticated;
grant select on public.sc_rm_open_so_lines to anon, authenticated;
grant select on public.sc_rm_sales_daily_summary to anon, authenticated;
grant select on public.sc_rm_sales_monthly_summary to anon, authenticated;
grant select on public.sc_rm_consi_branch_stock to anon, authenticated;
grant select on public.sc_rm_sync_health to anon, authenticated;

-- Service role / backend scripts need INSERT/UPDATE for upsert push
grant insert, update on public.sc_rm_product_master to service_role;
grant insert, update on public.sc_rm_customer_master to service_role;
grant insert, update on public.sc_rm_stock_balance to service_role;
grant insert, update on public.sc_rm_open_so_headers to service_role;
grant insert, update on public.sc_rm_open_so_lines to service_role;
grant insert, update on public.sc_rm_sales_daily_summary to service_role;
grant insert, update on public.sc_rm_sales_monthly_summary to service_role;
grant insert, update on public.sc_rm_consi_branch_stock to service_role;
grant insert, update on public.sc_rm_sync_health to service_role;

-- ── RLS: anon/authenticated SELECT only (no INSERT/UPDATE/DELETE) ─────────────
alter table public.sc_rm_product_master enable row level security;
alter table public.sc_rm_customer_master enable row level security;
alter table public.sc_rm_stock_balance enable row level security;
alter table public.sc_rm_open_so_headers enable row level security;
alter table public.sc_rm_open_so_lines enable row level security;
alter table public.sc_rm_sales_daily_summary enable row level security;
alter table public.sc_rm_sales_monthly_summary enable row level security;
alter table public.sc_rm_consi_branch_stock enable row level security;
alter table public.sc_rm_sync_health enable row level security;

drop policy if exists p_sc_rm_product_master_read on public.sc_rm_product_master;
create policy p_sc_rm_product_master_read on public.sc_rm_product_master
  for select to anon, authenticated using (true);

drop policy if exists p_sc_rm_customer_master_read on public.sc_rm_customer_master;
create policy p_sc_rm_customer_master_read on public.sc_rm_customer_master
  for select to anon, authenticated using (true);

drop policy if exists p_sc_rm_stock_balance_read on public.sc_rm_stock_balance;
create policy p_sc_rm_stock_balance_read on public.sc_rm_stock_balance
  for select to anon, authenticated using (true);

drop policy if exists p_sc_rm_open_so_headers_read on public.sc_rm_open_so_headers;
create policy p_sc_rm_open_so_headers_read on public.sc_rm_open_so_headers
  for select to anon, authenticated using (true);

drop policy if exists p_sc_rm_open_so_lines_read on public.sc_rm_open_so_lines;
create policy p_sc_rm_open_so_lines_read on public.sc_rm_open_so_lines
  for select to anon, authenticated using (true);

drop policy if exists p_sc_rm_sales_daily_summary_read on public.sc_rm_sales_daily_summary;
create policy p_sc_rm_sales_daily_summary_read on public.sc_rm_sales_daily_summary
  for select to anon, authenticated using (true);

drop policy if exists p_sc_rm_sales_monthly_summary_read on public.sc_rm_sales_monthly_summary;
create policy p_sc_rm_sales_monthly_summary_read on public.sc_rm_sales_monthly_summary
  for select to anon, authenticated using (true);

drop policy if exists p_sc_rm_consi_branch_stock_read on public.sc_rm_consi_branch_stock;
create policy p_sc_rm_consi_branch_stock_read on public.sc_rm_consi_branch_stock
  for select to anon, authenticated using (true);

drop policy if exists p_sc_rm_sync_health_read on public.sc_rm_sync_health;
create policy p_sc_rm_sync_health_read on public.sc_rm_sync_health
  for select to anon, authenticated using (true);

notify pgrst, 'reload schema';
