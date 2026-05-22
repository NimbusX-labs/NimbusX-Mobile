# Migrate NimbusX from Firebase/Cloudinary → Supabase

Replace all Firebase services (Auth, Firestore, Realtime Database) and the Cloudinary/Express backend with Supabase (Auth, PostgreSQL, Realtime, Storage). The Node.js backend server is fully eliminated.

---

## User Review Required

> [!IMPORTANT]
> **You must create a Supabase project before we begin.**
> 1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**
> 2. Pick a name (e.g. `nimbusx`), set a database password, choose a region close to you
> 3. Wait ~2 minutes for provisioning
> 4. Go to **Settings → API** and copy your **Project URL** and **anon (public) key**
> 5. Share both values with me so I can configure the app

> [!WARNING]
> **Breaking change**: All existing Firebase user accounts, chats, messages, and uploaded media will NOT migrate automatically. This is a clean-slate backend switch. If you need to preserve existing data, let me know and I'll add a data migration script.

> [!IMPORTANT]
> **Supabase free tier pauses after 7 days of inactivity.** You'll need to log into the dashboard periodically or upgrade to Pro ($25/mo) for always-on.

## Open Questions

> [!IMPORTANT]
> 1. **Google Sign-In**: The current app only supports email/password auth. Do you want me to add Google Sign-In during this migration, or keep email/password only for now?
> 2. **Email verification**: Supabase requires email verification by default. Should I disable it for easier testing, or keep it enabled?

---

## Architecture Overview

```
BEFORE                                    AFTER
──────                                    ─────
Firebase Auth           ───────►    Supabase Auth
Firestore (NoSQL)       ───────►    Supabase PostgreSQL + Realtime
Firebase Realtime DB    ───────►    Supabase Presence (Realtime channels)
Cloudinary + Express    ───────►    Supabase Storage (direct client uploads)
backend/ server         ───────►    DELETED (no server needed)
```

### Key Design Decision: Keep the Same Service Interface

The migration strategy preserves the **exact same function signatures** on the service layer (`authService`, `firestoreService`, `presenceService`, `storageService`). Screens and hooks only need **import path changes** (`@services/firebase/*` → `@services/supabase/*`), not logic rewrites.

### Database Model: Arrays for Members (Not Join Tables)

PostgreSQL arrays (`UUID[]`) are used for `chat.members` — matching the existing Firestore model. This avoids rewriting screen logic that checks `chat.members.includes(uid)`. RLS policies use `auth.uid() = ANY(members)` which PostgreSQL supports natively.

---

## Proposed Changes

### Phase 1: Supabase Project Setup & SQL Schema

#### [NEW] [supabase-schema.sql](file:///d:/New%20folder/NimbusX/supabase-schema.sql)

SQL migration file to run in the Supabase SQL Editor. Creates:

**Tables:**
| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User profiles (auto-created on signup via trigger) | Read: all authenticated; Write: own row only |
| `chats` | Chat rooms (1-to-1 and group) with `members UUID[]` | Read/Write: only members (`auth.uid() = ANY(members)`) |
| `messages` | Chat messages with `chat_id` FK | Read/Write: only members of parent chat |
| `contacts` | User's contact list | Read/Write: own contacts only |
| `statuses` | 24-hour stories | Read: all authenticated (non-expired); Write: own only |

**Storage Buckets:**
| Bucket | Public? | Purpose |
|--------|---------|---------|
| `avatars` | Yes | User profile pictures (public CDN URLs) |
| `status-media` | Yes | Status/story images (public, expire in 24h) |
| `chat-media` | No | Private chat attachments (signed URLs, member-only access) |

**Triggers:**
- `on_auth_user_created` → auto-creates a `profiles` row when a user signs up
- `update_chat_last_message` → auto-updates `chats.last_message*` fields when a message is inserted

**Realtime:**
- Enable realtime on: `chats`, `messages`, `profiles`, `statuses`

---

### Phase 2: Add Supabase Dependencies & Config

#### [MODIFY] [package.json](file:///d:/New%20folder/NimbusX/package.json)

**Add:**
```
@supabase/supabase-js: ^2.49.0
react-native-url-polyfill: ^2.0.0
base64-arraybuffer: ^1.0.2
```

**Remove:**
```
@react-native-firebase/app
@react-native-firebase/auth
@react-native-firebase/database
@react-native-firebase/firestore
@react-native-firebase/storage
```

#### [NEW] [src/config/supabase.ts](file:///d:/New%20folder/NimbusX/src/config/supabase.ts)

