-- SKU admin read model + request-only setting changes (no Express STMAS write-back)

create or replace view public.sc_web_sku_admin_view as
select
  p.id,
  p.room_code,
  p.product_code,
  coalesce(nullif(p.product_name, ''), p.product_code) as product_name,
  coalesce(nullif(p.product_group, ''), nullif(p.raw_data->>'product_category', ''), 'อื่นๆ') as product_group,
  coalesce(nullif(p.uom, ''), nullif(p.raw_data->>'base_uom', ''), nullif(p.raw_data->>'unit', ''), 'KG') as uom,
  coalesce(nullif(p.raw_data->>'plant', ''), p.room_code) as plant_code,
  coalesce(nullif(p.raw_data->>'active_status', ''), nullif(p.raw_data->>'is_active', ''), 'active') as active_status,
  coalesce(nullif(p.raw_data->>'pack_size', '')::numeric, nullif(p.raw_data->>'weight', '')::numeric, 0)::numeric(18, 4) as pack_size,
  coalesce(nullif(p.raw_data->>'min_stock', '')::numeric, 50)::numeric(18, 4) as min_stock,
  coalesce(nullif(p.raw_data->>'shelf_life', '')::numeric, 30)::numeric(18, 4) as shelf_life_days,
  coalesce(nullif(p.raw_data->>'lead_time', '')::numeric, nullif(p.raw_data->>'lt', '')::numeric, 7)::numeric(18, 4) as lead_time_days,
  coalesce(nullif(p.raw_data->>'moq', '')::numeric, 0)::numeric(18, 4) as moq,
  coalesce(nullif(p.raw_data->>'forecast_class', ''), 'standard') as forecast_class,
  p.synced_at,
  p.updated_at
from public.sc_express_products p;

comment on view public.sc_web_sku_admin_view is
  'SKU admin workbench from Express STMAS sync — read-only product master with planning fields from raw_data.';

create table if not exists public.sc_sku_setting_requests (
  id uuid primary key default gen_random_uuid(),
  request_no varchar(50),
  request_date date default current_date,
  room_code varchar(20) not null default 'TSS',
  product_code varchar(50) not null,
  product_name varchar(255),
  proposed_changes jsonb not null default '{}'::jsonb,
  reason text,
  status varchar(50) default 'submitted' check (
    status in ('draft', 'submitted', 'approved', 'rejected', 'cancelled')
  ),
  express_queue_status varchar(50) default 'blocked_by_governance',
  requester varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sc_sku_setting_req_product on public.sc_sku_setting_requests(product_code);
create index if not exists idx_sc_sku_setting_req_status on public.sc_sku_setting_requests(status);

comment on table public.sc_sku_setting_requests is
  'SKU setting change requests — Supabase only. No Express STMAS write-back.';

grant select on public.sc_web_sku_admin_view to anon, authenticated;
grant select, insert, update on public.sc_sku_setting_requests to anon, authenticated;

alter table public.sc_sku_setting_requests enable row level security;

drop policy if exists p_sc_sku_setting_req on public.sc_sku_setting_requests;
create policy p_sc_sku_setting_req on public.sc_sku_setting_requests for all to anon, authenticated using (true) with check (true);
