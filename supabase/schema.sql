-- =============================================================================
-- DMflow Consolidated Supabase Schema
-- Includes Multi-Account Support & Hardened Row Level Security (RLS)
-- =============================================================================

-- 1. Owners table (Multi-Account Root)
CREATE TABLE IF NOT EXISTS public.owners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users table (Connected Instagram Accounts)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  ig_account_id TEXT NOT NULL,
  profile_pic TEXT,
  ai_api_key TEXT,
  ai_context TEXT,
  owner_id UUID REFERENCES public.owners(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Webhook Events table
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Automations table
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  trigger_source TEXT NOT NULL DEFAULT 'dm', -- 'dm', 'comment', 'story'
  trigger_type TEXT NOT NULL DEFAULT 'keyword', -- 'keyword', 'postback', 'ai'
  trigger_value TEXT NOT NULL, -- comma-separated keywords e.g. "hello, hi" or "*"
  response_content JSONB NOT NULL, -- { "text": "Private DM reply text" }
  public_response_content JSONB, -- { "text": "Public comment reply text" }
  reply_mode TEXT DEFAULT 'both', -- 'both', 'dm_only', 'public_only'
  specific_media_id TEXT, -- optional specific Instagram post / Reel ID
  is_ai_enabled BOOLEAN DEFAULT false,
  ai_model TEXT DEFAULT 'llama-3.1-8b-instant',
  max_response_length INTEGER DEFAULT 250,
  fallback_response_text TEXT,
  enable_opening_dm BOOLEAN DEFAULT true,
  enable_follow_gate BOOLEAN DEFAULT false,
  enable_email_capture BOOLEAN DEFAULT false,
  button_text TEXT,
  button_url TEXT,
  is_active BOOLEAN DEFAULT true,
  dms_sent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY, -- e.g. user_id:follower_id
  user_id TEXT NOT NULL,
  follower_id TEXT NOT NULL,
  follower_username TEXT,
  follower_email TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  message_text TEXT NOT NULL,
  direction TEXT NOT NULL, -- 'incoming' | 'outgoing'
  send_status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Ice Breakers table
CREATE TABLE IF NOT EXISTS public.ice_breakers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  question TEXT NOT NULL,
  payload TEXT,
  response_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Rewind Jobs table
CREATE TABLE IF NOT EXISTS public.rewind_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  automation_id TEXT NOT NULL,
  automation_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed', -- 'scanning', 'processing', 'completed', 'failed'
  comments_scanned INTEGER DEFAULT 0,
  dms_sent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Row Level Security (RLS) - Hardened Service-Role Only Policies
-- (Default-deny for anon & authenticated roles. No public SELECT allowed)
-- =============================================================================

ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ice_breakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewind_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access owners" ON public.owners FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access users" ON public.users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access webhook_events" ON public.webhook_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access automations" ON public.automations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access conversations" ON public.conversations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access messages" ON public.messages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access ice_breakers" ON public.ice_breakers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access rewind_jobs" ON public.rewind_jobs FOR ALL USING (auth.role() = 'service_role');