Supabase client initialization with:
- `AsyncStorage` for session persistence (already installed)
- `detectSessionInUrl: false` (required for React Native)
- `AppState` listener for auto-refresh token management

---

### Phase 3: Rewrite Service Layer

All new files go into `src/services/supabase/`. The old `src/services/firebase/` directory is deleted entirely.

#### [NEW] [src/services/supabase/auth.ts](file:///d:/New%20folder/NimbusX/src/services/supabase/auth.ts)

Exports `authService` with the **same interface** as the Firebase version:

| Function | Firebase (old) | Supabase (new) |
|----------|---------------|----------------|
| `signInWithEmail(email, pw)` | `auth().signInWithEmailAndPassword()` | `supabase.auth.signInWithPassword()` |
| `registerWithEmail(email, pw)` | `auth().createUserWithEmailAndPassword()` | `supabase.auth.signUp()` |
| `signOut()` | `auth().signOut()` | `supabase.auth.signOut()` |
| `getCurrentUser()` | `auth().currentUser` | `supabase.auth.getUser()` |
| `onAuthStateChanged(cb)` | `auth().onAuthStateChanged()` | `supabase.auth.onAuthStateChange()` |

#### [NEW] [src/services/supabase/database.ts](file:///d:/New%20folder/NimbusX/src/services/supabase/database.ts)

Exports `firestoreService` (same name for minimal import changes) with the **same interface**:

| Function | Firebase (old) | Supabase (new) |
|----------|---------------|----------------|
| `listenUserChats(uid, cb)` | Firestore `onSnapshot` with `array-contains` | Supabase `select` + Realtime `postgres_changes` on `chats` table, filtered by `members` containing `uid` |
| `listenMessages(chatId, limit, cb)` | Firestore `onSnapshot` on subcollection | Supabase `select` + Realtime `postgres_changes` with `filter: chat_id=eq.${chatId}` |
| `sendMessage(msg)` | Firestore batch (add message + update chat) | Supabase `insert` into `messages` (trigger auto-updates chat) |
| `deleteMessage(chatId, msgId)` | Firestore `delete` | Supabase `delete` from `messages` |
| `createChat(config)` | Firestore `add` to collection | Supabase `insert` into `chats`, returns `id` |
| `deleteChat(chatId)` | Firestore `delete` | Supabase `delete` from `chats` (cascade deletes messages) |
| `saveUser(user)` | Firestore `set` with merge | Supabase `upsert` into `profiles` |
| `getUser(uid)` | Firestore `get` doc | Supabase `select` from `profiles` where `id = uid` |
| `searchUserByEmail(email)` | Firestore `where` query | Supabase `select` from `profiles` where `email = email` |
| `addContact(uid, contact)` | Firestore `set` in subcollection | Supabase `insert` into `contacts` |
| `listenContacts(uid, cb)` | Firestore `onSnapshot` on subcollection | Supabase `select` + Realtime on `contacts` filtered by `user_id` |
| `updateMessageStatus(chatId, ids, status)` | Firestore batch update | Supabase `update` with `in` filter |
| `setTypingStatus(chatId, uid, isTyping)` | Firestore `set` with merge | Supabase `update` JSONB field on `chats` |
| `postStatus(status)` | Firestore `add` | Supabase `insert` into `statuses` |
| `listenStatuses(cb)` | Firestore `onSnapshot` | Supabase `select` + Realtime on `statuses` |
| `updateGroupDetails(chatId, data)` | Firestore `update` | Supabase `update` on `chats` |
| `removeGroupMember(chatId, uid)` | Firestore `arrayRemove` | Supabase `update` with `array_remove` via RPC |
| `leaveGroup(chatId, uid)` | delegates to `removeGroupMember` | Same |
| `deleteGroup(chatId)` | Batch delete messages then chat | Supabase `delete` from `chats` (cascade) |

#### [NEW] [src/services/supabase/presence.ts](file:///d:/New%20folder/NimbusX/src/services/supabase/presence.ts)

Replaces Firebase Realtime Database presence with Supabase Realtime Presence channels:

| Function | Firebase (old) | Supabase (new) |
|----------|---------------|----------------|
| `setupPresence(uid)` | RTDB `.info/connected` + `onDisconnect` | Supabase channel `track()` with auto-untrack on disconnect |
| `setPresence(uid, isOnline)` | RTDB `set()` | Update `profiles.is_online` + channel `track()`/`untrack()` |
| `listenToUserPresence(uid, cb)` | RTDB `on('value')` | Supabase Realtime `postgres_changes` on `profiles` filtered by `id=eq.${uid}` |

