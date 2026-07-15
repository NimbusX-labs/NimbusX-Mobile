-- Migration: Add shared_with column and update RLS for Pulse feature
-- Run this in Supabase SQL Editor if you already have the statuses table

-- Add shared_with column to existing statuses table
ALTER TABLE public.statuses ADD COLUMN IF NOT EXISTS shared_with UUID[] DEFAULT '{}'::uuid[];

-- Drop the old RLS policy that allowed reading all non-expired statuses
DROP POLICY IF EXISTS "Allow read access to non-expired statuses" ON public.statuses;

-- Create new policy: only see statuses you created or that were shared with you
CREATE POLICY "Allow read access to own or shared statuses"
    ON public.statuses FOR SELECT
    USING (expires_at > NOW() AND (auth.uid() = uid OR auth.uid() = ANY(shared_with)));
