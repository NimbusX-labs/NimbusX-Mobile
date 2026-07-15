# NimbusX

**End-to-end encrypted messenger built on React Native + Supabase.**

Private, real-time messaging with E2EE, direct Pulse broadcasting, and zero metadata collection.

## Features

- **E2EE Messaging** — Curve25519 ECDH + XSalsa20-Poly1305 via tweetnacl. Messages encrypted before they leave your device.
- **Pulse** — Not status updates. Private messages you share directly with chosen contacts, shown in a dedicated feed. No one sees your Pulse unless you send it to them.
- **Groups** — Group chats with member management, admin controls, and E2EE.
- **Media sharing** — Images, GIFs, stickers, files, voice. Encrypted in transit and at rest.
- **Privacy controls** — Profile photo visibility, last seen, read receipts, online status, blocked users. Every toggle works.
- **Security** — App lock (PIN), safety codes, security notifications, simulated 2FA.
- **Theme system** — Dark, Light, System with accent color variants (teal, emerald, slate).
- **Storage** — Cloud (Supabase) or local-only mode.

## Tech Stack

| Layer | What |
|-------|------|
| Framework | React Native 0.84 + React 19 |
| State | Redux Toolkit + redux-persist |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| Encryption | tweetnacl (Curve25519 + XSalsa20-Poly1305) |
| Navigation | React Navigation 7 (Stack + Bottom Tabs) |
| Auth | Supabase Auth + Google Sign-In |

## Getting Started

```bash
# 1. Install deps
npm install

# 2. Start Metro bundler
npm start

# 3. Run on device/emulator
npm run android   # Android
npm run ios       # iOS
```

## Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Run `supabase-schema.sql` in the SQL Editor
3. Run `supabase-e2ee-migration.sql` for E2EE support
4. Run `supabase-pulse-migration.sql` for Pulse features
5. Copy `.env.example` → `.env` and add your Supabase URL + anon key
6. Enable Google Sign-In in Supabase Auth settings

## Project Structure

```
src/
├── assets/            # Images, fonts, static assets
├── components/        # Reusable UI components
│   ├── chat/          # Chat-related (MessageBubble, ChatInput, etc.)
│   └── common/        # Shared (Avatar, Badge, EmptyState, etc.)
├── config/            # Supabase client, app config
├── constants/         # Collection names, storage paths, pagination
├── hooks/             # Custom React hooks (useAuth, useChats, etc.)
├── navigation/        # Stack, tab, and auth navigators
├── screens/           # Screen components (auth, chats, groups, settings, status)
├── services/          # API layer (Supabase database, storage, cache)
├── store/             # Redux slices + store config
├── theme/             # Colors, spacing, typography, theming system
├── types/             # TypeScript interfaces
└── utils/             # Crypto, date utils, formatters, validation
```

## Architecture Notes

### Encryption Flow
1. Keypair generated on login via `cryptoService.getOrCreateKeyPair()`
2. Public key stored in `profiles.public_key` (Supabase)
3. Private key persists in AsyncStorage (`nimbusx_private_key:{uid}`)
4. Outgoing messages: fetch recipient's public key → ECDH shared secret → encrypt
5. Incoming messages: compute same shared secret → decrypt

### Pulse Privacy
- Each Pulse stores a `shared_with` UUID array
- RLS policy: `auth.uid() = uid OR auth.uid() = ANY(shared_with)`
- No global broadcast — you explicitly pick recipients

### State Management
- Redux persist whitelist: `auth`, `user`, `messages`, `settings`
- On logout, all user data cleared from store to prevent cross-account leakage

## Scripts

| Script | Purpose |
|--------|---------|
| `npm start` | Start Metro bundler |
| `npm run android` | Build + run on Android |
| `npm run ios` | Build + run on iOS |
| `npm run lint` | Run ESLint across src/ |
| `npm test` | Run Jest tests |
| `npx tsc --noEmit` | TypeScript type check |

## License

MIT
