-- Track which automation sent a message, and why a send failed
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS automation_id UUID REFERENCES public.automations(id);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS error_detail TEXT;

-- Per-click log for accurate time-windowed click stats (link_clicks.click_count stays as the running total, unchanged)
CREATE TABLE IF NOT EXISTS public.link_click_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  link_click_id UUID REFERENCES public.link_clicks(id),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.link_click_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access link_click_events"
  ON public.link_click_events FOR ALL USING (auth.role() = 'service_role');

-- Accurate lead-capture timestamp, separate from conversations.updated_at
-- (which changes for unrelated reasons and would give false activity-feed times)
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS email_captured_at TIMESTAMPTZ;
