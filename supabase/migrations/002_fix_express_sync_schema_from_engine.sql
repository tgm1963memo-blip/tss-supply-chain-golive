-- Migration 002: Fix schema to support Express DBF sync engine payloads
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
-- 1. sync_jobs
ALTER TABLE public.sync_jobs ADD COLUMN IF NOT EXISTS room_code text;
ALTER TABLE public.sync_jobs ADD COLUMN IF NOT EXISTS job_name text;
ALTER TABLE public.sync_jobs ADD COLUMN IF NOT EXISTS job_type text;
ALTER TABLE public.sync_jobs ADD COLUMN IF NOT EXISTS source_table text;
ALTER TABLE public.sync_jobs ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.sync_jobs ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE public.sync_jobs ADD COLUMN IF NOT EXISTS finished_at timestamptz;
ALTER TABLE public.sync_jobs ADD COLUMN IF NOT EXISTS last_error text;

-- 2. sync_batches
ALTER TABLE public.sync_batches ADD COLUMN IF NOT EXISTS sync_job_id uuid REFERENCES public.sync_jobs(id) ON DELETE CASCADE;
ALTER TABLE public.sync_batches ADD COLUMN IF NOT EXISTS room_code text;
ALTER TABLE public.sync_batches ADD COLUMN IF NOT EXISTS source_table text;
ALTER TABLE public.sync_batches ADD COLUMN IF NOT EXISTS batch_no integer;
ALTER TABLE public.sync_batches ADD COLUMN IF NOT EXISTS records_read integer NOT NULL DEFAULT 0;
ALTER TABLE public.sync_batches ADD COLUMN IF NOT EXISTS records_success integer NOT NULL DEFAULT 0;
ALTER TABLE public.sync_batches ADD COLUMN IF NOT EXISTS records_failed integer NOT NULL DEFAULT 0;
ALTER TABLE public.sync_batches ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- 3. sync_logs
ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS sync_job_id uuid REFERENCES public.sync_jobs(id) ON DELETE CASCADE;
ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS room_code text;
ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS source_table text;
ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'info';
ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS message text NOT NULL;
ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS detail jsonb;
ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS status text;

-- 4. sync_failed_records
ALTER TABLE public.sync_failed_records ADD COLUMN IF NOT EXISTS sync_job_id uuid REFERENCES public.sync_jobs(id) ON DELETE CASCADE;
ALTER TABLE public.sync_failed_records ADD COLUMN IF NOT EXISTS room_code text;
ALTER TABLE public.sync_failed_records ADD COLUMN IF NOT EXISTS source_table text;
ALTER TABLE public.sync_failed_records ADD COLUMN IF NOT EXISTS record_key text;
ALTER TABLE public.sync_failed_records ADD COLUMN IF NOT EXISTS error_message text;
ALTER TABLE public.sync_failed_records ADD COLUMN IF NOT EXISTS raw_data jsonb;
ALTER TABLE public.sync_failed_records ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'failed';
ALTER TABLE public.sync_failed_records ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0;

-- 5. sync_agent_runs
CREATE TABLE IF NOT EXISTS public.sync_agent_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text,
  job_name text,
  job_type text,
  room_code text,
  table_name text,
  source_table text,
  status text,
  detail text,
  message text,
  error_message text,
  last_error text,
  started_at timestamptz,
  finished_at timestamptz,
  rows_processed integer,
  rows_selected integer,
  rows_upserted integer,
  failed_rows integer,
  skipped_rows integer,
  retry_count integer,
  metadata jsonb,
  raw_data jsonb,
  created_at timestamptz,
  updated_at timestamptz
);

ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS run_type text NOT NULL DEFAULT 'unknown';
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS detail text;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS started_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS finished_at timestamptz;

ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS job_name text;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS job_type text;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS room_code text;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS table_name text;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS source_table text;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS error_message text;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS last_error text;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS rows_processed integer;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS rows_selected integer;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS rows_upserted integer;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS failed_rows integer;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS skipped_rows integer;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS retry_count integer;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS raw_data jsonb;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS created_at timestamptz;
ALTER TABLE public.sync_agent_runs ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- 6. Add common staging columns
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'sc_express_products',
    'sc_express_customers',
    'sc_express_stock',
    'sc_express_so_headers',
    'sc_express_so_lines',
    'sc_express_invoices'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS source_table text;', tbl);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS source_row_id text;', tbl);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS source_hash text;', tbl);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS sync_job_id uuid;', tbl);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS sync_status text;', tbl);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS source_created_at timestamptz;', tbl);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS source_updated_at timestamptz;', tbl);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS source_deleted_at timestamptz;', tbl);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now();', tbl);
  END LOOP;
END;
$$;

-- 7. Add specific missing columns to staging tables

