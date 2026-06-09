-- Customer registration legacy snapshot fields (pgCustReg / CR_DOC_SLOTS / existing customer lookup)

alter table public.sc_customer_registration_requests add column if not exists existing_customer_code varchar(50);
alter table public.sc_customer_registration_requests add column if not exists original_customer_snapshot jsonb default '{}'::jsonb;
alter table public.sc_customer_registration_requests add column if not exists proposed_changes jsonb default '{}'::jsonb;
alter table public.sc_customer_registration_requests add column if not exists document_slots jsonb default '[]'::jsonb;
alter table public.sc_customer_registration_requests add column if not exists credit_change_requested text;
alter table public.sc_customer_registration_requests add column if not exists suspend_reason text;
alter table public.sc_customer_registration_requests add column if not exists final_note text;

comment on column public.sc_customer_registration_requests.existing_customer_code is
  'Express customer code from read-only sc_web_customer_master_view lookup.';
comment on column public.sc_customer_registration_requests.original_customer_snapshot is
  'Read-only snapshot loaded from Supabase read model at time of request.';
comment on column public.sc_customer_registration_requests.proposed_changes is
  'Fields proposed to change vs original snapshot.';
comment on column public.sc_customer_registration_requests.document_slots is
  'CR_DOC_SLOTS metadata — files stored as metadata when Storage bucket unavailable.';

notify pgrst, 'reload schema';
