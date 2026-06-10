-- Planning read models + reservation request tables (golive read-only / REQUEST_ONLY)
-- No Express DBF write-back. Production/PO creation remains blocked at UI layer.

-- ── Reservations (Supabase workflow — not Express stock posting) ─────────────
create table if not exists public.sc_reservations (
  id uuid primary key default gen_random_uuid(),
  room_code varchar(20) not null,
  document_no varchar(50),
  document_type varchar(50),
  document_id uuid,
  source_module varchar(50),
  source_document_type varchar(50),
  source_document_no varchar(50),
  source_document_line_ref varchar(50),
  customer_code varchar(50),
  idempotency_key text,
  status varchar(30) not null default 'draft' check (
    status in ('draft', 'active', 'partially_released', 'released', 'cancelled', 'expired')
  ),
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sc_reservation_lines (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.sc_reservations(id) on delete cascade,
  room_code varchar(20) not null,
  document_no varchar(50),
  product_code varchar(50) not null,
  warehouse_code varchar(50),
  location_code varchar(50),
  requested_qty numeric(18, 4) not null default 0,
  reserved_qty numeric(18, 4) not null default 0,
  allocated_qty numeric(18, 4) not null default 0,
  uom varchar(20),
  status varchar(30) not null default 'draft' check (
    status in ('draft', 'active', 'partially_released', 'released', 'cancelled', 'expired')
  ),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sc_reservations_room_doc on public.sc_reservations(room_code, document_no);
create index if not exists idx_sc_reservations_source on public.sc_reservations(
  room_code, source_module, source_document_type, source_document_no
);
create index if not exists idx_sc_reservation_lines_res on public.sc_reservation_lines(reservation_id);
create index if not exists idx_sc_reservation_lines_product on public.sc_reservation_lines(product_code);

comment on table public.sc_reservations is
  'Reservation headers — Supabase request workflow. Does not post Express stock.';

-- ── Inventory balance read model (Express stock + active reservations) ───────
create or replace view public.sc_inventory_balance_view as
select
  s.room_code,
  s.product_code,
  p.product_name,
  s.warehouse_code,
  s.location_code,
  s.lot_no,
  s.qty_on_hand::numeric(18, 4) as erp_on_hand_qty,
  0::numeric(18, 4) as ledger_delta_qty,
  s.qty_on_hand::numeric(18, 4) as calculated_on_hand_qty,
  coalesce(res.reserved_qty, 0)::numeric(18, 4) as reserved_qty,
  greatest(s.qty_on_hand - coalesce(res.reserved_qty, 0), 0)::numeric(18, 4) as available_qty,
  0::numeric(18, 4) as future_supply_qty,
  s.updated_at as source_updated_at
from public.sc_express_stock s
left join public.sc_express_products p
  on p.room_code = s.room_code
 and p.product_code = s.product_code
left join (
  select
    room_code,
    product_code,
    warehouse_code,
    location_code,
    sum(reserved_qty) as reserved_qty
  from public.sc_reservation_lines
  where status = 'active'
  group by room_code, product_code, warehouse_code, location_code
) res
  on res.room_code = s.room_code
 and res.product_code = s.product_code
 and coalesce(res.warehouse_code, '') = coalesce(s.warehouse_code, '')
 and coalesce(res.location_code, '') = coalesce(s.location_code, '');

comment on view public.sc_inventory_balance_view is
  'Golive inventory balance from Express sync + Supabase reservations (read-only).';

-- ── Demand / shortage pick-pack candidate (L2A column aliases) ───────────────
create or replace view public.sc_so_pick_pack_candidate_view as
with stock_by_product as (
  select
    room_code,
    product_code,
    sum(available_qty) as available_qty
  from public.sc_inventory_balance_view
  group by room_code, product_code
)
select
  h.room_code as wh_room,
  h.room_code,
  'sales'::text as source_module,
  'sales_order'::text as source_document_type,
  h.document_no as source_document_no,
  l.line_no::text as source_document_line_ref,
  h.document_no as so_no,
  l.line_no::text as so_line_no,
  h.customer_code,
  c.customer_name,
  h.document_date,
  h.delivery_date as ship_date,
  l.product_code,
  p.product_name,
  l.qty::numeric(18, 4) as required_qty,
  l.qty::numeric(18, 4) as requested_qty,
  coalesce(rl.reserved_qty, 0)::numeric(18, 4) as reserved_qty,
  coalesce(st.available_qty, 0)::numeric(18, 4) as available_qty,
  greatest(l.qty::numeric(18, 4) - coalesce(st.available_qty, 0), 0)::numeric(18, 4) as shortage_qty,
  r.id as reservation_id,
  r.status as reservation_status,
  rl.id as reservation_line_id,
  rl.status as reservation_line_status,
  rl.warehouse_code as reserved_warehouse_code,
  rl.location_code as reserved_location_code,
  case
    when r.id is not null and rl.status = 'active' and coalesce(rl.reserved_qty, 0) >= l.qty then 'READY_TO_PICK'
    when r.id is null and coalesce(st.available_qty, 0) >= l.qty then 'READY_TO_PICK'
    when coalesce(st.available_qty, 0) < l.qty then 'SHORT_STOCK'
    when r.id is null then 'NEED_RESERVATION'
    else 'NEED_REVIEW'
  end as pick_readiness,
  h.created_at as so_created_at
from public.sc_express_so_headers h
join public.sc_express_so_lines l
  on l.room_code = h.room_code
 and l.document_no = h.document_no
left join public.sc_express_customers c
  on c.room_code = h.room_code
 and c.customer_code = h.customer_code
left join public.sc_express_products p
  on p.room_code = h.room_code
 and p.product_code = l.product_code
left join stock_by_product st
  on st.room_code = h.room_code
 and st.product_code = l.product_code
left join public.sc_reservations r
  on r.room_code = h.room_code
 and r.source_document_no = h.document_no
 and r.source_document_line_ref = l.line_no::text
 and r.status = 'active'
left join public.sc_reservation_lines rl
  on rl.reservation_id = r.id
 and rl.product_code = l.product_code
 and rl.status = 'active'
where coalesce(l.status, h.status, 'synced') not in ('closed', 'cancelled', 'completed');

comment on view public.sc_so_pick_pack_candidate_view is
  'Demand planning / shortage read model with L2A aliases. Read-only — no stock posting.';

-- ── Planning suggestion requests (REQUEST_ONLY — no live PO / production) ───
create table if not exists public.sc_planning_production_requests (
  id uuid primary key default gen_random_uuid(),
  request_no varchar(50),
  sku_code varchar(50) not null,
  sku_name varchar(255),
  suggested_qty numeric(15, 3) not null default 0,
  reason text,
  status varchar(50) default 'draft' check (
    status in ('draft', 'submitted', 'approved', 'rejected', 'cancelled')
  ),
  express_queue_status varchar(50) default 'blocked_by_governance',
  requester varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sc_planning_purchase_requests (
  id uuid primary key default gen_random_uuid(),
  request_no varchar(50),
  sku_code varchar(50) not null,
  sku_name varchar(255),
  suggested_qty numeric(15, 3) not null default 0,
  reason text,
  status varchar(50) default 'draft' check (
    status in ('draft', 'submitted', 'approved', 'rejected', 'cancelled')
  ),
  express_queue_status varchar(50) default 'blocked_by_governance',
  requester varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.sc_planning_production_requests is
  'Production suggestion requests only — express_queue_status blocked_by_governance.';
comment on table public.sc_planning_purchase_requests is
  'Purchase suggestion requests only — express_queue_status blocked_by_governance.';

-- ── Grants (anon UAT read) ───────────────────────────────────────────────────
grant select on public.sc_inventory_balance_view to anon, authenticated;
grant select on public.sc_so_pick_pack_candidate_view to anon, authenticated;
grant select on public.sc_reservations to anon, authenticated;
grant select on public.sc_reservation_lines to anon, authenticated;
grant select, insert, update on public.sc_planning_production_requests to anon, authenticated;
grant select, insert, update on public.sc_planning_purchase_requests to anon, authenticated;

alter table public.sc_reservations enable row level security;
alter table public.sc_reservation_lines enable row level security;
alter table public.sc_planning_production_requests enable row level security;
alter table public.sc_planning_purchase_requests enable row level security;

drop policy if exists p_sc_reservations_anon_read on public.sc_reservations;
create policy p_sc_reservations_anon_read on public.sc_reservations for select to anon, authenticated using (true);

drop policy if exists p_sc_reservation_lines_anon_read on public.sc_reservation_lines;
create policy p_sc_reservation_lines_anon_read on public.sc_reservation_lines for select to anon, authenticated using (true);

drop policy if exists p_sc_plan_prod_req_anon on public.sc_planning_production_requests;
create policy p_sc_plan_prod_req_anon on public.sc_planning_production_requests for all to anon, authenticated using (true) with check (true);

drop policy if exists p_sc_plan_po_req_anon on public.sc_planning_purchase_requests;
create policy p_sc_plan_po_req_anon on public.sc_planning_purchase_requests for all to anon, authenticated using (true) with check (true);
