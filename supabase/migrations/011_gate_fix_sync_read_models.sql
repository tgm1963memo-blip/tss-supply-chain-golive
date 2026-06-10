-- Gate Fix Round 1: sync schema alignment, compatibility read views, anon read policies
-- No data truncation. No Express write-back.

-- ── ARTRN / sc_express_invoices upsert alignment ─────────────────────────────
update public.sc_express_invoices
set line_no = 0
where line_no is null;

drop index if exists public.idx_sc_express_invoices_room_doc_line_uk;

alter table public.sc_express_invoices
  drop constraint if exists sc_express_invoices_room_doc_line_uk;

alter table public.sc_express_invoices
  add constraint sc_express_invoices_room_doc_line_uk
  unique (room_code, document_no, line_no);

comment on constraint sc_express_invoices_room_doc_line_uk on public.sc_express_invoices is
  'Matches express-readonly-sync UPSERT on_conflict=room_code,document_no,line_no';

-- ── STTRN / sc_express_transfers column alignment ────────────────────────────
alter table public.sc_express_transfers add column if not exists transfer_date date;
alter table public.sc_express_transfers add column if not exists document_date date;
alter table public.sc_express_transfers add column if not exists document_no text;
alter table public.sc_express_transfers add column if not exists product_code text;
alter table public.sc_express_transfers add column if not exists product_name text;
alter table public.sc_express_transfers add column if not exists from_warehouse_code text;
alter table public.sc_express_transfers add column if not exists to_warehouse_code text;
alter table public.sc_express_transfers add column if not exists from_location_code text;
alter table public.sc_express_transfers add column if not exists to_location_code text;
alter table public.sc_express_transfers add column if not exists qty numeric(18, 4);
alter table public.sc_express_transfers add column if not exists quantity numeric(18, 4);
alter table public.sc_express_transfers add column if not exists status text;
alter table public.sc_express_transfers add column if not exists raw_data jsonb default '{}'::jsonb;
alter table public.sc_express_transfers add column if not exists synced_at timestamptz default now();

-- ── Compatibility read views (001 definitions — safe recreate) ───────────────
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

create or replace view public.sc_web_product_master_view as
select
  p.id,
  p.room_code,
  p.product_code,
  p.product_name,
  p.product_description,
  p.product_group,
  p.uom,
  coalesce(nullif(p.raw_data->>'barcode', ''), nullif(p.raw_data->>'barcod', ''), nullif(p.raw_data->>'stkbar', '')) as barcode,
  coalesce(nullif(p.raw_data->>'active_status', ''), nullif(p.raw_data->>'is_active', ''), 'active') as active_status,
  p.source_file,
  p.synced_at,
  p.updated_at
from public.sc_express_products p;

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

-- ── SO reservation candidate (management 015 compat — Express golive) ────────
create or replace view public.sc_so_reservation_candidate_view as
select
  h.room_code,
  'sales'::text as source_module,
  'sales_order'::text as source_document_type,
  h.document_no as source_document_no,
  l.line_no::text as source_document_line_ref,
  h.document_no,
  l.line_no,
  h.customer_code,
  h.document_date,
  h.delivery_date,
  h.status as document_status,
  l.status as line_status,
  l.product_code,
  l.qty::numeric(18, 4) as ordered_qty,
  l.qty::numeric(18, 4) as candidate_requested_qty,
  ''::text as warehouse_code,
  ''::text as location_code,
  existing_reservation.id as reservation_id,
  existing_reservation.status as reservation_status,
  (existing_reservation.id is not null) as reservation_exists,
  concat('reservation:', h.room_code, ':sales:sales_order:', h.document_no) as idempotency_key_preview
from public.sc_express_so_headers h
join public.sc_express_so_lines l
  on l.room_code = h.room_code
 and l.document_no = h.document_no
left join lateral (
  select r.id, r.status
  from public.sc_reservations r
  where r.room_code = h.room_code
    and r.source_module = 'sales'
    and r.source_document_type = 'sales_order'
    and r.source_document_no = h.document_no
    and (
      r.source_document_line_ref is null
      or r.source_document_line_ref = l.line_no::text
    )
  order by
    case
      when r.source_document_line_ref = l.line_no::text then 0
      else 1
    end,
    r.created_at desc
  limit 1
) existing_reservation on true;

