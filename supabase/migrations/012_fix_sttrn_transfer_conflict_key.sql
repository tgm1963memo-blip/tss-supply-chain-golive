-- Fix STTRN transfer upsert conflict key by creating unique index matching the sync upsert requirement
-- Ensure the columns exist
ALTER TABLE IF EXISTS public.sc_express_transfers 
  ADD COLUMN IF NOT EXISTS room_code text,
  ADD COLUMN IF NOT EXISTS document_no text;

-- Create unique index matching STTRN sync upsert key (room_code, document_no)
CREATE UNIQUE INDEX IF NOT EXISTS uq_sc_express_transfers_room_doc 
  ON public.sc_express_transfers (room_code, document_no);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
