-- ============================================================
-- NimbusX Identity & Contact Discovery System
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Add all new columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS share_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS phone_e164 TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS discoverable_by_phone BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS phone_visibility TEXT DEFAULT 'everyone'
    CHECK (phone_visibility IN ('everyone', 'contacts', 'nobody')),
  ADD COLUMN IF NOT EXISTS profile_photo_visibility TEXT DEFAULT 'everyone'
    CHECK (profile_photo_visibility IN ('everyone', 'contacts', 'nobody')),
  ADD COLUMN IF NOT EXISTS last_seen_visibility TEXT DEFAULT 'everyone'
    CHECK (last_seen_visibility IN ('everyone', 'contacts', 'nobody')),
  ADD COLUMN IF NOT EXISTS status_visibility TEXT DEFAULT 'everyone'
    CHECK (status_visibility IN ('everyone', 'contacts', 'nobody')),
  ADD COLUMN IF NOT EXISTS read_receipts BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS typing_indicator BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS public_key TEXT DEFAULT '',
  -- Username change tracking + reservation
  ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ,
  -- Share code regeneration tracking
  ADD COLUMN IF NOT EXISTS share_code_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS share_code_regens INTEGER DEFAULT 0,
  -- Verification type (identity verification only; badges are separate)
  ADD COLUMN IF NOT EXISTS verification_type TEXT DEFAULT 'none'
    CHECK (verification_type IN ('none', 'phone', 'official', 'organization')),
  -- Phone hash for privacy-preserving contact matching (Signal-style)
  ADD COLUMN IF NOT EXISTS phone_hash TEXT;

-- Add CHECK constraint on username (lowercase only, 3-30 chars, NULL allowed)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS username_format_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT username_format_check
  CHECK (
    username IS NULL
    OR username ~ '^[a-z0-9_]{3,30}$'
  );

-- 2. Username history table (tracks old usernames for 90-day reservation)
CREATE TABLE IF NOT EXISTS public.username_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  UNIQUE(username)
);

CREATE INDEX IF NOT EXISTS idx_username_history_username
  ON public.username_history (username, changed_at);

ALTER TABLE public.username_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own history"
  ON public.username_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert history"
  ON public.username_history FOR INSERT
  WITH CHECK (true);

-- 3. Create unique indices
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (LOWER(username))
  WHERE username IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_share_code
  ON public.profiles (share_code)
  WHERE share_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_phone_e164
  ON public.profiles (phone_e164)
  WHERE phone_e164 IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_hash
  ON public.profiles (phone_hash)
  WHERE phone_hash IS NOT NULL;

