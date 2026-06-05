-- Run this once in Supabase Dashboard → SQL Editor
-- Fixes: "new row violates row-level security policy for table profiles"

-- 1) Allow authenticated users to insert their own profile row
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
CREATE POLICY "Allow users to insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2) Secure upsert function (recommended — used by the app)
CREATE OR REPLACE FUNCTION public.upsert_own_profile(
  p_email text,
  p_display_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_status text DEFAULT NULL
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

  INSERT INTO public.profiles (id, email, display_name, avatar_url, status, updated_at)
  VALUES (
    v_uid,
    lower(trim(p_email)),
    coalesce(p_display_name, ''),
    coalesce(p_avatar_url, ''),
    coalesce(p_status, 'Hey there! I am using NimbusX'),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = CASE
      WHEN EXCLUDED.display_name IS NULL OR EXCLUDED.display_name = '' THEN profiles.display_name
      ELSE EXCLUDED.display_name
    END,
    avatar_url = CASE
      WHEN EXCLUDED.avatar_url IS NULL OR EXCLUDED.avatar_url = '' THEN profiles.avatar_url
      ELSE EXCLUDED.avatar_url
    END,
    status = CASE
      WHEN EXCLUDED.status IS NULL OR EXCLUDED.status = '' THEN profiles.status
      ELSE EXCLUDED.status
    END,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_own_profile(text, text, text, text) TO authenticated;
