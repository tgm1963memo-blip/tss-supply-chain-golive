-- Phase 3G/3J: Express read-only sync staging tables, sync tracking, and web read models.
-- Safe mode: no Express DBF write-back. Service role used by sync agent only.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is 'Maintains updated_at on row changes.';

-- ---------------------------------------------------------------------------
-- Sync tracking
-- ---------------------------------------------------------------------------
create table if not exists public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  room_code text,
  job_name text,
  job_type text,
  source_table text,
  status text not null default 'pending',
  started_at timestamptz,
  finished_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sync_jobs is 'Top-level Express DBF sync and agent run tracking (read-only sync).';

-- Safe upgrades when sync_jobs already exists with legacy columns (e.g. job_type only).
alter table public.sync_jobs add column if not exists job_name text;
alter table public.sync_jobs add column if not exists job_type text;

update public.sync_jobs
set job_name = coalesce(job_name, job_type, source_table, 'legacy')
where job_name is null;

update public.sync_jobs
set job_type = coalesce(job_type, job_name, source_table, 'legacy')
where job_type is null;

comment on column public.sync_jobs.job_name is 'Express sync identifier, e.g. express_sync:TSS:STMAS.DBF or agent:active_rolling.';
comment on column public.sync_jobs.job_type is 'Legacy/alternate job classifier kept for compatibility with existing schemas.';

