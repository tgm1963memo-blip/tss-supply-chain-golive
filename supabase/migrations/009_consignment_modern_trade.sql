-- Consignment / Modern Trade read models + request-only workflows (no Express SO/CN/stock posting)

-- ── Read views from Express sync ─────────────────────────────────────────────
create or replace view public.sc_web_consi_so_view as
select
  h.id,
  h.room_code,
  h.document_no as so_no,
  h.customer_code,
  coalesce(c.customer_name, h.customer_code) as customer_name,
  h.document_date as doc_date,
  h.delivery_date,
  h.status,
  count(l.id) as line_count,
  coalesce(sum(l.qty), 0)::numeric(18, 4) as total_qty,
  h.synced_at,
  h.updated_at
from public.sc_express_so_headers h
left join public.sc_express_so_lines l
  on l.room_code = h.room_code
 and l.document_no = h.document_no
left join public.sc_express_customers c
  on c.room_code = h.room_code
 and c.customer_code = h.customer_code
where upper(h.room_code) like 'CONSI%'
   or upper(coalesce(h.raw_data->>'company', '')) = 'CONSI'
   or upper(coalesce(h.raw_data->>'order_type', '')) like '%CONSI%'
group by h.id, h.room_code, h.document_no, h.customer_code, c.customer_name,
         h.document_date, h.delivery_date, h.status, h.synced_at, h.updated_at;

comment on view public.sc_web_consi_so_view is
  'Consignment sales orders from Express SO sync — read-only.';

create or replace view public.sc_web_consi_branch_stock_view as
select
  coalesce(h.room_code, l.room_code) as branch_code,
  coalesce(c.customer_name, h.customer_code, h.room_code) as branch_name,
  h.customer_code,
  l.product_code,
  coalesce(p.product_name, l.product_code) as product_name,
  coalesce(sum(l.qty), 0)::numeric(18, 4) as balance_qty,
  0::numeric(18, 4) as min_qty,
  0::numeric(18, 4) as max_qty,
  max(coalesce(h.synced_at, l.synced_at)) as last_synced_at
from public.sc_express_so_lines l
join public.sc_express_so_headers h
  on h.room_code = l.room_code
 and h.document_no = l.document_no
left join public.sc_express_products p
  on p.room_code = l.room_code
 and p.product_code = l.product_code
left join public.sc_express_customers c
  on c.room_code = h.room_code
 and c.customer_code = h.customer_code
where upper(h.room_code) like 'CONSI%'
   or upper(coalesce(h.raw_data->>'company', '')) = 'CONSI'
group by coalesce(h.room_code, l.room_code), coalesce(c.customer_name, h.customer_code, h.room_code),
         h.customer_code, l.product_code, coalesce(p.product_name, l.product_code);

comment on view public.sc_web_consi_branch_stock_view is
  'Branch consignment stock derived from open CONSI SO lines — read-only.';

create or replace view public.sc_web_consi_sales_summary_view as
select
  to_char(h.document_date, 'YYYY-MM') as ym,
  h.room_code as branch_code,
  h.customer_code,
  coalesce(c.customer_name, h.customer_code) as customer_name,
  l.product_code,
  coalesce(p.product_name, l.product_code) as product_name,
  coalesce(nullif(p.raw_data->>'group_name', ''), 'อื่นๆ') as product_group,
  coalesce(sum(l.qty), 0)::numeric(18, 4) as qty,
  coalesce(sum(l.qty * coalesce(nullif(l.raw_data->>'unit_price', '')::numeric, 0)), 0)::numeric(18, 4) as amount
from public.sc_express_so_lines l
join public.sc_express_so_headers h
  on h.room_code = l.room_code
 and h.document_no = l.document_no
left join public.sc_express_products p
  on p.room_code = l.room_code
 and p.product_code = l.product_code
left join public.sc_express_customers c
  on c.room_code = h.room_code
 and c.customer_code = h.customer_code
where upper(h.room_code) like 'CONSI%'
   or upper(coalesce(h.raw_data->>'company', '')) = 'CONSI'
group by to_char(h.document_date, 'YYYY-MM'), h.room_code, h.customer_code,
         coalesce(c.customer_name, h.customer_code), l.product_code,
         coalesce(p.product_name, l.product_code),
         coalesce(nullif(p.raw_data->>'group_name', ''), 'อื่นๆ');

comment on view public.sc_web_consi_sales_summary_view is
  'Monthly consignment sell summary for pgConsignment dashboard — read-only.';

