# NimbusX Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Mobile Client                      │
│  ┌───────────────────────────────────────────────┐  │
│  │              React Native Layer                │  │
│  │  Screens → Components → Navigation → Hooks    │  │
│  └──────────────┬────────────────────────────────┘  │
│                 │                                    │
│  ┌──────────────▼────────────────────────────────┐  │
│  │              Redux Store                       │  │
│  │  auth | user | chats | messages | groups |    │  │
│  │  settings  ←─── redux-persist (AsyncStorage)  │  │
│  └──────────────┬────────────────────────────────┘  │
│                 │                                    │
│  ┌──────────────▼────────────────────────────────┐  │
│  │            Service Layer                       │  │
│  │  database.ts  │  storage.ts  │  crypto.ts     │  │
│  └──────────────┬────────────────────────────────┘  │
│                 │                                    │
└─────────────────┼────────────────────────────────────┘
                  │ HTTPS / WebSocket
┌─────────────────▼────────────────────────────────────┐
│                   Supabase                            │
│  ┌───────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │PostgreSQL │  │ Realtime │  │ Storage (S3)       │  │
│  │  + RLS    │  │ WebSocket│  │ avatars / chat-    │  │
│  │           │  │          │  │ media / status-    │  │
│  │           │  │          │  │ media              │  │
│  └───────────┘  └──────────┘  └───────────────────┘  │
└──────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. End-to-End Encryption
- **Algorithm**: Curve25519 ECDH key exchange + XSalsa20-Poly1305 symmetric encryption via `tweetnacl`
- **Key Storage**: Private key persisted in AsyncStorage (`nimbusx_private_key:{uid}`), never transmitted
- **Public Key**: Stored in `profiles.public_key` on Supabase, cached in-memory on the client
- **Encryption Flow**:
  1. Sender fetches recipient's public key
  2. Computes shared secret via ECDH
  3. Encrypts message plaintext with shared secret
  4. Stores ciphertext in Supabase messages table
  5. Recipient computes same shared secret and decrypts
- **Safety Codes**: FNV-1a hash of concatenated public keys produces a 25-digit numeric code for out-of-band verification

### 2. Pulse Privacy Model
- Unlike broadcast stories, each Pulse targets specific recipients
- `shared_with UUID[]` column in the `statuses` table stores recipient UIDs
- RLS policy enforces: `auth.uid() = uid OR auth.uid() = ANY(shared_with)`
- No global feed — users only see Pulses explicitly shared with them

### 3. State Management
- **Redux Toolkit** with normalized entity adapters for chats, messages, users, groups
- **redux-persist** with AsyncStorage for offline resilience
- Persist whitelist: `auth`, `user`, `messages`, `settings` (chats/groups rebuilt from server)
- On logout, a rootReducer wrapper clears all slices to prevent cross-account data leakage

### 4. Real-time Updates
- Supabase Realtime WebSocket subscriptions for:
  - Chat list updates (membership changes, last message)
  - Message inserts (new messages in active chat)
  - Contact list changes (add/remove contacts)
  - Status/Pulse inserts + expiry
- All subscriptions use the `postgres_changes` channel type with filtered event listeners

### 5. Storage
- **Avatars**: Public bucket, path `avatars/{uid}/avatar_{timestamp}.jpg`
- **Chat Media**: Private bucket, signed URLs (1-year expiry), path `chat-media/{chatId}/{filename}`
- **Status/Pulse Media**: Public bucket, path `status-media/{uid}/status_{timestamp}.jpg`
- Local caching via `react-native-fs` for offline access and bandwidth savings

## Data Flow: Sending a Message

```
User taps Send
  → ChatInput calls firestoreService.sendMessage()
  → Checks if 1-to-1 chat → fetches recipient's public key
  → cryptoService.encryptMessage() via ECDH shared secret
  → Supabase INSERT into messages table
  → Realtime event triggers listener on recipient's device
  → Recipient decrypts with cryptoService.decryptMessage()
  → Redux store updated with decrypted plaintext
  → UI re-renders MessageBubble
```

## Navigation Structure

```
AppNavigator
├── AuthNavigator (Stack) [unauthenticated]
│   ├── Login
│   ├── Register
│   └── ForgotPassword
├── PinLockScreen [app lock enabled]
├── StorageSetupScreen [first launch]
└── ChatNavigator (Stack) [authenticated]
    ├── MainTabs (Bottom Tab Navigator)
    │   ├── Chats → ChatListScreen
    │   ├── Pulse → StatusScreen
    │   ├── Groups → GroupsScreen
    │   ├── Files → FilesScreen
    │   └── Settings → SettingsScreen
    ├── Chat / GroupChat / NewChat
    ├── CreateGroup / GroupInfo / ContactInfo
    ├── Profile
    └── Settings screens (Account, Privacy, Security, etc.)
```

## Theme System

- Custom `createThemedStyles()` replaces `StyleSheet.create()` throughout
- Theme modes: Dark, Light, System (follows device)
- Accent variants: Teal (default), Emerald, Slate
- Runtime theme switching via `updateThemeStyles()` which mutates registered stylesheets
- Colors object passed to style creators via closure at registration time