#### [NEW] [src/services/supabase/storage.ts](file:///d:/New%20folder/NimbusX/src/services/supabase/storage.ts)

Replaces Cloudinary uploads with direct Supabase Storage uploads:

| Function | Old (Cloudinary) | New (Supabase Storage) |
|----------|-----------------|----------------------|
| `uploadAvatar(uid, fileUri)` | cloudinaryService → backend → Cloudinary | Read file as base64 via RNFS → `supabase.storage.from('avatars').upload()` → `getPublicUrl()` |
| `uploadStatusImage(uid, fileUri)` | Same as above | Same pattern to `status-media` bucket |
| `uploadMedia(chatId, fileUri, mime, name)` | Same as above | Upload to `chat-media` bucket under `{chatId}/{filename}` → `createSignedUrl()` |
| `deleteMedia(publicId)` | cloudinaryService.deleteMedia | `supabase.storage.from(bucket).remove([path])` |

---

### Phase 4: Update Imports Across the App

All these files change **only their import paths** — no logic changes:

#### [MODIFY] [src/hooks/useAuth.ts](file:///d:/New%20folder/NimbusX/src/hooks/useAuth.ts)
- `@services/firebase/auth` → `@services/supabase/auth`
- `@services/firebase/firestore` → `@services/supabase/database`
- Remove `firebaseUser.updateProfile()` call (Supabase handles profile via trigger)

#### [MODIFY] [src/hooks/useChats.ts](file:///d:/New%20folder/NimbusX/src/hooks/useChats.ts)
- `@services/firebase/firestore` → `@services/supabase/database`

#### [MODIFY] [src/hooks/useMessages.ts](file:///d:/New%20folder/NimbusX/src/hooks/useMessages.ts)
- `@services/firebase/firestore` → `@services/supabase/database`

#### [MODIFY] [src/hooks/usePresence.ts](file:///d:/New%20folder/NimbusX/src/hooks/usePresence.ts)
- `@services/firebase/presence` → `@services/supabase/presence`

#### [MODIFY] [src/hooks/useAppState.ts](file:///d:/New%20folder/NimbusX/src/hooks/useAppState.ts)
- `@services/firebase/presence` → `@services/supabase/presence`

#### [MODIFY] [src/navigation/AppNavigator.tsx](file:///d:/New%20folder/NimbusX/src/navigation/AppNavigator.tsx)
- `@services/firebase/auth` → `@services/supabase/auth`
- `@services/firebase/firestore` → `@services/supabase/database`
- Rewrite auth listener to use `supabase.auth.onAuthStateChange` + `supabase.auth.getSession`

#### [MODIFY] [src/screens/chats/ChatScreen.tsx](file:///d:/New%20folder/NimbusX/src/screens/chats/ChatScreen.tsx)
- `@services/firebase/firestore` → `@services/supabase/database`
- `@services/firebase/storage` → `@services/supabase/storage`

#### [MODIFY] [src/screens/chats/NewChatScreen.tsx](file:///d:/New%20folder/NimbusX/src/screens/chats/NewChatScreen.tsx)
- `@services/firebase/firestore` → `@services/supabase/database`

#### [MODIFY] [src/screens/groups/GroupChatScreen.tsx](file:///d:/New%20folder/NimbusX/src/screens/groups/GroupChatScreen.tsx)
- `@services/firebase/firestore` → `@services/supabase/database`

#### [MODIFY] [src/screens/groups/GroupInfoScreen.tsx](file:///d:/New%20folder/NimbusX/src/screens/groups/GroupInfoScreen.tsx)
- `@services/firebase/firestore` → `@services/supabase/database`
- `@services/firebase/storage` → `@services/supabase/storage`

#### [MODIFY] [src/screens/groups/CreateGroupScreen.tsx](file:///d:/New%20folder/NimbusX/src/screens/groups/CreateGroupScreen.tsx)
- `@services/firebase/firestore` → `@services/supabase/database`

#### [MODIFY] [src/screens/settings/ProfileScreen.tsx](file:///d:/New%20folder/NimbusX/src/screens/settings/ProfileScreen.tsx)
- `@services/firebase/firestore` → `@services/supabase/database`
- `@services/firebase/storage` → `@services/supabase/storage`