-- sc_express_products
ALTER TABLE public.sc_express_products ADD COLUMN IF NOT EXISTS item_code text;
ALTER TABLE public.sc_express_products ADD COLUMN IF NOT EXISTS item_name text;
ALTER TABLE public.sc_express_products ADD COLUMN IF NOT EXISTS sku_code text;
ALTER TABLE public.sc_express_products ADD COLUMN IF NOT EXISTS sku_name text;
ALTER TABLE public.sc_express_products ADD COLUMN IF NOT EXISTS barcode text;
ALTER TABLE public.sc_express_products ADD COLUMN IF NOT EXISTS product_category text;
ALTER TABLE public.sc_express_products ADD COLUMN IF NOT EXISTS product_type text;
ALTER TABLE public.sc_express_products ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE public.sc_express_products ADD COLUMN IF NOT EXISTS unit text;
ALTER TABLE public.sc_express_products ADD COLUMN IF NOT EXISTS base_uom text;
ALTER TABLE public.sc_express_products ADD COLUMN IF NOT EXISTS active_status text;
ALTER TABLE public.sc_express_products ADD COLUMN IF NOT EXISTS is_active text;
ALTER TABLE public.sc_express_products ADD COLUMN IF NOT EXISTS sale_price numeric(18,4);
ALTER TABLE public.sc_express_products ADD COLUMN IF NOT EXISTS standard_cost numeric(18,4);
ALTER TABLE public.sc_express_products ADD COLUMN IF NOT EXISTS weight numeric(18,4);
ALTER TABLE public.sc_express_products ADD COLUMN IF NOT EXISTS pack_size numeric(18,4);

-- sc_express_stock
-- warehouse_code, location_code, lot_no, qty_on_hand are already in 001, just in case:
ALTER TABLE public.sc_express_stock ADD COLUMN IF NOT EXISTS warehouse_code text NOT NULL DEFAULT '';
ALTER TABLE public.sc_express_stock ADD COLUMN IF NOT EXISTS location_code text NOT NULL DEFAULT '';
ALTER TABLE public.sc_express_stock ADD COLUMN IF NOT EXISTS lot_no text NOT NULL DEFAULT '';
ALTER TABLE public.sc_express_stock ADD COLUMN IF NOT EXISTS qty_on_hand numeric(18,4) NOT NULL DEFAULT 0;

-- sc_express_customers
ALTER TABLE public.sc_express_customers ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.sc_express_customers ADD COLUMN IF NOT EXISTS customer_group text;
ALTER TABLE public.sc_express_customers ADD COLUMN IF NOT EXISTS sales_code text;

-- sc_express_so_headers
ALTER TABLE public.sc_express_so_headers ADD COLUMN IF NOT EXISTS customer_code text;
ALTER TABLE public.sc_express_so_headers ADD COLUMN IF NOT EXISTS document_date date;
ALTER TABLE public.sc_express_so_headers ADD COLUMN IF NOT EXISTS delivery_date date;
ALTER TABLE public.sc_express_so_headers ADD COLUMN IF NOT EXISTS status text;

-- sc_express_so_lines
ALTER TABLE public.sc_express_so_lines ADD COLUMN IF NOT EXISTS product_code text NOT NULL;
ALTER TABLE public.sc_express_so_lines ADD COLUMN IF NOT EXISTS qty numeric(18,4) NOT NULL DEFAULT 0;
ALTER TABLE public.sc_express_so_lines ADD COLUMN IF NOT EXISTS uom text;
ALTER TABLE public.sc_express_so_lines ADD COLUMN IF NOT EXISTS status text;

-- sc_express_invoices
ALTER TABLE public.sc_express_invoices ADD COLUMN IF NOT EXISTS customer_code text;
ALTER TABLE public.sc_express_invoices ADD COLUMN IF NOT EXISTS invoice_date date;
ALTER TABLE public.sc_express_invoices ADD COLUMN IF NOT EXISTS status text;

-- sc_express_transfers (New Table if not created)
CREATE TABLE IF NOT EXISTS public.sc_express_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL,
  source_file text,
  source_table text,
  source_row_id text,
  source_hash text,
  sync_job_id uuid,
  sync_batch_id uuid REFERENCES public.sync_batches(id) ON DELETE SET NULL,
  sync_status text,
  document_no text NOT NULL,
  from_warehouse_code text,
  to_warehouse_code text,
  transfer_date date,
  status text,
  raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  source_deleted_at timestamptz,
  last_seen_at timestamptz DEFAULT now(),
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sc_express_transfers_room_doc_uk UNIQUE (room_code, document_no)
);

COMMENT ON TABLE public.sc_express_transfers IS 'Raw STTRN transfer rows from Express DBF (read-only import).';
CREATE INDEX IF NOT EXISTS idx_sc_express_transfers_room_code ON public.sc_express_transfers(room_code);
CREATE INDEX IF NOT EXISTS idx_sc_express_transfers_document_no ON public.sc_express_transfers(document_no);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sc_express_transfers_updated_at') THEN
    CREATE TRIGGER trg_sc_express_transfers_updated_at 
    BEFORE UPDATE ON public.sc_express_transfers 
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

ALTER TABLE public.sc_express_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_sc_express_transfers_anon_read ON public.sc_express_transfers;
CREATE POLICY p_sc_express_transfers_anon_read ON public.sc_express_transfers FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.sc_express_transfers TO anon, authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
