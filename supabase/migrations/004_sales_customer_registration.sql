-- Customer registration request workflow (Supabase-only — no Express ARMAS write-back)

create table if not exists public.sc_customer_registration_requests (
  id uuid primary key default gen_random_uuid(),
  request_no varchar(50),
  request_date date,
  requester varchar(255),
  salesperson varchar(255),
  request_type varchar(50) default 'new_customer',
  status varchar(50) default 'draft' check (
    status in ('draft', 'submitted', 'approved', 'rejected', 'revision_requested', 'cancelled')
  ),
  customer_code_requested varchar(50),
  customer_name_th varchar(255),
  customer_name_en varchar(255),
  corporate_group varchar(255),
  customer_category varchar(255),
  channel varchar(255),
  contact_person varchar(255),
  phone varchar(100),
  email varchar(255),
  line_id varchar(255),
  tax_id varchar(50),
  branch_no varchar(50),
  billing_address text,
  province varchar(100),
  postal_code varchar(20),
  tax_invoice_name varchar(255),
  delivery_name varchar(255),
  delivery_address text,
  delivery_province varchar(100),
  delivery_contact varchar(255),
  delivery_phone varchar(100),
  gps_map_link text,
  credit_term varchar(100),
  credit_limit_requested numeric(15, 2),
  payment_method varchar(100),
  price_tier varchar(100),
  gp_discount_condition text,
  remark text,
  attachments_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.sc_customer_registration_requests is
  'Customer registration/change requests — Supabase workflow only, does not write Express ARMAS.';

create table if not exists public.sc_customer_registration_branches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.sc_customer_registration_requests(id) on delete cascade,
  branch_name varchar(255),
  branch_address text,
  province varchar(100),
  contact_person varchar(255),
  phone varchar(100),
  gps_map_link text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sc_customer_registration_approval_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.sc_customer_registration_requests(id) on delete cascade,
  action varchar(50),
  action_by varchar(255),
  comment text,
  created_at timestamptz default now()
);

create index if not exists idx_sc_cust_reg_req_status on public.sc_customer_registration_requests(status);
create index if not exists idx_sc_cust_reg_req_request_no on public.sc_customer_registration_requests(request_no);
create index if not exists idx_sc_cust_reg_br_req on public.sc_customer_registration_branches(request_id);
create index if not exists idx_sc_cust_reg_log_req on public.sc_customer_registration_approval_logs(request_id);

alter table public.sc_customer_registration_requests enable row level security;
alter table public.sc_customer_registration_branches enable row level security;
alter table public.sc_customer_registration_approval_logs enable row level security;

drop policy if exists p_sc_cust_reg_req_all on public.sc_customer_registration_requests;
create policy p_sc_cust_reg_req_all on public.sc_customer_registration_requests
  for all to anon, authenticated using (true) with check (true);

drop policy if exists p_sc_cust_reg_br_all on public.sc_customer_registration_branches;
create policy p_sc_cust_reg_br_all on public.sc_customer_registration_branches
  for all to anon, authenticated using (true) with check (true);

drop policy if exists p_sc_cust_reg_log_all on public.sc_customer_registration_approval_logs;
create policy p_sc_cust_reg_log_all on public.sc_customer_registration_approval_logs
  for all to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on public.sc_customer_registration_requests to anon, authenticated;
grant select, insert, update, delete on public.sc_customer_registration_branches to anon, authenticated;
grant select, insert, update, delete on public.sc_customer_registration_approval_logs to anon, authenticated;

-- Additive columns for legacy pgCustReg field mapping (safe if table already exists)
alter table public.sc_customer_registration_requests add column if not exists district varchar(100);
alter table public.sc_customer_registration_requests add column if not exists subdistrict varchar(100);
alter table public.sc_customer_registration_requests add column if not exists branch_name varchar(255);
alter table public.sc_customer_registration_requests add column if not exists billing_cycle varchar(100);
alter table public.sc_customer_registration_requests add column if not exists collection_method varchar(255);
alter table public.sc_customer_registration_requests add column if not exists doc_business_registration text;
alter table public.sc_customer_registration_requests add column if not exists doc_tax_certificate text;
alter table public.sc_customer_registration_requests add column if not exists doc_storefront_photo text;
alter table public.sc_customer_registration_requests add column if not exists doc_map_location text;
alter table public.sc_customer_registration_requests add column if not exists doc_other text;
alter table public.sc_customer_registration_requests add column if not exists internal_note text;
alter table public.sc_customer_registration_requests add column if not exists drive_link text;

alter table public.sc_customer_registration_branches add column if not exists delivery_name varchar(255);
alter table public.sc_customer_registration_branches add column if not exists delivery_province varchar(100);
alter table public.sc_customer_registration_branches add column if not exists delivery_contact varchar(255);
alter table public.sc_customer_registration_branches add column if not exists delivery_phone varchar(100);

-- Approval log schema (additive — fixes missing from_status / to_status columns)
alter table public.sc_customer_registration_approval_logs add column if not exists from_status text;
alter table public.sc_customer_registration_approval_logs add column if not exists to_status text;
alter table public.sc_customer_registration_approval_logs add column if not exists actor_user_id uuid;
alter table public.sc_customer_registration_approval_logs add column if not exists actor_name text;
alter table public.sc_customer_registration_approval_logs add column if not exists metadata jsonb default '{}'::jsonb;

-- comment column may already exist from initial create; ensure present
alter table public.sc_customer_registration_approval_logs add column if not exists comment text;

create index if not exists idx_sc_cust_reg_log_req_id on public.sc_customer_registration_approval_logs(request_id);
create index if not exists idx_sc_cust_reg_log_created_desc on public.sc_customer_registration_approval_logs(created_at desc);

notify pgrst, 'reload schema';