#### [MODIFY] [src/screens/settings/SettingsScreen.tsx](file:///d:/New%20folder/NimbusX/src/screens/settings/SettingsScreen.tsx)
- `@services/firebase/auth` → `@services/supabase/auth`

#### [MODIFY] [src/screens/status/StatusScreen.tsx](file:///d:/New%20folder/NimbusX/src/screens/status/StatusScreen.tsx)
- `@services/firebase/firestore` → `@services/supabase/database`
- `@services/firebase/storage` → `@services/supabase/storage`

#### [MODIFY] [src/components/chat/ChatListItem.tsx](file:///d:/New%20folder/NimbusX/src/components/chat/ChatListItem.tsx)
- `@services/firebase/firestore` → `@services/supabase/database`

---

### Phase 5: Update Types, Constants & App Entry

#### [MODIFY] [src/types/index.ts](file:///d:/New%20folder/NimbusX/src/types/index.ts)
- Remove Cloudinary-specific fields from `Message`: `mediaPublicId`, `mediaUploadedAt`, `storageMode`
- Add `mediaPath` field (Supabase storage path for deletion)
- Keep `mediaUrl`, `mediaType`, `mediaSize`

#### [MODIFY] [src/constants/index.ts](file:///d:/New%20folder/NimbusX/src/constants/index.ts)
- Update `COLLECTIONS` to use Supabase table names: `profiles`, `chats`, `messages`, `contacts`, `statuses`
- Remove `PRESENCE` (handled via Realtime channels, not a table)
- Update `STORAGE_PATHS` to use Supabase bucket names

#### [MODIFY] [src/services/cacheService.ts](file:///d:/New%20folder/NimbusX/src/services/cacheService.ts)
- Change cache path from `${RNFS.DocumentDirectoryPath}/${filename}` to `${RNFS.DocumentDirectoryPath}/media/${chatId}/${filename}`
- Add `clearChatCache(chatId)` function
- Remove `storageMode` concept (everything is cloud now via Supabase)

#### [MODIFY] [App.tsx](file:///d:/New%20folder/NimbusX/App.tsx)
- Add `import 'react-native-url-polyfill/auto'` at the very top
- Remove Firebase LogBox warning

---

### Phase 6: Remove Firebase & Cloudinary

#### [DELETE] `src/services/firebase/` (entire directory)
- `auth.ts`, `config.ts`, `firestore.ts`, `presence.ts`, `storage.ts`

#### [DELETE] `src/services/cloudinaryService.ts`
#### [DELETE] `src/config/cloudinary.ts`
#### [DELETE] `backend/` (entire directory — server.js, package.json, .env, node_modules)
#### [DELETE] `firebase.json`
#### [DELETE] `.firebaserc`
#### [DELETE] `firestore.rules`
#### [DELETE] `storage.rules`
#### [DELETE] `firestore.indexes.json`
#### [DELETE] `android/app/google-services.json`

#### [MODIFY] [android/app/build.gradle](file:///d:/New%20folder/NimbusX/android/app/build.gradle)
- Remove all Firebase dependencies (lines 114-124):
  ```diff
  - implementation platform('com.google.firebase:firebase-bom:34.9.0')
  - implementation 'com.google.firebase:firebase-analytics'
  - implementation 'com.google.firebase:firebase-auth'
  - implementation 'com.google.firebase:firebase-firestore'
  - implementation 'com.google.firebase:firebase-database'
  - implementation 'com.google.firebase:firebase-storage'
  ```
- Remove `apply plugin: "com.google.gms.google-services"` (line 132)

#### [MODIFY] android/build.gradle (root)
- Remove `com.google.gms:google-services` classpath

---

## Verification Plan

### Automated Tests
1. **Clean build**: `cd android && ./gradlew clean && cd .. && npm run android`
2. **No Firebase imports remain**: `grep -r "@react-native-firebase" src/` should return nothing
3. **No Cloudinary references remain**: `grep -r "cloudinary" src/` should return nothing

### Manual Verification (on device)
1. **Auth flow**: Register a new account → Log out → Log back in
2. **Chat flow**: Search user by email → Add contact → Start chat → Send text message → Verify real-time delivery
3. **Media flow**: Send an image attachment → Verify it uploads and displays
4. **Group flow**: Create group → Add members → Send group message
5. **Status flow**: Post a status with image → Verify it appears for other users
6. **Presence**: Open app on Phone A → Verify online indicator on Phone B
7. **Profile**: Update avatar → Verify it uploads and displays across devices