create table if not exists public.sync_batches (
  id uuid primary key default gen_random_uuid(),
  sync_job_id uuid references public.sync_jobs(id) on delete cascade,
  room_code text,
  source_table text,
  batch_no integer,
  records_read integer not null default 0,
  records_success integer not null default 0,
  records_failed integer not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sync_batches is 'Batch-level Express sync progress.';

create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  sync_job_id uuid references public.sync_jobs(id) on delete cascade,
  room_code text,
  source_table text,
  level text not null default 'info',
  message text not null,
  detail jsonb,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sync_logs is 'Structured logs for Express sync jobs.';

create table if not exists public.sync_failed_records (
  id uuid primary key default gen_random_uuid(),
  sync_job_id uuid references public.sync_jobs(id) on delete cascade,
  room_code text,
  source_table text,
  record_key text,
  error_message text,
  raw_data jsonb,
  status text not null default 'failed',
  retry_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sync_failed_records is 'Failed Express DBF rows captured during read-only sync.';

-- Optional agent metadata mirror; primary agent tracking uses sync_jobs (job_name agent:*).
create table if not exists public.sync_agent_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null,
  status text not null,
  detail text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sync_agent_runs is 'Optional local-style agent run log; scheduled tasks also write sync_jobs.';

-- ---------------------------------------------------------------------------
-- Express staging tables (raw ERP import — read-only toward Express)
-- ---------------------------------------------------------------------------
create table if not exists public.sc_express_products (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  source_file text,
  source_table text,
  source_row_id text,
  source_hash text,
  sync_job_id uuid,
  sync_batch_id uuid references public.sync_batches(id) on delete set null,
  sync_status text,
  product_code text not null,
  product_name text,
  product_description text,
  product_group text,
  uom text,
  item_code text,
  item_name text,
  sku_code text,
  sku_name text,
  barcode text,
  product_category text,
  product_type text,
  brand text,
  unit text,
  base_uom text,
  active_status text,
  is_active text,
  sale_price numeric(18,4),
  standard_cost numeric(18,4),
  weight numeric(18,4),
  pack_size numeric(18,4),
  raw_data jsonb not null default '{}'::jsonb,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  source_deleted_at timestamptz,
  last_seen_at timestamptz default now(),
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sc_express_products_room_product_uk unique (room_code, product_code)
);

comment on table public.sc_express_products is 'Raw STMAS product rows from Express DBF (read-only import).';

create table if not exists public.sc_express_customers (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  source_file text,
  source_table text,
  source_row_id text,
  source_hash text,
  sync_job_id uuid,
  sync_batch_id uuid references public.sync_batches(id) on delete set null,
  sync_status text,
  customer_code text not null,
  customer_name text,
  customer_group text,
  sales_code text,
  raw_data jsonb not null default '{}'::jsonb,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  source_deleted_at timestamptz,
  last_seen_at timestamptz default now(),
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sc_express_customers_room_customer_uk unique (room_code, customer_code)
);

comment on table public.sc_express_customers is 'Raw ARMAS customer rows from Express DBF (read-only import).';

create table if not exists public.sc_express_stock (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  source_file text,
  source_table text,
  source_row_id text,
  source_hash text,
  sync_job_id uuid,
  sync_batch_id uuid references public.sync_batches(id) on delete set null,
  sync_status text,
  product_code text not null,
  warehouse_code text not null default '',
  location_code text not null default '',
  lot_no text not null default '',
  qty_on_hand numeric(18, 4) not null default 0,
  raw_data jsonb not null default '{}'::jsonb,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  source_deleted_at timestamptz,
  last_seen_at timestamptz default now(),
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sc_express_stock_room_loc_product_uk
    unique (room_code, warehouse_code, location_code, product_code, lot_no)
);

comment on table public.sc_express_stock is 'Raw STLOC stock rows from Express DBF (read-only import).';

create table if not exists public.sc_express_so_headers (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  source_file text,
  source_table text,
  source_row_id text,
  source_hash text,
  sync_job_id uuid,
  sync_batch_id uuid references public.sync_batches(id) on delete set null,
  sync_status text,
  document_no text not null,
  customer_code text,
  document_date date,
  delivery_date date,
  status text,
  raw_data jsonb not null default '{}'::jsonb,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  source_deleted_at timestamptz,
  last_seen_at timestamptz default now(),
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sc_express_so_headers_room_doc_uk unique (room_code, document_no)
);

comment on table public.sc_express_so_headers is 'Raw OESO sales order headers from Express DBF (read-only import).';

create table if not exists public.sc_express_so_lines (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  source_file text,
  source_table text,
  source_row_id text,
  source_hash text,
  sync_job_id uuid,
  sync_batch_id uuid references public.sync_batches(id) on delete set null,
  sync_status text,
  so_header_id uuid references public.sc_express_so_headers(id) on delete set null,
  document_no text not null,
  line_no integer not null default 0,
  product_code text not null,
  qty numeric(18, 4) not null default 0,
  uom text,
  status text,
  raw_data jsonb not null default '{}'::jsonb,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  source_deleted_at timestamptz,
  last_seen_at timestamptz default now(),
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sc_express_so_lines_room_doc_line_uk unique (room_code, document_no, line_no)
);

comment on table public.sc_express_so_lines is 'Raw OESOIT sales order lines from Express DBF (read-only import).';

create table if not exists public.sc_express_invoices (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  source_file text,
  source_table text,
  source_row_id text,
  source_hash text,
  sync_job_id uuid,
  sync_batch_id uuid references public.sync_batches(id) on delete set null,
  sync_status text,
  document_no text not null,
  line_no integer,
  customer_code text,
  invoice_date date,
  status text,
  raw_data jsonb not null default '{}'::jsonb,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  source_deleted_at timestamptz,
  last_seen_at timestamptz default now(),
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sc_express_transfers (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  source_file text,
  source_table text,
  source_row_id text,
  source_hash text,
  sync_job_id uuid,
  sync_batch_id uuid references public.sync_batches(id) on delete set null,
  sync_status text,
  document_no text not null,
  from_warehouse_code text,
  to_warehouse_code text,
  transfer_date date,
  status text,
  raw_data jsonb not null default '{}'::jsonb,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  source_deleted_at timestamptz,
  last_seen_at timestamptz default now(),
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sc_express_transfers_room_doc_uk unique (room_code, document_no)
);

comment on table public.sc_express_transfers is 'Raw STTRN transfer rows from Express DBF (read-only import).';

comment on table public.sc_express_invoices is 'Raw ARTRN invoice rows from Express DBF (read-only import).';

create unique index if not exists idx_sc_express_invoices_room_doc_line_uk
  on public.sc_express_invoices (room_code, document_no, coalesce(line_no, -1));

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'sync_jobs', 'sync_batches', 'sync_logs', 'sync_failed_records', 'sync_agent_runs',
    'sc_express_products', 'sc_express_customers', 'sc_express_stock',
    'sc_express_so_headers', 'sc_express_so_lines', 'sc_express_invoices', 'sc_express_transfers'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', tbl, tbl);
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      tbl, tbl
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_sync_jobs_room_code on public.sync_jobs(room_code);
create index if not exists idx_sync_jobs_status on public.sync_jobs(status);
create index if not exists idx_sync_jobs_created_at on public.sync_jobs(created_at desc);
create index if not exists idx_sync_jobs_job_name on public.sync_jobs(job_name);
create index if not exists idx_sync_jobs_job_type on public.sync_jobs(job_type);

create index if not exists idx_sync_failed_records_room_code on public.sync_failed_records(room_code);
create index if not exists idx_sync_batches_sync_job_id on public.sync_batches(sync_job_id);

create index if not exists idx_sc_express_products_room_code on public.sc_express_products(room_code);
create index if not exists idx_sc_express_products_product_code on public.sc_express_products(product_code);
create index if not exists idx_sc_express_products_synced_at on public.sc_express_products(synced_at desc);

create index if not exists idx_sc_express_customers_room_code on public.sc_express_customers(room_code);
create index if not exists idx_sc_express_customers_customer_code on public.sc_express_customers(customer_code);
create index if not exists idx_sc_express_customers_synced_at on public.sc_express_customers(synced_at desc);

create index if not exists idx_sc_express_stock_room_code on public.sc_express_stock(room_code);
create index if not exists idx_sc_express_stock_product_code on public.sc_express_stock(product_code);
create index if not exists idx_sc_express_stock_synced_at on public.sc_express_stock(synced_at desc);

create index if not exists idx_sc_express_so_headers_room_code on public.sc_express_so_headers(room_code);
create index if not exists idx_sc_express_so_headers_document_no on public.sc_express_so_headers(document_no);
create index if not exists idx_sc_express_so_headers_doc_date on public.sc_express_so_headers(document_date desc);
create index if not exists idx_sc_express_so_headers_synced_at on public.sc_express_so_headers(synced_at desc);

create index if not exists idx_sc_express_so_lines_room_code on public.sc_express_so_lines(room_code);
create index if not exists idx_sc_express_so_lines_document_no on public.sc_express_so_lines(document_no);
create index if not exists idx_sc_express_so_lines_product_code on public.sc_express_so_lines(product_code);
create index if not exists idx_sc_express_so_lines_synced_at on public.sc_express_so_lines(synced_at desc);

create index if not exists idx_sc_express_invoices_room_code on public.sc_express_invoices(room_code);
create index if not exists idx_sc_express_invoices_document_no on public.sc_express_invoices(document_no);
create index if not exists idx_sc_express_invoices_doc_date on public.sc_express_invoices(invoice_date desc);
create index if not exists idx_sc_express_invoices_synced_at on public.sc_express_invoices(synced_at desc);

create index if not exists idx_sc_express_transfers_room_code on public.sc_express_transfers(room_code);
create index if not exists idx_sc_express_transfers_document_no on public.sc_express_transfers(document_no);
create index if not exists idx_sc_express_transfers_synced_at on public.sc_express_transfers(synced_at desc);

-- ---------------------------------------------------------------------------
-- Web-facing read models (React should prefer these over large raw tables)
-- ---------------------------------------------------------------------------
create or replace view public.sc_web_product_master_view as
select
  p.id,
  p.room_code,
  p.product_code,
  p.product_name,
  p.product_description,
  p.product_group,
  p.uom,
  p.source_file,
  p.synced_at,
  p.updated_at
from public.sc_express_products p;

create or replace view public.sc_web_customer_master_view as
select
  c.id,
  c.room_code,
  c.customer_code,
  c.customer_name,
  c.customer_group,
  c.sales_code,
  c.source_file,
  c.synced_at,
  c.updated_at
from public.sc_express_customers c;

create or replace view public.sc_web_stock_balance_view as
select
  s.id,
  s.room_code,
  s.product_code,
  p.product_name,
  p.product_group,
  s.warehouse_code,
  s.location_code,
  s.lot_no,
  s.qty_on_hand,
  s.source_file,
  s.synced_at,
  s.updated_at
from public.sc_express_stock s
left join public.sc_express_products p
  on p.room_code = s.room_code
 and p.product_code = s.product_code;

create or replace view public.sc_web_sales_order_view as
select
  h.id,
  h.room_code,
  h.document_no as so_no,
  h.customer_code,
  c.customer_name,
  h.document_date as doc_date,
  h.delivery_date,
  h.status,
  h.source_file,
  h.synced_at,
  h.updated_at
from public.sc_express_so_headers h
left join public.sc_express_customers c
  on c.room_code = h.room_code
 and c.customer_code = h.customer_code;

create or replace view public.sc_web_sales_order_lines_view as
select
  l.id,
  l.room_code,
  l.document_no as so_no,
  l.line_no,
  l.product_code,
  p.product_name,
  l.qty,
  l.uom,
  l.status,
  h.document_date as doc_date,
  h.customer_code,
  l.source_file,
  l.synced_at,
  l.updated_at
from public.sc_express_so_lines l
left join public.sc_express_so_headers h
  on h.room_code = l.room_code
 and h.document_no = l.document_no
left join public.sc_express_products p
  on p.room_code = l.room_code
 and p.product_code = l.product_code;

create or replace view public.sc_web_sales_dashboard_view as
select
  h.room_code,
  h.document_date as doc_date,
  count(distinct h.document_no) as order_count,
  count(l.id) as line_count,
  coalesce(sum(l.qty), 0) as total_qty,
  max(h.synced_at) as last_synced_at
from public.sc_express_so_headers h
left join public.sc_express_so_lines l
  on l.room_code = h.room_code
 and l.document_no = h.document_no
group by h.room_code, h.document_date;

create or replace view public.sc_web_atp_view as
select
  s.room_code,
  s.product_code,
  p.product_name,
  p.product_group,
  s.warehouse_code,
  s.location_code,
  s.lot_no,
  s.qty_on_hand as on_hand_qty,
  s.qty_on_hand as atp_qty,
  s.synced_at,
  s.updated_at
from public.sc_express_stock s
left join public.sc_express_products p
  on p.room_code = s.room_code
 and p.product_code = s.product_code;

comment on view public.sc_web_atp_view is 'Simplified ATP from Express stock only (no reservation deduction in read-only golive).';

create or replace view public.sc_web_shortage_view as
select
  s.room_code,
  s.product_code,
  p.product_name,
  p.product_group,
  s.warehouse_code,
  s.location_code,
  s.qty_on_hand,
  coalesce(open_so.open_qty, 0) as open_so_qty,
  greatest(coalesce(open_so.open_qty, 0) - s.qty_on_hand, 0) as shortage_qty,
  s.synced_at,
  s.updated_at
from public.sc_express_stock s
left join public.sc_express_products p
  on p.room_code = s.room_code
 and p.product_code = s.product_code
left join (
  select
    room_code,
    product_code,
    sum(qty) as open_qty
  from public.sc_express_so_lines
  where coalesce(status, 'synced') not in ('closed', 'cancelled', 'completed')
  group by room_code, product_code
) open_so
  on open_so.room_code = s.room_code
 and open_so.product_code = s.product_code
where s.qty_on_hand <= 0
   or greatest(coalesce(open_so.open_qty, 0) - s.qty_on_hand, 0) > 0;

comment on view public.sc_web_shortage_view is 'Express stock vs open SO qty — read-only shortage signal.';

-- ---------------------------------------------------------------------------
-- Grants + read-only RLS for anon UAT (service role bypasses RLS for sync agent)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.sync_jobs to anon, authenticated;
grant select on public.sync_failed_records to anon, authenticated;
grant select on public.sc_express_products to anon, authenticated;
grant select on public.sc_express_customers to anon, authenticated;
grant select on public.sc_express_stock to anon, authenticated;
grant select on public.sc_express_so_headers to anon, authenticated;
grant select on public.sc_express_so_lines to anon, authenticated;
grant select on public.sc_express_invoices to anon, authenticated;
grant select on public.sc_express_transfers to anon, authenticated;

grant select on public.sc_web_product_master_view to anon, authenticated;
grant select on public.sc_web_customer_master_view to anon, authenticated;
grant select on public.sc_web_stock_balance_view to anon, authenticated;
grant select on public.sc_web_sales_order_view to anon, authenticated;
grant select on public.sc_web_sales_order_lines_view to anon, authenticated;
grant select on public.sc_web_sales_dashboard_view to anon, authenticated;
grant select on public.sc_web_atp_view to anon, authenticated;
grant select on public.sc_web_shortage_view to anon, authenticated;

alter table public.sync_jobs enable row level security;
alter table public.sync_failed_records enable row level security;
alter table public.sc_express_products enable row level security;
alter table public.sc_express_customers enable row level security;
alter table public.sc_express_stock enable row level security;
alter table public.sc_express_so_headers enable row level security;
alter table public.sc_express_so_lines enable row level security;
alter table public.sc_express_invoices enable row level security;
alter table public.sc_express_transfers enable row level security;

drop policy if exists p_sync_jobs_anon_read on public.sync_jobs;
create policy p_sync_jobs_anon_read on public.sync_jobs for select to anon, authenticated using (true);

drop policy if exists p_sync_failed_records_anon_read on public.sync_failed_records;
create policy p_sync_failed_records_anon_read on public.sync_failed_records for select to anon, authenticated using (true);

drop policy if exists p_sc_express_products_anon_read on public.sc_express_products;
create policy p_sc_express_products_anon_read on public.sc_express_products for select to anon, authenticated using (true);

drop policy if exists p_sc_express_customers_anon_read on public.sc_express_customers;
create policy p_sc_express_customers_anon_read on public.sc_express_customers for select to anon, authenticated using (true);

drop policy if exists p_sc_express_stock_anon_read on public.sc_express_stock;
create policy p_sc_express_stock_anon_read on public.sc_express_stock for select to anon, authenticated using (true);

drop policy if exists p_sc_express_so_headers_anon_read on public.sc_express_so_headers;
create policy p_sc_express_so_headers_anon_read on public.sc_express_so_headers for select to anon, authenticated using (true);

drop policy if exists p_sc_express_so_lines_anon_read on public.sc_express_so_lines;
create policy p_sc_express_so_lines_anon_read on public.sc_express_so_lines for select to anon, authenticated using (true);

drop policy if exists p_sc_express_invoices_anon_read on public.sc_express_invoices;
create policy p_sc_express_invoices_anon_read on public.sc_express_invoices for select to anon, authenticated using (true);

drop policy if exists p_sc_express_transfers_anon_read on public.sc_express_transfers;
create policy p_sc_express_transfers_anon_read on public.sc_express_transfers for select to anon, authenticated using (true);

-- Notify PostgREST to reload schema cache
notify pgrst, 'reload schema';
