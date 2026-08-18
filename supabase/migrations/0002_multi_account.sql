-- Migration: Multi-account foundation
-- Adds the owners table and links Instagram accounts to owners via owner_id FK.

-- Owners table
CREATE TABLE IF NOT EXISTS public.owners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access owners"
  ON public.owners FOR ALL USING (auth.role() = 'service_role');

-- Add owner_id FK to users table (nullable for backfill of existing accounts)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.owners(id);
