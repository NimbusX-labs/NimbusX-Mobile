-- Supabase SQL Migration: E2EE & Privacy Updates (Drop-Safe & Re-runnable)
-- Run this in your Supabase Dashboard -> SQL Editor

-- 1. Add public_key column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_key TEXT DEFAULT '';

-- 2. Restrict profiles read access
-- Drop the wide-open public read policy if it exists
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
-- Drop the new selective read policy so it can be cleanly recreated on re-runs
DROP POLICY IF EXISTS "Allow read access to profiles for contacts and chat members" ON public.profiles;

-- Create selective read policy
CREATE POLICY "Allow read access to profiles for contacts and chat members"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
        OR EXISTS (
            SELECT 1 FROM public.contacts 
            WHERE (user_id = auth.uid() AND contact_id = profiles.id)
               OR (user_id = profiles.id AND contact_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.chats 
            WHERE auth.uid() = ANY(members) AND profiles.id = ANY(members)
        )
    );

-- 3. Allow users to delete their own profile (fixes account deletion failing due to RLS)
DROP POLICY IF EXISTS "Allow users to delete their own profile" ON public.profiles;

CREATE POLICY "Allow users to delete their own profile"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (auth.uid() = id);

-- 4. Recreate security-definer RPC for searching users by email
-- We MUST drop the function first because PostgreSQL does not allow replacing a function's return signature.
DROP FUNCTION IF EXISTS public.search_profile_by_email(text) CASCADE;

CREATE OR REPLACE FUNCTION public.search_profile_by_email(p_email text)
RETURNS TABLE (
    id UUID,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    status TEXT,
    is_online BOOLEAN,
    last_seen TIMESTAMPTZ,
    public_key TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.email, p.display_name, p.avatar_url, p.status, p.is_online, p.last_seen, p.public_key
    FROM public.profiles p
    WHERE p.email = lower(trim(p_email));
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_profile_by_email(text) TO authenticated;

-- 5. Restrict statuses read access
-- Drop the wide-open read policy if it exists
DROP POLICY IF EXISTS "Allow read access to non-expired statuses" ON public.statuses;
-- Drop the selective read policy so it can be cleanly recreated on re-runs
DROP POLICY IF EXISTS "Allow read access to non-expired statuses of contacts" ON public.statuses;

-- Create restricted policy: users can only view statuses of themselves or their contacts
CREATE POLICY "Allow read access to non-expired statuses of contacts"
    ON public.statuses FOR SELECT
    TO authenticated
    USING (
        expires_at > NOW()
        AND (
            uid = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.contacts 
                WHERE (user_id = auth.uid() AND contact_id = uid)
                   OR (user_id = uid AND contact_id = auth.uid())
            )
        )
    );

-- 6. Restrict contacts SELECT access to support bidirectional visibility queries
DROP POLICY IF EXISTS "Users can read their own contacts list" ON public.contacts;
DROP POLICY IF EXISTS "Users can read contact rows where they are the owner or the contact" ON public.contacts;

CREATE POLICY "Users can read contact rows where they are the owner or the contact"
    ON public.contacts FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id 
        OR auth.uid() = contact_id
    );