-- 4. Update the handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_share_code TEXT;
BEGIN
  -- Generate unique share code with collision check
  LOOP
    v_share_code := 'NX' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 7));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE share_code = v_share_code);
  END LOOP;

  INSERT INTO public.profiles (
    id, email, phone_e164, username, share_code, display_name,
    avatar_url, status, public_key, verification_type,
    share_code_regens
  )
  VALUES (
    new.id,
    COALESCE(new.email, ''),
    new.phone,
    NULL,
    v_share_code,
    COALESCE(
      new.raw_user_meta_data->>'displayName',
      new.raw_user_meta_data->>'display_name',
      new.email,
      new.phone,
      ''
    ),
    COALESCE(new.raw_user_meta_data->>'avatarUrl', new.raw_user_meta_data->>'avatar_url', ''),
    'Hey there! I am using NimbusX',
    COALESCE(new.raw_user_meta_data->>'public_key', ''),
    'none',
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update upsert_own_profile
DROP FUNCTION IF EXISTS public.upsert_own_profile(text, text, text, text);
CREATE OR REPLACE FUNCTION public.upsert_own_profile(
  p_email text DEFAULT NULL,
  p_display_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_username text DEFAULT NULL,
  p_phone_e164 text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_public_key text DEFAULT NULL,
  p_discoverable_by_phone boolean DEFAULT NULL,
  p_phone_visibility text DEFAULT NULL,
  p_profile_photo_visibility text DEFAULT NULL,
  p_last_seen_visibility text DEFAULT NULL,
  p_status_visibility text DEFAULT NULL,
  p_read_receipts boolean DEFAULT NULL,
  p_typing_indicator boolean DEFAULT NULL,
  p_username_changed_at timestamptz DEFAULT NULL,
  p_share_code_changed_at timestamptz DEFAULT NULL,
  p_share_code_regens integer DEFAULT NULL,
  p_verification_type text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.profiles (
    id, email, display_name, avatar_url, status,
    username, phone_e164, bio, public_key,
    discoverable_by_phone, phone_visibility,
    profile_photo_visibility, last_seen_visibility,
    status_visibility, read_receipts, typing_indicator,
    username_changed_at, share_code_changed_at,
    share_code_regens, verification_type,
    updated_at
  )
  VALUES (
    v_uid,
    COALESCE(lower(trim(p_email)), ''),
    COALESCE(p_display_name, ''),
    COALESCE(p_avatar_url, ''),
    COALESCE(p_status, 'Hey there! I am using NimbusX'),
    p_username,
    p_phone_e164,
    COALESCE(p_bio, ''),
    COALESCE(p_public_key, ''),
    COALESCE(p_discoverable_by_phone, true),
    COALESCE(p_phone_visibility, 'everyone'),
    COALESCE(p_profile_photo_visibility, 'everyone'),
    COALESCE(p_last_seen_visibility, 'everyone'),
    COALESCE(p_status_visibility, 'everyone'),
    COALESCE(p_read_receipts, true),
    COALESCE(p_typing_indicator, true),
    p_username_changed_at,
    p_share_code_changed_at,
    COALESCE(p_share_code_regens, 0),
    COALESCE(p_verification_type, 'none'),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = CASE WHEN EXCLUDED.email IS NOT NULL AND EXCLUDED.email != '' THEN EXCLUDED.email ELSE profiles.email END,
    display_name = CASE WHEN EXCLUDED.display_name IS NOT NULL AND EXCLUDED.display_name != '' THEN EXCLUDED.display_name ELSE profiles.display_name END,
    avatar_url = CASE WHEN EXCLUDED.avatar_url IS NOT NULL AND EXCLUDED.avatar_url != '' THEN EXCLUDED.avatar_url ELSE profiles.avatar_url END,
    status = CASE WHEN EXCLUDED.status IS NOT NULL AND EXCLUDED.status != '' THEN EXCLUDED.status ELSE profiles.status END,
    username = CASE WHEN EXCLUDED.username IS NOT NULL THEN EXCLUDED.username ELSE profiles.username END,
    phone_e164 = CASE WHEN EXCLUDED.phone_e164 IS NOT NULL THEN EXCLUDED.phone_e164 ELSE profiles.phone_e164 END,
    bio = CASE WHEN EXCLUDED.bio IS NOT NULL THEN EXCLUDED.bio ELSE profiles.bio END,
    public_key = CASE WHEN EXCLUDED.public_key IS NOT NULL AND EXCLUDED.public_key != '' THEN EXCLUDED.public_key ELSE profiles.public_key END,
    discoverable_by_phone = COALESCE(EXCLUDED.discoverable_by_phone, profiles.discoverable_by_phone),
    phone_visibility = COALESCE(EXCLUDED.phone_visibility, profiles.phone_visibility),
    profile_photo_visibility = COALESCE(EXCLUDED.profile_photo_visibility, profiles.profile_photo_visibility),
    last_seen_visibility = COALESCE(EXCLUDED.last_seen_visibility, profiles.last_seen_visibility),
    status_visibility = COALESCE(EXCLUDED.status_visibility, profiles.status_visibility),
    read_receipts = COALESCE(EXCLUDED.read_receipts, profiles.read_receipts),
    typing_indicator = COALESCE(EXCLUDED.typing_indicator, profiles.typing_indicator),
    username_changed_at = COALESCE(EXCLUDED.username_changed_at, profiles.username_changed_at),
    share_code_changed_at = COALESCE(EXCLUDED.share_code_changed_at, profiles.share_code_changed_at),
    share_code_regens = COALESCE(EXCLUDED.share_code_regens, profiles.share_code_regens),
    verification_type = COALESCE(EXCLUDED.verification_type, profiles.verification_type),
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_own_profile(
  text, text, text, text, text, text, text, text, boolean, text, text, text, text, boolean, boolean, timestamptz, timestamptz, integer, text
) TO authenticated;

-- 5.5. Trigger to auto-record username history on username changes
CREATE OR REPLACE FUNCTION public.record_username_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.username IS DISTINCT FROM NEW.username THEN
    INSERT INTO public.username_history (user_id, username, changed_at)
    VALUES (NEW.id, OLD.username, NOW())
    ON CONFLICT (username) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_record_username_change ON public.profiles;
CREATE TRIGGER trg_record_username_change
  BEFORE UPDATE OF username ON public.profiles
  FOR EACH ROW
  WHEN (OLD.username IS DISTINCT FROM NEW.username)
  EXECUTE FUNCTION public.record_username_change();

-- 6. RPC to match contacts by phone numbers (v1: e164; v2 will use phone_hash for privacy)
CREATE OR REPLACE FUNCTION public.match_contacts_by_phone(phone_numbers text[])
RETURNS TABLE (
  id UUID,
  username TEXT,
  share_code TEXT,
  display_name TEXT,
  avatar_url TEXT,
  phone_e164 TEXT,
  verification_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.username, p.share_code, p.display_name,
    p.avatar_url, p.phone_e164, p.verification_type
  FROM public.profiles p
  WHERE p.phone_e164 = ANY(phone_numbers)
    AND p.discoverable_by_phone = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_contacts_by_phone(text[]) TO authenticated;

-- v2: match by phone hash (Signal-style, more private)
-- CREATE OR REPLACE FUNCTION public.match_contacts_by_hash(phone_hashes text[])
-- RETURNS TABLE (...) AS $$
--   SELECT ... FROM public.profiles p
--   WHERE p.phone_hash = ANY(phone_hashes)
--     AND p.discoverable_by_phone = true;
-- $$;

-- 7. RPC to search profile by username
CREATE OR REPLACE FUNCTION public.search_profile_by_username(p_username text)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.profiles
  WHERE lower(username) = lower(trim(p_username))
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_profile_by_username(text) TO authenticated;

-- 8. RPC to get old reserved usernames (for suggestion exclusion)
CREATE OR REPLACE FUNCTION public.get_old_usernames()
RETURNS TABLE (username TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT uh.username
  FROM public.username_history uh
  WHERE uh.changed_at > NOW() - INTERVAL '90 days';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_old_usernames() TO authenticated;

-- 9. Update the messages table to support mentions
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS mentions UUID[] DEFAULT '{}';

-- 10. Create a user_blocks table
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own blocks"
  ON public.user_blocks FOR ALL
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);

-- 11. Add realtime for new tables (DO block avoids IF NOT EXISTS syntax error on older PG)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_blocks;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.username_history;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;