create or replace view public.sc_web_consi_movement_view as
select
  t.id,
  t.room_code,
  t.document_no,
  coalesce(t.raw_data->>'doc_type', 'transfer') as document_type,
  coalesce(t.raw_data->>'product_code', t.raw_data->>'sku', '') as product_code,
  coalesce(t.from_warehouse_code, '') as from_warehouse,
  coalesce(t.to_warehouse_code, '') as to_warehouse,
  coalesce(nullif(t.raw_data->>'qty', '')::numeric, 0)::numeric(18, 4) as qty,
  coalesce(t.status, 'synced') as status,
  t.synced_at
from public.sc_express_transfers t
where upper(t.room_code) like 'CONSI%'
   or upper(coalesce(t.to_warehouse_code, '')) like 'CONSI%'
   or upper(coalesce(t.from_warehouse_code, '')) like 'CONSI%';

comment on view public.sc_web_consi_movement_view is
  'Consignment-related Express transfers — read-only movement visibility.';

-- ── Request tables (REQUEST_ONLY) ────────────────────────────────────────────
create table if not exists public.sc_consi_so_requests (
  id uuid primary key default gen_random_uuid(),
  request_no varchar(50),
  request_date date default current_date,
  room_code varchar(20) not null default 'CONSI',
  branch_code varchar(50),
  customer_code varchar(50),
  customer_name varchar(255),
  delivery_date date,
  note text,
  status varchar(50) default 'draft' check (
    status in ('draft', 'submitted', 'approved', 'rejected', 'cancelled')
  ),
  express_queue_status varchar(50) default 'blocked_by_governance',
  requester varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sc_consi_so_lines (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.sc_consi_so_requests(id) on delete cascade,
  product_code varchar(50) not null,
  product_name varchar(255),
  qty numeric(18, 4) not null default 0,
  uom varchar(20) default 'KG',
  created_at timestamptz default now()
);

create table if not exists public.sc_consi_movement_requests (
  id uuid primary key default gen_random_uuid(),
  request_no varchar(50),
  request_date date default current_date,
  room_code varchar(20) not null default 'CONSI',
  movement_type varchar(30) default 'temp_dn' check (
    movement_type in ('temp_dn', 'branch_transfer', 'replenishment')
  ),
  branch_code varchar(50),
  customer_code varchar(50),
  product_code varchar(50),
  qty numeric(18, 4) not null default 0,
  reference_no varchar(50),
  reason text,
  status varchar(50) default 'submitted' check (
    status in ('draft', 'submitted', 'approved', 'rejected', 'cancelled')
  ),
  express_queue_status varchar(50) default 'blocked_by_governance',
  requester varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sc_consi_sell_out_requests (
  id uuid primary key default gen_random_uuid(),
  request_no varchar(50),
  record_date date default current_date,
  branch_code varchar(50),
  customer_code varchar(50),
  customer_name varchar(255),
  product_code varchar(50) not null,
  product_name varchar(255),
  sell_qty numeric(18, 4) not null default 0,
  uom varchar(20) default 'KG',
  note text,
  status varchar(50) default 'submitted' check (
    status in ('draft', 'submitted', 'approved', 'rejected', 'cancelled')
  ),
  express_queue_status varchar(50) default 'blocked_by_governance',
  requester varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sc_consi_return_branch_requests (
  id uuid primary key default gen_random_uuid(),
  request_no varchar(50),
  request_date date default current_date,
  branch_code varchar(50),
  customer_code varchar(50),
  customer_name varchar(255),
  product_code varchar(50) not null,
  product_name varchar(255),
  return_qty numeric(18, 4) not null default 0,
  uom varchar(20) default 'KG',
  lot_no varchar(50),
  reason text,
  status varchar(50) default 'submitted' check (
    status in ('draft', 'submitted', 'approved', 'rejected', 'cancelled')
  ),
  express_queue_status varchar(50) default 'blocked_by_governance',
  requester varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sc_consi_return_cn_requests (
  id uuid primary key default gen_random_uuid(),
  request_no varchar(50),
  request_date date default current_date,
  branch_code varchar(50),
  customer_code varchar(50),
  customer_name varchar(255),
  invoice_ref varchar(50),
  reason text,
  stock_impact_flag boolean default true,
  status varchar(50) default 'draft' check (
    status in ('draft', 'submitted', 'approved', 'rejected', 'cancelled', 'revision_requested')
  ),
  express_queue_status varchar(50) default 'blocked_by_governance',
  requester varchar(255),
  internal_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sc_consi_return_cn_lines (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.sc_consi_return_cn_requests(id) on delete cascade,
  product_code varchar(50) not null,
  product_name varchar(255),
  qty numeric(18, 4) not null default 0,
  unit varchar(20) default 'กก.',
  lot_no varchar(50),
  line_reason text,
  created_at timestamptz default now()
);

create index if not exists idx_sc_consi_so_req_status on public.sc_consi_so_requests(status);
create index if not exists idx_sc_consi_movement_req_status on public.sc_consi_movement_requests(status);
create index if not exists idx_sc_consi_sell_out_status on public.sc_consi_sell_out_requests(status);
create index if not exists idx_sc_consi_return_branch_status on public.sc_consi_return_branch_requests(status);
create index if not exists idx_sc_consi_return_cn_status on public.sc_consi_return_cn_requests(status);

comment on table public.sc_consi_so_requests is 'Consignment SO requests — Supabase only, Express posting blocked_by_governance.';
comment on table public.sc_consi_movement_requests is 'Temp DN / consignment movement requests — no Express write-back.';
comment on table public.sc_consi_sell_out_requests is 'Branch sell-out records as requests — no stock posting.';
comment on table public.sc_consi_return_branch_requests is 'Return from branch requests — no Express GR.';
comment on table public.sc_consi_return_cn_requests is 'CONSI return/CN requests — no Express CN posting.';

-- ── Grants & RLS ─────────────────────────────────────────────────────────────
grant select on public.sc_web_consi_so_view to anon, authenticated;
grant select on public.sc_web_consi_branch_stock_view to anon, authenticated;
grant select on public.sc_web_consi_sales_summary_view to anon, authenticated;
grant select on public.sc_web_consi_movement_view to anon, authenticated;

grant select, insert, update on public.sc_consi_so_requests to anon, authenticated;
grant select, insert, update, delete on public.sc_consi_so_lines to anon, authenticated;
grant select, insert, update on public.sc_consi_movement_requests to anon, authenticated;
grant select, insert, update on public.sc_consi_sell_out_requests to anon, authenticated;
grant select, insert, update on public.sc_consi_return_branch_requests to anon, authenticated;
grant select, insert, update on public.sc_consi_return_cn_requests to anon, authenticated;
grant select, insert, update, delete on public.sc_consi_return_cn_lines to anon, authenticated;

alter table public.sc_consi_so_requests enable row level security;
alter table public.sc_consi_so_lines enable row level security;
alter table public.sc_consi_movement_requests enable row level security;
alter table public.sc_consi_sell_out_requests enable row level security;
alter table public.sc_consi_return_branch_requests enable row level security;
alter table public.sc_consi_return_cn_requests enable row level security;
alter table public.sc_consi_return_cn_lines enable row level security;

drop policy if exists p_sc_consi_so_req on public.sc_consi_so_requests;
create policy p_sc_consi_so_req on public.sc_consi_so_requests for all to anon, authenticated using (true) with check (true);

drop policy if exists p_sc_consi_so_lines on public.sc_consi_so_lines;
create policy p_sc_consi_so_lines on public.sc_consi_so_lines for all to anon, authenticated using (true) with check (true);

drop policy if exists p_sc_consi_movement_req on public.sc_consi_movement_requests;
create policy p_sc_consi_movement_req on public.sc_consi_movement_requests for all to anon, authenticated using (true) with check (true);

drop policy if exists p_sc_consi_sell_out on public.sc_consi_sell_out_requests;
create policy p_sc_consi_sell_out on public.sc_consi_sell_out_requests for all to anon, authenticated using (true) with check (true);

drop policy if exists p_sc_consi_return_branch on public.sc_consi_return_branch_requests;
create policy p_sc_consi_return_branch on public.sc_consi_return_branch_requests for all to anon, authenticated using (true) with check (true);

drop policy if exists p_sc_consi_return_cn on public.sc_consi_return_cn_requests;
create policy p_sc_consi_return_cn on public.sc_consi_return_cn_requests for all to anon, authenticated using (true) with check (true);

drop policy if exists p_sc_consi_return_cn_lines on public.sc_consi_return_cn_lines;
create policy p_sc_consi_return_cn_lines on public.sc_consi_return_cn_lines for all to anon, authenticated using (true) with check (true);