create or replace view public.sc_so_reservation_fulfillment_location_candidate_view as
with location_availability as (
  select
    room_code,
    product_code,
    warehouse_code,
    location_code,
    sum(available_qty)::numeric(18, 4) as total_available_qty
  from public.sc_inventory_balance_view
  group by room_code, product_code, warehouse_code, location_code
)
select
  c.room_code,
  c.source_module,
  c.source_document_type,
  c.source_document_no,
  c.source_document_line_ref,
  c.document_no,
  c.line_no,
  c.customer_code,
  c.document_date,
  c.delivery_date,
  c.product_code,
  c.candidate_requested_qty,
  la.warehouse_code,
  la.location_code,
  coalesce(la.total_available_qty, 0)::numeric(18, 4) as total_available_qty,
  (coalesce(la.total_available_qty, 0) >= c.candidate_requested_qty) as can_reserve,
  greatest(c.candidate_requested_qty - coalesce(la.total_available_qty, 0), 0)::numeric(18, 4) as shortage_qty,
  c.reservation_exists,
  c.reservation_status,
  c.idempotency_key_preview
from public.sc_so_reservation_candidate_view c
join location_availability la
  on la.room_code = c.room_code
 and la.product_code = c.product_code;

comment on view public.sc_so_reservation_candidate_view is
  'Golive SO reservation candidate read model — read-only, no Express write-back.';
comment on view public.sc_so_reservation_fulfillment_location_candidate_view is
  'Golive SO fulfillment location candidates — anon-safe golive UAT (no auth permission gate).';

-- ── Grants (read-only views + staging SELECT for anon UAT) ───────────────────
grant select on public.sc_express_products to anon, authenticated;
grant select on public.sc_express_customers to anon, authenticated;
grant select on public.sc_express_stock to anon, authenticated;
grant select on public.sc_express_so_headers to anon, authenticated;
grant select on public.sc_express_so_lines to anon, authenticated;
grant select on public.sc_express_invoices to anon, authenticated;
grant select on public.sc_express_transfers to anon, authenticated;

grant select on public.sc_web_customer_master_view to anon, authenticated;
grant select on public.sc_web_stock_balance_view to anon, authenticated;
grant select on public.sc_web_atp_view to anon, authenticated;
grant select on public.sc_web_product_master_view to anon, authenticated;
grant select on public.sc_web_sales_order_lines_view to anon, authenticated;
grant select on public.sc_so_reservation_candidate_view to anon, authenticated;
grant select on public.sc_so_reservation_fulfillment_location_candidate_view to anon, authenticated;

-- ── RLS: SELECT-only for anon/authenticated on synced staging tables ─────────
alter table public.sc_express_products enable row level security;
alter table public.sc_express_customers enable row level security;
alter table public.sc_express_stock enable row level security;
alter table public.sc_express_so_headers enable row level security;
alter table public.sc_express_so_lines enable row level security;
alter table public.sc_express_invoices enable row level security;
alter table public.sc_express_transfers enable row level security;

drop policy if exists p_sc_express_products_anon_read on public.sc_express_products;
create policy p_sc_express_products_anon_read on public.sc_express_products
  for select to anon, authenticated using (true);

drop policy if exists p_sc_express_customers_anon_read on public.sc_express_customers;
create policy p_sc_express_customers_anon_read on public.sc_express_customers
  for select to anon, authenticated using (true);

drop policy if exists p_sc_express_stock_anon_read on public.sc_express_stock;
create policy p_sc_express_stock_anon_read on public.sc_express_stock
  for select to anon, authenticated using (true);

drop policy if exists p_sc_express_so_headers_anon_read on public.sc_express_so_headers;
create policy p_sc_express_so_headers_anon_read on public.sc_express_so_headers
  for select to anon, authenticated using (true);

drop policy if exists p_sc_express_so_lines_anon_read on public.sc_express_so_lines;
create policy p_sc_express_so_lines_anon_read on public.sc_express_so_lines
  for select to anon, authenticated using (true);

drop policy if exists p_sc_express_invoices_anon_read on public.sc_express_invoices;
create policy p_sc_express_invoices_anon_read on public.sc_express_invoices
  for select to anon, authenticated using (true);

drop policy if exists p_sc_express_transfers_anon_read on public.sc_express_transfers;
create policy p_sc_express_transfers_anon_read on public.sc_express_transfers
  for select to anon, authenticated using (true);

notify pgrst, 'reload schema';
