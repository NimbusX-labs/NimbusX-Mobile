-- SQL Schema for NimbusX Chat Application on Supabase
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 1. PROFILES TABLE
-- Maps to User type. Created automatically when a user signs up.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    status TEXT DEFAULT 'Hey there! I am using NimbusX',
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SEuuCURITY;
-- Profiles Policies
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR
SELECT USING (true);
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR
UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Trigger to automatically create profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (id, email, display_name, avatar_url)
VALUES (
        new.id,
        new.email,
        coalesce(
            new.raw_user_meta_data->>'displayName',
            new.email
        ),
        coalesce(new.raw_user_meta_data->>'avatarUrl', '')
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 2. CHATS TABLE
-- Maps to Chat and Group types.
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('one-to-one', 'group')),
    members UUID [] NOT NULL,
    -- Array of user profile IDs
    name TEXT,
    -- Group name
    description TEXT,
    -- Group description
    avatar_url TEXT,
    -- Group icon
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    last_message_sender_id UUID REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        unread_count JSONB DEFAULT '{}'::jsonb,
        -- e.g. {"user_uuid": 0}
        typing JSONB DEFAULT '{}'::jsonb,
        -- e.g. {"user_uuid": false}
        admins JSONB DEFAULT '{}'::jsonb,
        -- e.g. {"user_uuid": true}
        created_by UUID REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS on Chats
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
-- Chats Policies
CREATE POLICY "Allow members to read their chats" ON public.chats FOR
SELECT USING (auth.uid() = ANY(members));
CREATE POLICY "Allow members to create chats" ON public.chats FOR
INSERT WITH CHECK (auth.uid() = ANY(members));
CREATE POLICY "Allow members to update chats" ON public.chats FOR
UPDATE USING (auth.uid() = ANY(members)) WITH CHECK (auth.uid() = ANY(members));
CREATE POLICY "Allow members to delete chats" ON public.chats FOR DELETE USING (auth.uid() = ANY(members));
-- 3. MESSAGES TABLE
-- Maps to Message type.
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'sent' CHECK (
        status IN ('pending', 'sent', 'delivered', 'read', 'failed')
    ),
    media_url TEXT,
    media_type TEXT CHECK (
        media_type IN (
            'image',
            'video',
            'audio',
            'file',
            'gif',
            'sticker'
        )
    ),
    media_path TEXT,
    -- Storage path inside bucket (useful for deletions)
    media_size INTEGER,
    -- Size in bytes
    reply_to UUID REFERENCES public.messages(id) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS on Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
-- Helper function to check if user is a member of the message's chat
CREATE OR REPLACE FUNCTION public.is_chat_member(chat_id UUID, user_id UUID) RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.chats
        WHERE id = chat_id
            AND user_id = ANY(members)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Messages Policies
CREATE POLICY "Allow members to read messages in their chats" ON public.messages FOR
SELECT USING (public.is_chat_member(chat_id, auth.uid()));
CREATE POLICY "Allow members to send messages to their chats" ON public.messages FOR
INSERT WITH CHECK (
        auth.uid() = sender_id
        AND public.is_chat_member(chat_id, auth.uid())
    );
CREATE POLICY "Allow members to update messages in their chats" ON public.messages FOR
UPDATE USING (public.is_chat_member(chat_id, auth.uid())) WITH CHECK (public.is_chat_member(chat_id, auth.uid()));
CREATE POLICY "Allow sender to delete message" ON public.messages FOR DELETE USING (auth.uid() = sender_id);
-- Trigger to automatically update chat last_message on new message
CREATE OR REPLACE FUNCTION public.update_chat_last_message() RETURNS TRIGGER AS $$ BEGIN
UPDATE public.chats
SET last_message = NEW.text,
    last_message_at = NEW.created_at,
    last_message_sender_id = NEW.sender_id
WHERE id = NEW.chat_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE TRIGGER on_message_inserted
AFTER
INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_chat_last_message();
-- 4. CONTACTS TABLE
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, contact_id)
);
-- Enable RLS on Contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
-- Contacts Policies
CREATE POLICY "Users can read their own contacts list" ON public.contacts FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add contacts to their own list" ON public.contacts FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove contacts from their own list" ON public.contacts FOR DELETE USING (auth.uid() = user_id);
-- 5. STATUSES TABLE
-- Stories/Statuses that expire after 24 hours.
CREATE TABLE IF NOT EXISTS public.statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    text TEXT DEFAULT '',
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);
-- Enable RLS on Statuses
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
-- Statuses Policies
CREATE POLICY "Allow read access to non-expired statuses" ON public.statuses FOR
SELECT USING (expires_at > NOW());
CREATE POLICY "Allow users to post their own status" ON public.statuses FOR
INSERT WITH CHECK (auth.uid() = uid);
CREATE POLICY "Allow users to delete their own status" ON public.statuses FOR DELETE USING (auth.uid() = uid);
-- 6. REALTIME SETUP
-- Enable Realtime for tables using Publication
ALTER PUBLICATION supabase_realtime
ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime
ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime
ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime
ADD TABLE public.statuses;
ALTER PUBLICATION supabase_realtime
ADD TABLE public.contacts;
-- 7. STORAGE BUCKETS SETUP
-- Create buckets if they don't exist (can also be done in dashboard)
-- Note: Make sure to create these in the Supabase Dashboard Storage section:
-- - 'avatars' (Public bucket)
-- - 'status-media' (Public bucket)
-- - 'chat-media' (Private bucket)
-- Storage Policies for RLS:
-- Note: In Supabase Storage, policies are written for the 'storage.objects' table.
-- Avatars Policies (Public bucket)
CREATE POLICY "Allow public access to avatars" ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Allow users to upload own avatar" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
CREATE POLICY "Allow users to update own avatar" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
-- Status Media Policies (Public bucket)
CREATE POLICY "Allow public access to status-media" ON storage.objects FOR
SELECT USING (bucket_id = 'status-media');
CREATE POLICY "Allow users to upload status-media" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'status-media'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
-- Chat Media Policies (Private bucket - requires chat membership verification)
-- Path structured as: chat-media/{chatId}/{filename}
CREATE POLICY "Allow chat members to read chat media" ON storage.objects FOR
SELECT USING (
        bucket_id = 'chat-media'
        AND public.is_chat_member((storage.foldername(name)) [1]::uuid, auth.uid())
    );
CREATE POLICY "Allow chat members to upload chat media" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'chat-media'
        AND public.is_chat_member((storage.foldername(name)) [1]::uuid, auth.uid())
    );