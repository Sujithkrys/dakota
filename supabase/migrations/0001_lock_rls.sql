-- Migration: Lock down Row Level Security
-- Drop all "Allow public read access" policies that expose every row to the anon key.
-- All app reads/writes use the service_role client, which bypasses RLS.
-- After this migration, RLS default-deny blocks anon/authenticated roles from reading any table.

DROP POLICY IF EXISTS "Allow public read access users" ON public.users;
DROP POLICY IF EXISTS "Allow public read access webhook_events" ON public.webhook_events;
DROP POLICY IF EXISTS "Allow public read access automations" ON public.automations;
DROP POLICY IF EXISTS "Allow public read access conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow public read access messages" ON public.messages;
DROP POLICY IF EXISTS "Allow public read access ice_breakers" ON public.ice_breakers;
DROP POLICY IF EXISTS "Allow public read access rewind_jobs" ON public.rewind_jobs;
