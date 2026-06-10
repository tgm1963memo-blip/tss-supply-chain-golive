-- Warehouse / inventory read models + request-only workflows (no Express stock posting)

-- ── Stock adjustment requests (REQUEST_ONLY) ─────────────────────────────────
create table if not exists public.sc_stock_adjustment_requests (
  id uuid primary key default gen_random_uuid(),
  request_no varchar(50),
  request_date date default current_date,
  room_code varchar(20) not null default 'TSS',
  product_code varchar(50) not null,
  product_name varchar(255),
  warehouse_code varchar(50),
  location_code varchar(50),
  lot_no varchar(50),
  qty_delta numeric(18, 4) not null default 0,
  uom varchar(20) default 'KG',
  adjustment_type varchar(30) default 'adjustment' check (
    adjustment_type in ('adjustment', 'cycle_count', 'hold', 'release')
  ),
  reason text,
  status varchar(50) default 'draft' check (
    status in ('draft', 'submitted', 'approved', 'rejected', 'cancelled')
  ),
  express_queue_status varchar(50) default 'blocked_by_governance',
  requester varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sc_stock_adj_req_status on public.sc_stock_adjustment_requests(status);
create index if not exists idx_sc_stock_adj_req_product on public.sc_stock_adjustment_requests(product_code);

comment on table public.sc_stock_adjustment_requests is
  'Stock adjustment requests — Supabase only. Express posting blocked_by_governance.';

-- ── Receiving confirmation requests (REQUEST_ONLY) ───────────────────────────
create table if not exists public.sc_receiving_confirm_requests (
  id uuid primary key default gen_random_uuid(),
  request_no varchar(50),
  request_date date default current_date,
  room_code varchar(20) not null default 'TSS',
  source_document_no varchar(50),
  source_type varchar(30) default 'transfer',
  supplier_name varchar(255),
  product_code varchar(50),
  expected_qty numeric(18, 4) default 0,
  received_qty numeric(18, 4) default 0,
  lot_no varchar(50),
  status varchar(50) default 'draft' check (
    status in ('draft', 'submitted', 'approved', 'rejected', 'cancelled', 'partial')
  ),
  express_queue_status varchar(50) default 'blocked_by_governance',
  requester varchar(255),
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.sc_receiving_confirm_requests is
  'Receiving/GR confirmation requests — no Express GR posting in golive.';

-- ── Inventory ledger read view (Express transfer sync + adjustment requests) ─
create or replace view public.sc_inventory_ledger as
select
  t.id,
  t.room_code,
  t.document_no,
  coalesce(t.raw_data->>'doc_type', 'transfer') as document_type,
  'transfer'::text as movement_type,
  coalesce(t.raw_data->>'product_code', t.raw_data->>'sku', '') as product_code,
  coalesce(t.to_warehouse_code, t.from_warehouse_code) as warehouse_code,
  coalesce(t.raw_data->>'location_code', '') as location_code,
  coalesce(t.raw_data->>'lot_no', '') as lot_no,
  coalesce(nullif(t.raw_data->>'qty', '')::numeric, 0)::numeric(18, 4) as qty,
  coalesce(t.raw_data->>'uom', 'KG') as uom,
  coalesce(t.status, 'synced') as status,
  t.id as reference_id,
  coalesce(t.synced_at, t.created_at) as created_at
from public.sc_express_transfers t
where coalesce(t.raw_data->>'product_code', t.raw_data->>'sku', '') <> ''
union all
select
  r.id,
  r.room_code,
  r.request_no as document_no,
  'adjustment_request'::text as document_type,
  r.adjustment_type as movement_type,
  r.product_code,
  r.warehouse_code,
  r.location_code,
  r.lot_no,
  r.qty_delta as qty,
  r.uom,
  r.status,
  r.id as reference_id,
  r.created_at
from public.sc_stock_adjustment_requests r
where r.status in ('submitted', 'approved');

comment on view public.sc_inventory_ledger is
  'Read-only movement visibility from Express transfers and adjustment requests. No live posting.';

-- ── Grants ───────────────────────────────────────────────────────────────────
grant select on public.sc_inventory_ledger to anon, authenticated;
grant select, insert, update on public.sc_stock_adjustment_requests to anon, authenticated;
grant select, insert, update on public.sc_receiving_confirm_requests to anon, authenticated;

alter table public.sc_stock_adjustment_requests enable row level security;
alter table public.sc_receiving_confirm_requests enable row level security;

drop policy if exists p_sc_stock_adj_req_anon on public.sc_stock_adjustment_requests;
create policy p_sc_stock_adj_req_anon on public.sc_stock_adjustment_requests for all to anon, authenticated using (true) with check (true);

drop policy if exists p_sc_receiving_req_anon on public.sc_receiving_confirm_requests;
create policy p_sc_receiving_req_anon on public.sc_receiving_confirm_requests for all to anon, authenticated using (true) with check (true);
