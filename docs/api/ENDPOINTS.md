# NimbusX API Reference

NimbusX uses **Supabase** as its backend. There is no custom API server — all operations go through the Supabase JavaScript client, which maps to PostgreSQL tables, RPC functions, and Storage buckets.

## Base URL

```
https://<project>.supabase.co
```

Authentication is handled via the Supabase Auth client (JWT tokens in `Authorization` header, automatically managed by `@supabase/supabase-js`).

---

## Tables

### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | References `auth.users.id`, created on signup |
| `email` | TEXT UNIQUE | User email (lowercased) |
| `display_name` | TEXT | Display name |
| `avatar_url` | TEXT | Avatar image URL (Supabase Storage) |
| `status` | TEXT | User status message |
| `public_key` | TEXT | Curve25519 public key for E2EE |
| `is_online` | BOOLEAN | Online presence flag |
| `last_seen` | TIMESTAMPTZ | Last activity timestamp |

### `chats`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `type` | TEXT | `one-to-one` or `group` |
| `members` | UUID[] | Array of user profile IDs |
| `name` | TEXT | Group name |
| `last_message` | TEXT | Decrypted preview of last message |
| `last_message_at` | TIMESTAMPTZ | Timestamp of last message |
| `unread_count` | JSONB | Per-user unread counts |
| `typing` | JSONB | Per-user typing indicators |
| `admins` | JSONB | Group admin flags |
| `created_by` | UUID | Chat creator |

### `messages`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `chat_id` | UUID FK → chats | Parent chat |
| `sender_id` | UUID FK → profiles | Message author |
| `text` | TEXT | E2EE ciphertext (for 1-to-1) or plaintext (groups) |
| `status` | TEXT | `pending`, `sent`, `delivered`, `read`, `failed` |
| `media_url` | TEXT | Media URL (signed for private bucket) |
| `media_type` | TEXT | `image`, `video`, `audio`, `file`, `gif`, `sticker` |
| `reply_to` | UUID FK → messages | Parent message (for replies) |

### `contacts`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `user_id` | UUID FK → profiles | Owner of this contact list |
| `contact_id` | UUID FK → profiles | The contact user |
| `added_at` | TIMESTAMPTZ | When the contact was added |

### `statuses` (Pulses)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `uid` | UUID FK → profiles | Pulse author |
| `display_name` | TEXT | Author's display name (denormalized) |
| `text` | TEXT | Pulse text content |
| `image_url` | TEXT | Pulse image URL |
| `shared_with` | UUID[] | Recipient UIDs (empty = only author can see) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `expires_at` | TIMESTAMPTZ | 24 hours after creation |

---

## RPC Functions

### `upsert_own_profile(p_email, p_display_name, p_avatar_url, p_status)`
Security definer function that creates or updates the calling user's profile. Used by the mobile app to bypass RLS insert restrictions.

### `search_profile_by_email(p_email)`
Security definer function that searches for a user by email. Returns the full profile row if found. Used by `NewChatScreen` and `ContactInfoScreen` to discover other users.

---

## Row Level Security (RLS)

### Profiles
- **SELECT**: Public (any authenticated user can read profiles)
- **INSERT/UPDATE**: Own profile only (`auth.uid() = id`)

### Chats
- **SELECT/UPDATE/DELETE**: Members only (`auth.uid() = ANY(members)`)

### Messages
- **SELECT/UPDATE**: Chat members only (via `is_chat_member()` helper)
- **INSERT**: Sender must be a chat member
- **DELETE**: Sender only

### Contacts
- **SELECT/INSERT/DELETE**: Own contacts only (`auth.uid() = user_id`)

### Statuses (Pulses)
- **SELECT**: Non-expired AND (`auth.uid() = uid` OR `auth.uid() = ANY(shared_with)`)
- **INSERT**: Own pulses only (`auth.uid() = uid`)
- **DELETE**: Own pulses only

---

## Storage Buckets

| Bucket | Visibility | Path Pattern | Use Case |
|--------|-----------|-------------|----------|
| `avatars` | Public | `{uid}/avatar_{timestamp}.jpg` | Profile pictures |
| `status-media` | Public | `{uid}/status_{timestamp}.jpg` | Pulse images |
| `chat-media` | Private | `{chatId}/{filename}` | Chat media (signed URLs) |

## Realtime Subscriptions

The mobile app uses Supabase Realtime (WebSocket) to listen for changes:

| Channel | Filter | Purpose |
|---------|--------|---------|
| `user-chats-{uid}` | `chats` table, any event | Refresh chat list when a chat is created/updated/deleted |
| `chat-messages-{chatId}` | `messages` table, any event | New message delivery in active chat |
| `user-contacts-{uid}` | `contacts` table, `user_id=eq.{uid}` | Refresh contacts list |
| `statuses-changes-{uid}` | `statuses` + `contacts` tables | New/expired pulses |
