-- Sales Forecast, Return/CN requests, Sample & Consumable (Supabase-only — no Express write-back)

-- ── Sales Forecast (legacy pgForecast / forecasts) ──────────────────────────
create table if not exists public.sc_sales_forecasts (
  id uuid primary key default gen_random_uuid(),
  customer_code varchar(50),
  sku_code varchar(50) not null,
  sku_name varchar(255),
  qty numeric(15, 3) not null default 0,
  deliv_date date,
  delivery_month varchar(7),
  template varchar(20) default 'week',
  week_no integer,
  note text,
  approved boolean default false,
  created_by varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sc_sales_fc_month on public.sc_sales_forecasts(delivery_month);
create index if not exists idx_sc_sales_fc_cust on public.sc_sales_forecasts(customer_code);
create index if not exists idx_sc_sales_fc_sku on public.sc_sales_forecasts(sku_code);

comment on table public.sc_sales_forecasts is
  'Sales forecast lines — Supabase workflow only. Does not write Express.';

-- ── Return / CN (request-only — no Express ARTRN post) ─────────────────────
create table if not exists public.sc_return_cn_requests (
  id uuid primary key default gen_random_uuid(),
  request_no varchar(50),
  request_date date default current_date,
  request_type varchar(20) default 'return' check (request_type in ('return', 'cn')),
  reason text,
  customer_code varchar(50),
  customer_name varchar(255),
  invoice_ref varchar(100),
  stock_impact_flag boolean default false,
  status varchar(50) default 'draft' check (
    status in ('draft', 'submitted', 'approved', 'rejected', 'revision_requested', 'cancelled')
  ),
  express_queue_status varchar(50) default 'blocked_by_governance',
  requester varchar(255),
  internal_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sc_return_cn_lines (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.sc_return_cn_requests(id) on delete cascade,
  product_code varchar(50),
  product_name varchar(255),
  qty numeric(15, 3) default 0,
  unit varchar(20) default 'กก.',
  lot_no varchar(50),
  line_reason text,
  created_at timestamptz default now()
);

create table if not exists public.sc_return_cn_approval_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.sc_return_cn_requests(id) on delete cascade,
  action varchar(50),
  from_status text,
  to_status text,
  actor_name varchar(255),
  comment text,
  created_at timestamptz default now()
);

create index if not exists idx_sc_return_cn_req_status on public.sc_return_cn_requests(status);
create index if not exists idx_sc_return_cn_lines_req on public.sc_return_cn_lines(request_id);

comment on table public.sc_return_cn_requests is
  'Return/CN requests — Supabase only. Express CN posting is BLOCKED_BY_GOVERNANCE.';

-- ── Sample & Consumable (legacy pgSample / sample_requests) ────────────────
create table if not exists public.sc_sample_consumable_requests (
  id uuid primary key default gen_random_uuid(),
  request_no varchar(50),
  request_date date default current_date,
  customer_code varchar(50),
  customer_name varchar(255),
  contact_person varchar(255),
  phone varchar(100),
  purpose text,
  delivery_date date,
  delivery_address text,
  note text,
  status varchar(50) default 'draft' check (
    status in ('draft', 'pending', 'approved', 'rejected', 'preparing', 'dispatched', 'received', 'cancelled')
  ),
  requester varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sc_sample_consumable_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.sc_sample_consumable_requests(id) on delete cascade,
  sku_code varchar(50),
  sku_name varchar(255),
  qty numeric(15, 3) default 1,
  unit varchar(20) default 'กก.',
  note text,
  created_at timestamptz default now()
);

create table if not exists public.sc_sample_consumable_approval_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.sc_sample_consumable_requests(id) on delete cascade,
  action varchar(50),
  from_status text,
  to_status text,
  actor_name varchar(255),
  comment text,
  created_at timestamptz default now()
);

create index if not exists idx_sc_sample_req_status on public.sc_sample_consumable_requests(status);
create index if not exists idx_sc_sample_items_req on public.sc_sample_consumable_items(request_id);

comment on table public.sc_sample_consumable_requests is
  'Sample/consumable issue requests — Supabase only. No stock deduction or goods issue to Express.';

-- RLS (permissive for anon dev — same pattern as 004)
alter table public.sc_sales_forecasts enable row level security;
alter table public.sc_return_cn_requests enable row level security;
alter table public.sc_return_cn_lines enable row level security;
alter table public.sc_return_cn_approval_logs enable row level security;
alter table public.sc_sample_consumable_requests enable row level security;
alter table public.sc_sample_consumable_items enable row level security;
alter table public.sc_sample_consumable_approval_logs enable row level security;

drop policy if exists p_sc_sales_fc_all on public.sc_sales_forecasts;
create policy p_sc_sales_fc_all on public.sc_sales_forecasts for all to anon, authenticated using (true) with check (true);

drop policy if exists p_sc_return_cn_req_all on public.sc_return_cn_requests;
create policy p_sc_return_cn_req_all on public.sc_return_cn_requests for all to anon, authenticated using (true) with check (true);

drop policy if exists p_sc_return_cn_lines_all on public.sc_return_cn_lines;
create policy p_sc_return_cn_lines_all on public.sc_return_cn_lines for all to anon, authenticated using (true) with check (true);

drop policy if exists p_sc_return_cn_log_all on public.sc_return_cn_approval_logs;
create policy p_sc_return_cn_log_all on public.sc_return_cn_approval_logs for all to anon, authenticated using (true) with check (true);

drop policy if exists p_sc_sample_req_all on public.sc_sample_consumable_requests;
create policy p_sc_sample_req_all on public.sc_sample_consumable_requests for all to anon, authenticated using (true) with check (true);

drop policy if exists p_sc_sample_items_all on public.sc_sample_consumable_items;
create policy p_sc_sample_items_all on public.sc_sample_consumable_items for all to anon, authenticated using (true) with check (true);

drop policy if exists p_sc_sample_log_all on public.sc_sample_consumable_approval_logs;
create policy p_sc_sample_log_all on public.sc_sample_consumable_approval_logs for all to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on public.sc_sales_forecasts to anon, authenticated;
grant select, insert, update, delete on public.sc_return_cn_requests to anon, authenticated;
grant select, insert, update, delete on public.sc_return_cn_lines to anon, authenticated;
grant select, insert, update, delete on public.sc_return_cn_approval_logs to anon, authenticated;
grant select, insert, update, delete on public.sc_sample_consumable_requests to anon, authenticated;
grant select, insert, update, delete on public.sc_sample_consumable_items to anon, authenticated;
grant select, insert, update, delete on public.sc_sample_consumable_approval_logs to anon, authenticated;

notify pgrst, 'reload schema';
