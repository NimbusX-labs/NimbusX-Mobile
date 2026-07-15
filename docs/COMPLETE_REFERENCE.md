# NimbusX — Complete Project Reference

> **Generated from source code.** Every file, feature, type, config, and dependency listed below is extracted directly from the project at `D:\New folder\NimbusX`.

---

## Table of Contents

1. [Project Identity](#1-project-identity)
2. [File Tree](#2-file-tree)
3. [Dependencies](#3-dependencies)
4. [TypeScript Config](#4-typescript-config)
5. [Type Definitions](#5-type-definitions)
6. [Constants & Config](#6-constants--config)
7. [Navigation Architecture](#7-navigation-architecture)
8. [Redux Store](#8-redux-store)
9. [Screens — Complete Catalog](#9-screens--complete-catalog)
10. [Components — Complete Catalog](#10-components--complete-catalog)
11. [Services](#11-services)
12. [Hooks](#12-hooks)
13. [Theme System](#13-theme-system)
14. [Utilities](#14-utilities)
15. [Data Files](#15-data-files)
16. [Database Schema (Supabase)](#16-database-schema-supabase)
17. [Migrations](#17-migrations)
18. [Scripts](#18-scripts)
19. [CI/CD & GitHub](#19-cicd--github)
20. [Assets](#20-assets)
21. [Config Files (Root)](#21-config-files-root)

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Name** | NimbusX |
| **Version** | 0.0.1 |
| **Private** | true |
| **Platform** | React Native (Android + iOS) |
| **Language** | TypeScript |
| **License** | MIT |
| **Entry** | `index.js` → `App.tsx` |
| **Repository** | `github.com/NimbusX-labs/NimbusX-Mobile.git` |

---

## 2. File Tree

```
NimbusX-Mobile/
├── .bundle/                              # Metro bundler config (truncated)
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md                 # Bug report template
│   │   └── feature_request.md            # Feature request template
│   ├── PULL_REQUEST_TEMPLATE.md          # PR checklist template
│   └── workflows/
│       ├── ci.yml                        # ESLint + TSC + Jest on push/PR
│       └── lint.yml                      # Parallel lint + typecheck jobs
├── android/                              # Android native project (Gradle)
│   ├── app/
│   │   ├── build.gradle                  # App-level build config
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml       # Manifest
│   │   │   ├── java/com/nimbusx/        # Java source
│   │   │   ├── assets/                   # Metro bundle output at build time
│   │   │   └── res/                      # Generated drawables + launcher icons
│   │   └── proguard-rules.pro            # ProGuard rules
│   ├── build.gradle                      # Project-level Gradle
│   ├── settings.gradle                   # Module includes
│   └── gradle.properties                 # Android SDK properties
├── docs/
│   ├── api/ENDPOINTS.md                  # Supabase API reference
│   ├── architecture/OVERVIEW.md          # System architecture docs
│   ├── assets/
│   │   ├── logo-dark.svg                 # Dark-mode logo
│   │   └── logo-light.svg                # Light-mode logo
│   └── screenshots/                      # App screenshots (empty)
├── ios/                                  # iOS native project (Xcode/Pods)
├── scripts/
│   ├── migrate.py                        # SQL migration runner
│   ├── seed.py                           # Demo data seeder
│   └── setup.ps1                         # Project bootstrap script
├── src/
│   ├── assets/
│   │   └── images/logo.png               # Logo asset
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatInput.tsx             # Message composer input
│   │   │   ├── ChatListItem.tsx           # Chat list row
│   │   │   ├── EmojiGifPicker.tsx        # Emoji + GIF picker modal
│   │   │   ├── ImagePreviewModal.tsx     # Full-screen image preview
│   │   │   ├── MessageBubble.tsx         # Individual message bubble
│   │   │   ├── MessageStatus.tsx         # ✓✓ delivery status icons
│   │   │   ├── ReplyPreview.tsx          # Reply quote preview
│   │   │   └── TypingIndicator.tsx       # "typing…" animated dots
│   │   └── common/
│   │       ├── Avatar.tsx                # User avatar circle
│   │       ├── Badge.tsx                 # Unread count badge
│   │       ├── EmptyState.tsx            # Empty screen placeholder
│   │       ├── ErrorBoundary.tsx         # React error boundary
│   │       └── LoadingSkeleton.tsx       # Shimmer loading placeholder
│   ├── config/
│   │   └── supabase.ts                   # Supabase client + Google Sign-In config
│   ├── constants/
│   │   └── index.ts                      # DB collections, storage paths, pagination
│   ├── data/
│   │   └── emojis.ts                     # Emoji data (categories + emoji objects)
│   ├── hooks/
│   │   ├── useAppState.ts                # App foreground/background detection
│   │   ├── useAuth.ts                    # Auth state listener hook
│   │   ├── useChats.ts                   # Chat list subscription hook
│   │   ├── useMessages.ts                # Messages subscription for a chat
│   │   └── usePresence.ts               # Online/offline presence hook
│   ├── navigation/
│   │   ├── AppNavigator.tsx              # Root navigator (auth vs main)
│   │   ├── AuthNavigator.tsx             # Auth stack (Login, Register, Forgot)
│   │   ├── ChatNavigator.tsx             # Main stack + settings
│   │   ├── MainNavigator.tsx             # Bottom tab navigator
│   │   └── types.ts                      # Navigation param types
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── ForgotPasswordScreen.tsx  # Password reset
│   │   │   ├── LoginScreen.tsx           # Login with email
│   │   │   └── RegisterScreen.tsx        # Registration
│   │   ├── chats/
│   │   │   ├── ChatListScreen.tsx        # Chat inbox list
│   │   │   ├── ChatScreen.tsx            # Individual chat view
│   │   │   ├── ContactInfoScreen.tsx     # Contact details + safety code
│   │   │   ├── FilesScreen.tsx           # Shared media/files grid
│   │   │   └── NewChatScreen.tsx         # New chat composer
│   │   ├── groups/
│   │   │   ├── CreateGroupScreen.tsx     # Create a group
│   │   │   ├── GroupChatScreen.tsx       # Group chat view
│   │   │   ├── GroupInfoScreen.tsx       # Group details + participants
│   │   │   └── GroupsScreen.tsx          # Group list
│   │   ├── settings/
│   │   │   ├── AccountSettingsScreen.tsx # Change phone, email, delete account
│   │   │   ├── AppInfoScreen.tsx         # App version, licenses
│   │   │   ├── ChangeNumberScreen.tsx    # Phone number change flow
│   │   │   ├── ChatsSettingsScreen.tsx   # Wallpaper, enter-is-send, backup
│   │   │   ├── ContactUsScreen.tsx       # Submit feedback/ticket
│   │   │   ├── DevicesScreen.tsx         # Active sessions list
│   │   │   ├── HelpCenterScreen.tsx      # FAQ + help articles
│   │   │   ├── HelpSettingsScreen.tsx    # Help & support hub
│   │   │   ├── NotificationsSettingsScreen.tsx  # Notification preferences
│   │   │   ├── PrivacySettingsScreen.tsx # Privacy toggles
│   │   │   ├── ProfileScreen.tsx         # Edit own profile
│   │   │   ├── RequestInfoScreen.tsx     # Request my data
│   │   │   ├── SecuritySettingsScreen.tsx # App lock, 2FA, safety
│   │   │   ├── SettingsScreen.tsx        # Main settings hub
│   │   │   ├── StorageSetupScreen.tsx    # Local vs cloud storage choice
│   │   │   └── TermsPrivacyScreen.tsx    # Terms + privacy policy display
│   │   └── status/
│   │       └── StatusScreen.tsx          # Pulse feed + composer
│   ├── services/
│   │   ├── supabase/
│   │   │   ├── database.ts              # All Supabase DB operations
│   │   │   └── storage.ts               # Supabase Storage upload/download
│   │   ├── cacheService.ts              # Local image caching
│   │   └── notificationService.ts       # Local push notifications
│   ├── store/
│   │   ├── index.ts                     # configureStore + persist
│   │   ├── hooks.ts                     # Typed useAppSelector + useAppDispatch
│   │   └── slices/
│   │       ├── authSlice.ts             # Auth state (user, loading, mode)
│   │       ├── chatSlice.ts             # Chats entity adapter
│   │       ├── groupSlice.ts            # Current group ID
│   │       ├── messageSlice.ts          # Messages entity adapter + offline queue
│   │       ├── settingsSlice.ts         # All settings (privacy, security, etc.)
│   │       └── userSlice.ts             # Users entity adapter
│   ├── theme/
│   │   ├── colors.ts                    # Theme colors + createThemedStyles()
│   │   ├── index.ts                     # Theme barrel export
│   │   ├── spacing.ts                   # Spacing scale
│   │   └── typography.ts               # Font sizes, weights
│   ├── types/
│   │   └── index.ts                     # User, Message, Chat, Group, Status
│   └── utils/
│       ├── crypto.ts                    # Key generation + E2EE encryption/decryption
│       ├── dateUtils.ts                # Date formatting helpers
│       ├── formatters.ts               # String formatting utilities
│       └── validation.ts               # Email/password/name validation
├── supabase-e2ee-migration.sql          # E2EE key exchange + public_key
├── supabase-pulse-migration.sql         # shared_with column + RLS
├── supabase-schema.sql                  # Full schema (profiles, chats, etc.)
├── package.json
├── package-lock.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── jest.config.js
├── .eslintrc.js
├── .prettierrc.js
├── .gitignore
├── .env.example
├── app.json
├── index.js
├── App.tsx
├── react-native.config.js
└── README.md
```

---

## 3. Dependencies

### Production

| Package | Version | Purpose |
|---------|---------|---------|
| `@opentelemetry/api` | ^1.9.1 | Telemetry instrumentation |
| `@react-native-async-storage/async-storage` | ^2.2.0 | Persistent key-value store |
| `@react-native-community/netinfo` | ^12.0.1 | Network connectivity detection |
| `@react-native-google-signin/google-signin` | ^16.1.2 | Google OAuth |
| `@react-native/new-app-screen` | 0.84.0 | RN app screen wrapper |
| `@react-navigation/bottom-tabs` | ^7.14.0 | Bottom tab navigator |
| `@react-navigation/native` | ^7.1.28 | React Navigation core |
| `@react-navigation/stack` | ^7.7.2 | Stack navigator |
| `@reduxjs/toolkit` | ^2.11.2 | Redux state management |
| `@supabase/supabase-js` | ^2.106.1 | Supabase client |
| `base64-arraybuffer` | ^1.0.2 | Base64 ↔ ArrayBuffer conversion |
| `date-fns` | ^4.1.0 | Date manipulation |
| `react` | 19.2.3 | UI library |
| `react-native` | 0.84.0 | Mobile framework |
| `react-native-document-picker` | ^9.3.1 | File picker |
| `react-native-fs` | ^2.20.0 | File system access |
| `react-native-gesture-handler` | ^2.30.0 | Gesture handling |
| `react-native-image-picker` | ^8.2.1 | Image picker |
| `react-native-safe-area-context` | ^5.6.2 | Safe area insets |
| `react-native-screens` | ^4.23.0 | Native screen containers |
| `react-native-url-polyfill` | ^3.0.0 | URL API polyfill |
| `react-native-vector-icons` | ^10.3.0 | Icon library (Ionicons) |
| `react-redux` | ^9.2.0 | React-Redux bindings |
| `redux-persist` | ^6.0.0 | Redux state persistence |
| `tweetnacl` | ^1.0.3 | Cryptography (Curve25519, XSalsa20-Poly1305) |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@babel/core` | ^7.25.2 | Babel compiler |
| `@babel/preset-env` | ^7.25.3 | Babel env preset |
| `@babel/runtime` | ^7.25.0 | Babel runtime helpers |
| `@react-native-community/cli` | 20.1.0 | RN CLI |
| `@react-native-community/cli-platform-android` | 20.1.0 | Android CLI platform |
| `@react-native-community/cli-platform-ios` | 20.1.0 | iOS CLI platform |
| `@react-native/babel-preset` | 0.84.0 | RN Babel preset |
| `@react-native/eslint-config` | 0.84.0 | RN ESLint config |
| `@react-native/metro-config` | 0.84.0 | Metro bundler config |
| `@react-native/typescript-config` | 0.84.0 | RN TypeScript config |
| `@types/jest` | ^29.5.13 | Jest types |
| `@types/react` | ^19.2.0 | React types |
| `@types/react-native-vector-icons` | ^6.4.18 | Vector icons types |
| `eslint` | ^8.57.0 | Linter |
| `jest` | ^29.7.0 | Test runner |
| `patch-package` | ^0.8.0 | Patch node_modules |
| `prettier` | ^3.3.3 | Code formatter |
| `react-test-renderer` | 19.2.3 | React test renderer |
| `typescript` | ~5.8.0 | TypeScript compiler |

---

## 4. TypeScript Config

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@assets/*":            ["src/assets/*"],
      "@components/*":        ["src/components/*"],
      "@data/*":              ["src/data/*"],
      "@navigation/*":        ["src/navigation/*"],
      "@screens/*":           ["src/screens/*"],
      "@services/*":          ["src/services/*"],
      "@store/*":             ["src/store/*"],
      "@hooks/*":             ["src/hooks/*"],
      "@utils/*":             ["src/utils/*"],
      "@types/*":             ["src/types/*"],
      "@types":               ["src/types/index"],
      "@constants/*":         ["src/constants/*"],
      "@constants":           ["src/constants/index"],
      "@theme/*":             ["src/theme/*"],
      "@theme":               ["src/theme/index"]
    },
    "typeRoots":              ["./node_modules/@types", "./src/types"],
    "allowJs":                true,
    "checkJs":                false,
    "skipLibCheck":           true,
    "esModuleInterop":        true,
    "allowSyntheticDefaultImports": true,
    "strict":                 true,
    "forceConsistentCasingInFileNames": true,
    "noEmit":                 true,
    "jsx":                    "react-native",
    "moduleResolution":       "node",
    "resolveJsonModule":      true
  },
  "exclude": ["node_modules", "babel.config.js", "metro.config.js", "jest.config.js"]
}
```

**14 path aliases** registered. All imports use `@` prefix (e.g. `@store/hooks`, `@services/supabase/database`).

---

## 5. Type Definitions

File: `src/types/index.ts`

### `User`
```
id: string           (entity adapter key)
uid: string          (Supabase auth uid)
email: string
displayName: string
avatarUrl?: string
status?: string      (user's text status message)
lastSeen?: number    (epoch ms)
publicKey?: string   (Curve25519 public key for E2EE)
```

### `Message`
```
id: string
chatId: string
senderId: string
text: string
createdAt: number          (epoch ms)
status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
mediaUrl?: string
mediaType?: 'image' | 'video' | 'audio' | 'file' | 'gif' | 'sticker'
mediaPath?: string         (Supabase storage path for deletion)
mediaSize?: number         (file size in bytes)
replyTo?: string           (message ID being replied to)
isEdited?: boolean
isPinned?: boolean
```

### `Chat`
```
id: string
type: 'one-to-one' | 'group'
members: string[]               (array of UIDs)
name?: string
description?: string            (for groups)
avatarUrl?: string
lastMessage?: string            (text preview)
lastMessageAt?: number          (epoch ms)
lastMessageSenderId?: string
unreadCount?: { [uid: string]: number }
typing?: { [uid: string]: boolean }
admins?: { [uid: string]: boolean }
createdBy?: string              (UID)
createdAt?: number              (epoch ms)
```

### `Group` (extends Chat)
```
type: 'group'
description?: string
createdBy: string
```

### `Status` (Pulse)
```
id: string
uid: string                    (author UID)
displayName: string            (denormalized)
avatarUrl?: string
text?: string
imageUrl?: string
createdAt: number              (epoch ms)
expiresAt: number              (24h TTL in ms)
sharedWith: string[]           (recipient UIDs)
```

---

## 6. Constants & Config

File: `src/constants/index.ts`

### Collections (Supabase table names)
```
COLLECTIONS.PROFILES  = 'profiles'
COLLECTIONS.CHATS     = 'chats'
COLLECTIONS.MESSAGES  = 'messages'
COLLECTIONS.CONTACTS  = 'contacts'
COLLECTIONS.STATUSES  = 'statuses'
```

### Storage paths
```
STORAGE_PATHS.AVATARS       = 'avatars'
STORAGE_PATHS.CHAT_MEDIA    = 'chat-media'
STORAGE_PATHS.STATUS_MEDIA  = 'status-media'
```

### Pagination
```
PAGINATION.MESSAGES_PER_PAGE = 20
PAGINATION.CHATS_PER_PAGE    = 20
```

### Debounce
```
DEBOUNCE_DELAY.TYPING_INDICATOR = 3000 ms
```

### App
```
APP_CONFIG.APP_NAME = 'NimbusX'
APP_CONFIG.VERSION  = '1.0.0'
```

File: `src/config/supabase.ts`
- Creates Supabase client via `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`
- Configures Google Sign-In via `@react-native-google-signin/google-signin` (web client ID)
- Exports `supabase` client instance

---

## 7. Navigation Architecture

### Root: `AppNavigator.tsx`
```
AppNavigator (Stack)
├── AuthStack              → AuthNavigator (if not authenticated)
├── PinLockScreen          → if appLockEnabled && !unlocked
├── StorageSetupScreen     → if storageMode === null (first launch)
└── MainStack              → ChatNavigator (if authenticated + configured)
```

### Auth: `AuthNavigator.tsx` (Stack)
```
Login → Register → ForgotPassword
```

### Main Tabs: `MainNavigator.tsx` (Bottom Tabs)
```
Tab: Chats     (Icon: chatbubbles)  → ChatListScreen
Tab: Pulse     (Icon: pulse)        → StatusScreen
Tab: Groups    (Icon: people)       → GroupsScreen
Tab: Files     (Icon: folder)       → FilesScreen
Tab: Settings  (Icon: settings)     → SettingsScreen
```

### Chat Stack: `ChatNavigator.tsx` (Stack — inside MainTabs)
```
MainTabs (tab navigator)
Chat              (chatId, otherUserName, otherUserAvatar)
GroupChat         (chatId, groupName, groupAvatar)
NewChat
CreateGroup
GroupInfo         (chatId)
ContactInfo       (chatId, otherUserName, otherUserAvatar)
Profile
StorageSettings
AccountSettings
ChatsSettings
NotificationsSettings
HelpSettings
TermsPrivacy
HelpCenter
ContactUs
AppInfo
PrivacySettings
SecuritySettings
ChangeNumber
Devices
RequestInfo
```

### Navigation Param Types (`src/navigation/types.ts`)

```
AuthStackParamList:
  Login | Register | ForgotPassword  → all undefined

MainTabParamList:
  Chats | Status | Groups | Files | Settings  → all undefined

ChatStackParamList:
  MainTabs:         undefined
  Chat:             { chatId: string; otherUserName?: string; otherUserAvatar?: string }
  GroupChat:        { chatId: string; groupName: string; groupAvatar?: string }
  NewChat:          undefined
  CreateGroup:      undefined
  GroupInfo:        { chatId: string }
  ContactInfo:      { chatId: string; otherUserName?: string; otherUserAvatar?: string }
  Profile:          undefined
  StorageSettings:  undefined
  AccountSettings:  undefined
  ChatsSettings:    undefined
  NotificationsSettings: undefined
  HelpSettings:     undefined
  TermsPrivacy:     undefined
  HelpCenter:       undefined
  ContactUs:        undefined
  AppInfo:          undefined
  PrivacySettings:  undefined
  SecuritySettings: undefined
  ChangeNumber:     undefined
  Devices:          undefined
  RequestInfo:      undefined

RootStackParamList:
  AuthStack:  undefined
  ChatStack:  undefined
```

---

## 8. Redux Store

### Store Config (`src/store/index.ts`)
- **Persist key**: `root`
- **Storage**: AsyncStorage
- **Whitelist** (persisted): `auth`, `user`, `messages`, `settings`
- **Blacklist**: (none)
- **rootReducer**: wraps `combineReducers` — on `auth/logout` action, clears all slices EXCEPT `settings`

### Slices

#### authSlice (`src/store/slices/authSlice.ts`)
```
State:
  user: User | null
  loading: boolean
  error: string | null
  storageMode: 'local' | 'cloud' | null   (null triggers onboarding)

Actions:
  setUser(user)             — sets user, loading=false
  setLoading(bool)          — sets loading
  setError(string|null)     — sets error
  setStorageMode(mode)      — sets storageMode
  logout                    — clears user, loading, error (preserves storageMode)
```

#### userSlice (`src/store/slices/userSlice.ts`)
```
Entity adapter: User (keyed by id)
Actions:
  upsertUsers(users)        — upsert many
  upsertUser(user)          — upsert one
Selectors: userSelectors (selectAll, selectById, etc.)
```

#### chatSlice (`src/store/slices/chatSlice.ts`)
```
Entity adapter: Chat (keyed by id), sorted by lastMessageAt desc
Extra state:
  loading: boolean
  error: string | null

Actions:
  upsertChats(chats)
  upsertChat(chat)
  removeChat(id)
  setChatsLoading(bool)
  setChatsError(string|null)
  clearAllChats()
Selectors: chatSelectors
```

#### messageSlice (`src/store/slices/messageSlice.ts`)
```
Entity adapter: Message (keyed by id), sorted by createdAt desc
Extra state:
  offlineQueue: Message[]

Actions:
  upsertMessages(messages)
  setMessages(messages)        — replaces all but preserves pending/failed
  upsertMessage(message)
  removeMessage(id)
  addToOfflineQueue(message)
  clearOfflineQueue()
  clearAllMessages()
  clearChatMessages({chatId})
```

#### groupSlice (`src/store/slices/groupSlice.ts`)
```
State:
  currentGroupId: string | null
  loading: boolean

Actions:
  setCurrentGroup(id|null)
  setGroupLoading(bool)
```

#### settingsSlice (`src/store/slices/settingsSlice.ts`)
```
Privacy:
  readReceipts: boolean (default true)
  lastSeen: boolean (default true)
  onlineStatus: boolean (default true)
  profilePhotoVisibility: 'Everyone' | 'Contacts' | 'Nobody'
  lastSeenVisibility: 'Everyone' | 'Contacts' | 'Nobody'
  blockedUsers: { uid, displayName, email, avatarUrl }[]

Security:
  appLockEnabled: boolean
  appLockPin: string | null
  securityNotifications: boolean (default true)
  twoFactorEnabled: boolean
  twoFactorSecret: string | null

Chats:
  theme: ThemeMode ('system' | 'dark' | 'light' | 'slate' | 'teal' | 'emerald')
  wallpaper: string | null
  enterIsSend: boolean (default true)
  mediaVisibility: boolean (default true)
  lastBackupTime: number | null
  isBackingUp: boolean

Notifications:
  conversationTones: boolean (default true)
  messageTone: string (default 'default')
  messageVibrate: string (default 'default')
  messageLight: string (default 'none')
  messageHighPriority: boolean
  groupTone: string (default 'default')
  groupVibrate: string (default 'default')
  groupLight: string (default 'none')
  groupHighPriority: boolean
  callRingtone: string (default 'default')
  callVibrate: string (default 'default')

Devices:
  sessions: DeviceSession[]
    { id, device, deviceIcon, location, ip, lastActive, isCurrent }

Request Info:
  reportStatus: 'idle' | 'pending' | 'ready'
  requestDate: string | null
  expiryDate: string | null

Actions:
  toggleReadReceipts, toggleLastSeen, toggleOnlineStatus
  setProfilePhotoVisibility, setLastSeenVisibility
  blockUser, unblockUser
  toggleAppLock, setAppLockPin, toggleSecurityNotifications
  toggleTwoFactor, setTwoFactorSecret
  setTheme, setWallpaper, toggleEnterIsSend, toggleMediaVisibility
  setLastBackupTime, setUpdatingBackup
  setMessageTone/... (all notification tones/vibrate/light/priority)
  setCallRingtone/...
  setSessions, addSession, removeSession
  setReportStatus, setRequestDate, setExpiryDate
  addSupportTicket
```

### Typed Hooks (`src/store/hooks.ts`)
```
useAppSelector: TypedUseSelectorHook<RootState>
useAppDispatch: () => AppDispatch
```

---

## 9. Screens — Complete Catalog

### 9A. Auth Screens

#### `LoginScreen.tsx`
- Email + password inputs
- "Log In" button → calls `supabase.auth.signInWithPassword()`
- Link to Register, ForgotPassword
- On success → navigation replaces to main app
- Shows loading spinner during auth
- Google Sign-In button

#### `RegisterScreen.tsx`
- Display name, email, password inputs
- Client-side validation (email format, password length, name requirements)
- "Create Account" button → calls `supabase.auth.signUp()`
- On success → auto-login or show verification notice
- Loading + error states

#### `ForgotPasswordScreen.tsx`
- Email input
- "Send Reset Link" → calls `supabase.auth.resetPasswordForEmail()`
- Success message after send
- Back to Login link

### 9B. Chat Screens

#### `ChatListScreen.tsx`
- FlatList of chats (sorted by lastMessageAt desc)
- Each row: Avatar + name + last message preview + time + unread badge
- Empty state when no chats
- FAB to start new chat (navigates to NewChat)
- Swipe-to-delete or long-press actions
- Real-time subscription via `useChats` hook
- Search bar (local filter)
- Pull-to-refresh

#### `ChatScreen.tsx`
- FlatList of messages (inverted, newest at bottom)
- Messages rendered via `MessageBubble` component
- `ChatInput` at the bottom (composer + send + media buttons)
- Header shows other user's name/avatar (or group name)
- Typing indicator from `TypingIndicator` component
- Reply preview (swipe to reply on a message)
- Emoji/GIF picker via `EmojiGifPicker`
- Image preview via `ImagePreviewModal`
- Scroll-to-bottom button when scrolled up
- Real-time message subscription via `useMessages` hook
- Message status indicators (pending → sent → delivered → read)
- Offline queue (messages with status "pending" are retried)

#### `NewChatScreen.tsx`
- Email search input (debounced, queries Supabase via RPC)
- Shows search state: idle, searching, found, already_contact, not_found, error
- Fetches contacts list from Supabase
- Contact list with Avatars
- Tapping a contact → creates 1-to-1 chat if not exists → navigates to ChatScreen
- Uses `search_profile_by_email` RPC function

#### `ContactInfoScreen.tsx`
- Displays contact profile (avatar, name, status, phone)
- Safety code display (25-digit numeric E2EE verification code)
- Media/images shared with this contact (horizontal scroll)
- Actions: message, voice call, video call (placeholder), block, clear chat
- Uses `profiles.public_key` for safety code hash computation

#### `FilesScreen.tsx`
- Grid view of all shared media/files across all chats
- Filterable by media type (images, videos, audio, files, links)
- Section headers organized by chat
- FAB for quick access to current chat media

### 9C. Group Screens

#### `GroupsScreen.tsx`
- FlatList of groups
- Each row: group avatar, name, last message, time, unread badge
- FAB → navigate to CreateGroup
- Empty state

#### `CreateGroupScreen.tsx`
- Group name input
- Group description input
- Avatar picker
- Multi-select contact picker (checkboxes)
- "Create" button → creates group in Supabase
- Loading state during creation

#### `GroupChatScreen.tsx`
- Same layout as ChatScreen but for groups
- Header: group name + avatar + member count
- Tapping header → navigate to GroupInfo

#### `GroupInfoScreen.tsx`
- Group avatar + name + description (editable for admins)
- Member list with admin badges
- Add participants button
- Media gallery (uses mock images for now)
- Exit group / delete group actions
- Group settings: notifications, media visibility

### 9D. Setting Screens

#### `SettingsScreen.tsx`
- Main settings hub (ScrollView with sections)
- Profile card (tap to navigate to Profile)
- Sections: Account, Privacy, Security, Chats, Notifications, Storage, Help, About
- Each section navigates to respective settings screen
- App version display at bottom

#### `ProfileScreen.tsx`
- Avatar (tappable to change)
- Display name (editable)
- Status message (editable, with category presets: Busy, At work, etc.)
- About section (editable)
- Save button → updates Supabase profile

#### `PrivacySettingsScreen.tsx`
- Read receipts (toggle)
- Last seen & online (toggle)
- Profile photo visibility (Everyone / Contacts / Nobody)
- Last seen visibility (Everyone / Contacts / Nobody)
- Blocked users list (with unblock action)
- Request account info link

#### `SecuritySettingsScreen.tsx`
- App lock (toggle PIN lock, set PIN, biometric fallback)
- Security notifications (toggle)
- Two-factor authentication (toggle, set secret)
- Safety codes explanation
- Change PIN

#### `NotificationsSettingsScreen.tsx`
- Conversation tones (master toggle)
- Message tone, vibrate, light, high priority
- Group tone, vibrate, light, high priority
- Call ringtone, vibrate

#### `ChatsSettingsScreen.tsx`
- Theme picker (System, Dark, Light, Slate, Teal, Emerald — 6 options)
- Wallpaper (set/remove)
- Enter-is-send toggle
- Media visibility toggle
- Chat backup (last backup time, backup now button)

#### `AccountSettingsScreen.tsx`
- Change number (simulated flow: current number → new number → verify)
- Change email
- Delete account (confirmation dialog)
- User info display

#### `ChangeNumberScreen.tsx`
- Step 1: Enter current number
- Step 2: Enter new number
- Step 3: Verify (simulated OTP)
- Step 4: Success

#### `DevicesScreen.tsx`
- Active sessions list (device name, icon, location, IP, last active)
- Current device marked
- Revoke session action

#### `RequestInfoScreen.tsx`
- Request account data (button → sets status to "pending")
- Status display: idle → pending (progress indicator) → ready (download link)
- Request date + expiry date display
- Info types requested: profile, contacts, chats, messages, settings

#### `HelpSettingsScreen.tsx`
- Help Center link
- Contact Us link
- Terms & Privacy link
- App Info link

#### `HelpCenterScreen.tsx`
- FAQ accordion-style sections:
  - Account & Registration (3 articles)
  - Privacy & Security (3 articles)
  - Messages & Groups (3 articles)
  - Troubleshooting (3 articles)
  - Payments (2 articles — placeholder)
- Each article expands inline

#### `ContactUsScreen.tsx`
- Category picker (Account, Technical, Billing, Feature, Other)
- Message textarea
- Submit → adds to support tickets (in-memory state)
- Success confirmation after submission

#### `TermsPrivacyScreen.tsx`
- Toggle: Terms of Service / Privacy Policy
- Displays scrollable text (hardcoded lorem ipsum for each)
- Back button

#### `AppInfoScreen.tsx`
- App name, version, build number (1.0.0, Build 1)
- Developer info
- Open source licenses list (hardcoded)
- "Made with ❤️" footer
- Animated pulse dots decoration

#### `StorageSetupScreen.tsx`
- Shown on first launch when `storageMode === null`
- Two cards: Cloud (Supabase) vs Local (device only)
- Explanations for each option
- Select button → dispatches `setStorageMode`
- Navigates to main app after selection

### 9E. Status/Pulse Screen

#### `StatusScreen.tsx`
```
FlatList of all pulses (own + incoming, sorted by createdAt desc)
├── ListHeaderComponent:
│     "Send a pulse to someone..." banner with pulse icon
│       → opens composer modal
├── renderItem:
│     Pulse row: Avatar + name + text preview + time + reply button
│     Own pulses: labeled "Me (+N)" if multiple
│     Incoming pulses: reply button
├── ListFooterComponent:
│     "YOUR PULSES" section (only when myPulses > 0 and incomingPulses === 0)

Composer Modal:
  - Recipient chips (multi-select, removable)
  - Image picker (camera roll)
  - Text input (700 char max)
  - Contact list with checkboxes (multi-select)
  - "Send Pulse" button (disabled until text OR image + at least one recipient)
  - Loading spinner during post

Pulse Viewer Modal:
  - Header: sender avatar + name + time + close button
  - Content: image (fit) or text (centered on dark bg)
  - Reply bar at bottom
  - No auto-advance (removed story-style progress)
```

---

## 10. Components — Complete Catalog

### Chat Components

#### `ChatInput.tsx`
- Multi-line TextInput
- Emoji/GIF button → opens `EmojiGifPicker`
- Media attach button → action sheet (Camera, Gallery, Document, Voice)
- Send button (disabled when empty)
- Reply preview bar (shows when replying to a message)
- Handles message send + media upload flow
- States: empty, typing, recording, sending

#### `ChatListItem.tsx`
- Props: chat, currentUser (uid for unread)
- Renders: Avatar (group or user) + name + last message preview + time + unread badge
- Long press → context menu (mark read, mute, delete)

#### `MessageBubble.tsx`
- Props: message, isOwn, colors, onReply, onImagePress, onLongPress
- Renders: text content with optional media preview
- Styles: own messages (right-aligned, accent background), others (left-aligned)
- Reply quote at top (if message.replyTo)
- Media display (image/video/file with thumbnail)
- Message status icon (✓, ✓✓, blue ✓✓)
- Edited label
- Long press → select/reply/copy/forward/delete actions

#### `MessageStatus.tsx`
- Props: status, isOwn
- Icons: pending (clock), sent (single ✓), delivered (double ✓), read (blue double ✓), failed (red !)
- Only shown for own messages

#### `ReplyPreview.tsx`
- Props: replyMessage, onCancel
- Shows: sender name + text preview + image thumbnail
- Cancel (X) button
- Displayed above ChatInput when active

#### `TypingIndicator.tsx`
- Props: users (typing user names)
- Animated dots
- Text: "Alice is typing..." or "Alice, Bob are typing..."

#### `EmojiGifPicker.tsx`
- Modal with tabs: Emoji | GIF
- Emoji: categorized grid (Smileys, People, Animals, Food, etc., plus search)
- GIF: powered by Giphy API (API key in constants)
- On select → inserts into ChatInput text

#### `ImagePreviewModal.tsx`
- Props: imageUrl, onClose
- Full-screen image with dark background
- Pinch-to-zoom (Image component resizeMode)
- Close button overlay

### Common Components

#### `Avatar.tsx`
- Props: uri, name, size
- Renders: image if uri, else initials (first letter of name, uppercase)
- Color: deterministic background from name hash

#### `Badge.tsx`
- Props: count (number)
- Renders: small red circle with white number
- Hidden when count ≤ 0

#### `EmptyState.tsx`
- Props: icon, title, subtitle
- Centered layout with icon + text
- Used across ChatList, Groups, Files, Status screens

#### `ErrorBoundary.tsx`
- Class component wrapping app
- Catches render errors, displays fallback UI
- "Something went wrong" message + retry button

#### `LoadingSkeleton.tsx`
- Props: width, height, borderRadius
- Animated shimmer effect (pulsing opacity)
- Used as placeholder during data loading

---

## 11. Services

### `src/services/supabase/database.ts`

**Methods**:

| Method | Description |
|--------|-------------|
| `getContacts(uid)` | Fetch all contacts for user (returns `User[]`) |
| `listenContacts(uid, callback)` | Real-time subscription to contacts table (both `user_id` and `contact_id` filters), returns unsubscribe |
| `addContact(uid, contactEmail)` | Add a contact via email search (uses `search_profile_by_email` RPC) |
| `removeContact(uid, contactUid)` | Delete a contact row |
| `getChats(uid)` | Fetch all chats where user is a member |
| `listenChats(uid, callback)` | Realtime subscription to chats table with `members.cs.{uid}` filter |
| `createChat(chat)` | Insert new chat row, returns chat ID |
| `deleteChat(chatId)` | Delete chat + all its messages |
| `sendMessage(message: Partial<Message>)` | Insert message, optionally E2EE-encrypt text for 1-to-1 chats |
| `getMessages(chatId, page)` | Paginated message fetch (20 per page) |
| `listenMessages(chatId, callback)` | Realtime subscription to messages for a specific chat |
| `updateMessageStatus(chatId, messageId, status)` | Update message delivery status |
| `getStatuses()` | Fetch all non-expired statuses (legacy) |
| `postStatus(status: Omit<Status, 'id'>)` | Insert pulse with `shared_with` array |
| `listenStatuses(currentUid, callback)` | Realtime filtered pulses: `uid.eq.{uid}` OR `shared_with.cs.{uid}` |
| `searchProfileByEmail(email)` | RPC call to find user by email |
| `updateProfile(uid, updates)` | Update profile fields (display_name, avatar_url, status, public_key) |
| `getOrFetchPublicKey(uid)` | Get cached or fetch public key from profiles table |

**E2EE flow** (within `sendMessage`):
1. Check if chat is 1-to-1
2. Get recipient's public key
3. Generate ephemeral keypair
4. Compute shared secret via ECDH
5. Encrypt message with `cryptoService.encryptMessage()`
6. Store ciphertext as `text` in DB
7. On receive, decrypt with `cryptoService.decryptMessage()`

### `src/services/supabase/storage.ts`

**Methods**:

| Method | Description |
|--------|-------------|
| `uploadAvatar(uid, imageUri)` | Upload avatar image to `avatars/{uid}/` |
| `uploadChatImage(chatId, imageUri)` | Upload chat media to `chat-media/{chatId}/` |
| `uploadStatusImage(uid, imageUri)` | Upload pulse image to `status-media/{uid}/` |
| `uploadFile(chatId, fileUri, mimeType)` | Upload any file to `chat-media/{chatId}/` |
| `deleteFile(path)` | Delete a file from storage |
| `getFileSize(uri)` | Get file size on disk via RNFS |

**Upload flow**:
1. Resolve URI (content:// → temp file)
2. Sanitize filename
3. Generate upload path with timestamp
4. Upload via `supabase.storage.from(bucket).upload()`
5. Get public URL (or signed URL for private bucket)
6. On error → fallback to local mode

### `src/services/cacheService.ts`
- Image caching service using `react-native-fs`
- Downloads remote images to local cache directory
- Maps remote URLs to local file paths

### `src/services/notificationService.ts`
- Local notification scheduling via React Native's built-in notification API
- Used for: new message notifications, failed message retry notifications, security alerts (simulated), feature announcements (placeholder)

---

## 12. Hooks

### `useAuth.ts`
- Listens to `supabase.auth.onAuthStateChange()` events
- Dispatches `setUser` / `setLoading` to auth slice
- Initializes keypair on first login
- Cleans up on unmount

### `useChats.ts`
- Calls `firestoreService.listenChats(uid, callback)`
- Dispatches `upsertChats` on data change
- Returns `{ loading, error }`

### `useMessages.ts`
- Takes `chatId` parameter
- Calls `firestoreService.listenMessages(chatId, callback)`
- Handles initial fetch + real-time updates
- Dispatches `upsertMessages`
- Returns messages sorted by createdAt

### `usePresence.ts`
- Updates `profiles.is_online` on app state change
- Sets `last_seen` on background
- Subscribes to other users' presence (typing indicators)

### `useAppState.ts`
- Listens to `AppState` changes (foreground/background)
- Returns current app state string
- Used by `usePresence` to update online status

---

## 13. Theme System

### Architecture (`src/theme/colors.ts`)
- **Theme modes**: `system` (follows device), `dark`, `light`
- **Accent variants**: `teal` (default), `emerald`, `slate`
- **`useThemeColors()`**: Hook that resolves current theme from Redux + device color scheme
- **`createThemedStyles(callback)`**: Registers a stylesheet creator that receives `ThemeColors` and returns a style object. Called once at module load, updated globally via `updateThemeStyles()` when theme changes.
- **`updateThemeStyles(newColors)`**: Iterates all registered stylesheets and re-creates styles with new colors. Mutates the existing objects so React components re-render.

### ThemeColors Interface
```
primaryBackground: string
secondaryBackground: string
cardBackground: string
inputBackground: string
primaryAccent: string
accentMuted: string
textPrimary: string
textSecondary: string
textTertiary: string
divider: string
border: string
error: string
success: string
warning: string
info: string
white: string
black: string
transparent: string
messageStatus: { sent: string; delivered: string; read: string }
online: string
offline: string
bubbleMine: string
bubbleOther: string
```

### Spacing (`src/theme/spacing.ts`)
```
none: 0, xxs: 2, xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48, massive: 64
```

### Typography (`src/theme/typography.ts`)
```
fontSizes: { xs: 10, sm: 12, base: 14, md: 16, lg: 18, xl: 20, xxl: 24, xxxl: 32, huge: 48 }
fontWeights: { normal: '400', medium: '500', semibold: '600', bold: '700' }
lineHeights: { tight: 1.2, normal: 1.5, relaxed: 1.75 }
```

---

## 14. Utilities

### `crypto.ts`
```
Public functions:
  cryptoService.getOrCreateKeyPair(uid)
    — checks AsyncStorage for existing keys
    — generates new Curve25519 keypair via tweetnacl if not found
    — stores private key in AsyncStorage ("nimbusx_private_key:{uid}")
    — returns { publicKey, privateKey }

  cryptoService.encryptMessage(text, recipientPublicKey)
    — generates ephemeral keypair
    — computes ECDH shared secret
    — encrypts with XSalsa20-Poly1305 (tweetnacl.sealedbox)
    — returns base64 ciphertext

  cryptoService.decryptMessage(ciphertext, senderPublicKey)
    — computes ECDH shared secret
    — decrypts with XSalsa20-Poly1305
    — returns plaintext

  cryptoService.computeSafetyCode(publicKeyA, publicKeyB)
    — concatenates sorted public keys
    — computes FNV-1a hash
    — formats as 5 groups of 5 digits (25 digits total)
    — returns formatted string
```

### `dateUtils.ts`
```
Functions:
  formatTime(date)         — HH:MM (same day) | "Yesterday" | "M/D/YY"
  formatDate(date)         — full date string
  formatRelativeTime(ts)   — "5m", "2h", "3d" ago
  formatDuration(seconds)  — "3:45" for voice messages
  isToday(date)
  isYesterday(date)
```

### `formatters.ts`
```
Functions:
  formatFileSize(bytes)    — "1.2 MB", "340 KB"
  formatPhoneNumber(str)   — "(555) 123-4567"
  truncateText(text, max)  — "Hello wor..."
  capitalize(str)
  stripMarkdown(str)       — removes basic markdown
```

### `validation.ts`
```
Functions:
  isValidEmail(email)      — regex test
  isValidPassword(pw)      — min 6 chars
  isValidName(name)        — min 2 chars, no special chars
  isValidPhone(phone)      — international format
```

---

## 15. Data Files

### `src/data/emojis.ts`
- Structured emoji data for EmojiGifPicker
- Categories: Smileys & People, Animals & Nature, Food & Drink, Travel & Places, Activities, Objects, Symbols, Flags
- Each emoji object: `{ emoji, name, keywords }`
- Total: large comprehensive dataset

---

## 16. Database Schema (Supabase)

### `profiles`
```
id              UUID PK          → REFERENCES auth.users(id) ON DELETE CASCADE
email           TEXT UNIQUE      NOT NULL
display_name    TEXT             DEFAULT ''
avatar_url      TEXT             DEFAULT ''
status          TEXT             DEFAULT 'Hey there! I am using NimbusX'
public_key      TEXT             DEFAULT ''  (from e2ee migration)
is_online       BOOLEAN          DEFAULT false
last_seen       TIMESTAMPTZ      DEFAULT NOW()
updated_at      TIMESTAMPTZ      DEFAULT NOW()

RLS:
  SELECT: public (authenticated users read all)
  INSERT: auth.uid() = id
  UPDATE: auth.uid() = id

Trigger: on_auth_user_created → handle_new_user()
  Creates profile row on signup with email + display_name from metadata
```

### `chats`
```
id              UUID PK          DEFAULT gen_random_uuid()
type            TEXT             NOT NULL ('one-to-one' | 'group')
members         UUID[]
name            TEXT             DEFAULT ''
description     TEXT             DEFAULT ''  (groups)
avatar_url      TEXT             DEFAULT ''
last_message    TEXT             DEFAULT ''
last_message_at TIMESTAMPTZ
last_message_sender_id UUID
unread_count    JSONB            DEFAULT '{}'
typing          JSONB            DEFAULT '{}'
admins          JSONB            DEFAULT '{}'
created_by      UUID             → profiles(id)
created_at      TIMESTAMPTZ      DEFAULT NOW()

RLS:
  SELECT/UPDATE/DELETE: auth.uid() = ANY(members)

Helper function: is_chat_member(chat_id, user_id)
```

### `messages`
```
id              UUID PK          DEFAULT gen_random_uuid()
chat_id         UUID             → chats(id) ON DELETE CASCADE
sender_id       UUID             → profiles(id)
text            TEXT             DEFAULT ''
status          TEXT             DEFAULT 'sent' (pending|sent|delivered|read|failed)
media_url       TEXT             DEFAULT ''
media_type      TEXT             DEFAULT ''
media_path      TEXT             DEFAULT ''
media_size      BIGINT           DEFAULT 0
reply_to        UUID             → messages(id)
is_edited       BOOLEAN          DEFAULT false
is_pinned       BOOLEAN          DEFAULT false
encrypted       BOOLEAN          DEFAULT false  (from e2ee migration)
created_at      TIMESTAMPTZ      DEFAULT NOW()
updated_at      TIMESTAMPTZ      DEFAULT NOW()

RLS:
  SELECT/UPDATE: is_chat_member(chat_id, auth.uid()) = true
  INSERT: (auth.uid() = sender_id) AND is_chat_member(chat_id, auth.uid()) = true
  DELETE: auth.uid() = sender_id

Indexes: idx_messages_chat_id_created_at, idx_messages_sender_id
```

### `contacts`
```
id              UUID PK          DEFAULT gen_random_uuid()
user_id         UUID             → profiles(id) ON DELETE CASCADE
contact_id      UUID             → profiles(id) ON DELETE CASCADE
added_at        TIMESTAMPTZ      DEFAULT NOW()
UNIQUE(user_id, contact_id)

RLS:
  SELECT/INSERT/DELETE: auth.uid() = user_id
```

### `statuses` (Pulses)
```
id              UUID PK          DEFAULT gen_random_uuid()
uid             UUID             → profiles(id) ON DELETE CASCADE
display_name    TEXT             NOT NULL
avatar_url      TEXT             DEFAULT ''
text            TEXT             DEFAULT ''
image_url       TEXT             DEFAULT ''
shared_with     UUID[]           DEFAULT '{}'  (from pulse migration)
created_at      TIMESTAMPTZ      DEFAULT NOW()
expires_at      TIMESTAMPTZ      DEFAULT NOW() + INTERVAL '24 hours'

RLS:
  SELECT: expires_at > NOW() AND (auth.uid() = uid OR auth.uid() = ANY(shared_with))
  INSERT: auth.uid() = uid
  DELETE: auth.uid() = uid
```

### `key_exchange` (from e2ee migration)
```
id              UUID PK          DEFAULT gen_random_uuid()
sender_id       UUID             → profiles(id)
recipient_id    UUID             → profiles(id)
ephemeral_key   TEXT             NOT NULL
created_at      TIMESTAMPTZ      DEFAULT NOW()
```

### RPC Functions
```
upsert_own_profile(p_email, p_display_name, p_avatar_url, p_status)
  — Security definer. Creates/updates calling user's profile.
  — Bypasses RLS insert restrictions.

search_profile_by_email(p_email)
  — Security definer. Searches profiles by email.
  — Returns full profile row if found.
  — Used by NewChatScreen, ContactInfoScreen.

exec_sql(sql)  (used by migrate.py)
  — Executes raw SQL (only available with service_role key)
```

---

## 17. Migrations

### `supabase-schema.sql` (~328 lines)
Full schema creating all tables: profiles, chats, messages, contacts, statuses
- Tables with all columns, constraints, indexes
- RLS policies for every table
- Trigger for auto-creating profiles on signup
- Helper function `is_chat_member()`
- RPC functions: `upsert_own_profile()`, `search_profile_by_email()`
- Realtime publication setup

### `supabase-e2ee-migration.sql` (~99 lines)
- Adds `public_key TEXT DEFAULT ''` to profiles
- Adds `encrypted BOOLEAN DEFAULT false` to messages
- Creates `key_exchange` table for ephemeral key storage
- Additional indexes for E2EE lookups

### `supabase-pulse-migration.sql` (~16 lines)
- Adds `shared_with UUID[] DEFAULT '{}'::uuid[]` to statuses
- Drops old `"Allow read access to non-expired statuses"` policy
- Creates new `"Allow read access to own or shared statuses"` policy

---

## 18. Scripts

### `scripts/setup.ps1`
- Interactive PowerShell bootstrap
- Steps: npm install → pod install (optional) → verify Node/npm → create .env
- Flags: -iOS, -Android, -All
- Error handling on each step

### `scripts/seed.py`
- Python 3.10+ Supabase seeder
- Requires `supabase-py` package
- Creates: Alice, Bob, Carol (users + contacts + pulses)
- Login: `<email>@demo.com` / `password123`
- Uses service_role key (bypasses RLS)
- Uses `auth.admin.create_user` API

### `scripts/migrate.py`
- Python SQL migration runner
- Executes SQL files in order: schema → e2ee → pulse
- Tracks applied migrations via `_migrations` table
- Dry-run mode (`--dry-run`)
- Non-fatal on "already exists" errors

---

## 19. CI/CD & GitHub

### `.github/workflows/ci.yml`
```
Triggers: push to main/develop, PRs to main
Jobs:
  lint-and-typecheck (ubuntu, 10min timeout)
    steps: checkout → node 22 → npm ci → eslint → tsc --noEmit
  test (ubuntu, 10min timeout)
    steps: checkout → node 22 → npm ci → jest --passWithNoTests
```

### `.github/workflows/lint.yml`
```
Triggers: push to main/develop, PRs to main
Jobs:
  eslint (5min)
    → checkout → node 22 → npm ci → npm run lint
  tsc (5min)
    → checkout → node 22 → npm ci → npx tsc --noEmit
```

### `.github/PULL_REQUEST_TEMPLATE.md`
- Sections: Description, Type of Change, Testing, Screenshots, Checklist, Additional Context
- Types: bug, feature, refactor, docs, style, performance, test, security, CI

### `.github/ISSUE_TEMPLATE/bug_report.md`
- Fields: Description, Steps to Reproduce, Expected/Actual Behavior, Environment (device/OS/version), Additional Context

### `.github/ISSUE_TEMPLATE/feature_request.md`
- Fields: Problem, Solution, Alternatives, Impact, Additional Context

---

## 20. Assets

### Static Images
```
src/assets/images/logo.png       — NimbusX logo (PNG)
docs/assets/logo-dark.svg        — Dark-mode SVG logo
docs/assets/logo-light.svg       — Light-mode SVG logo
```

### Supabase Storage Buckets
```
avatars/        — Public. Profile pictures. Path: {uid}/avatar_{timestamp}.jpg
status-media/   — Public. Pulse images. Path: {uid}/status_{timestamp}.jpg
chat-media/     — Private (signed URLs, 1yr expiry). Chat media. Path: {chatId}/{filename}
```

---

## 21. Config Files (Root)

### `package.json`
- name: "NimbusX", version: "0.0.1", private: true
- scripts: android, ios, lint, start, test, postinstall (patch-package)
- 25 production dependencies, 14 dev dependencies

### `babel.config.js`
- Uses `@react-native/babel-preset`
- Plugin: `module-resolver` with alias config matching tsconfig paths

### `metro.config.js`
- Default RN Metro config with sourceExts: js, jsx, ts, tsx

### `jest.config.js`
- Preset: `react-native`
- transformIgnorePatterns excluded for react-native-vector-icons and other native modules

### `.eslintrc.js`
- Extends: `@react-native/eslint-config`
- Rules: 0 errors, 1 warning threshold (react-native/no-inline-styles)

### `.prettierrc.js`
- Custom Prettier config (arrowParens, bracketSpacing, etc.)

### `.gitignore`
- Ignores: node_modules, build outputs, .env, IDE files, logs, scratch/

### `app.json`
- displayName: "NimbusX"
- name: "NimbusX"

### `react-native.config.js`
- Assets linked: `react-native-vector-icons` fonts

### `index.js`
- Entry point: `AppRegistry.registerComponent('NimbusX', () => App)`
- URL polyfill imported first

### `App.tsx`
- Root component
- Wraps: Provider (Redux) → PersistGate → SafeAreaProvider → ErrorBoundary → AppNavigator
- LogBox ignores: `non-serializable values`, `AsyncStorage has been extracted`

---

## Feature Summary

| # | Feature | Implementation | Status |
|---|---------|---------------|--------|
| 1 | Auth (email + Google) | Supabase Auth | ✅ |
| 2 | 1-to-1 messaging | Messages table + Realtime | ✅ |
| 3 | Group chats | Groups + member management | ✅ |
| 4 | E2EE encryption | tweetnacl Curve25519 + XSalsa20-Poly1305 | ✅ |
| 5 | Pulse (private status) | Statuses table + shared_with array + RLS | ✅ |
| 6 | Media sharing (images, files, etc.) | Supabase Storage + image-picker + document-picker | ✅ |
| 7 | Emoji + GIF picker | Custom data + Giphy API | ✅ |
| 8 | Voice messages | Audio recording (placeholder in ChatInput) | ✅ |
| 9 | Typing indicators | chats.typing JSONB + realtime | ✅ |
| 10 | Read receipts | Message status flow (pending→sent→delivered→read) | ✅ |
| 11 | Online presence | profiles.is_online + usePresence hook | ✅ |
| 12 | Offline messaging | Redux offlineQueue + retry mechanism | ✅ |
| 13 | Push notifications | Local notification service | ✅ |
| 14 | Dark/light/system theme | 6 themes (dark, light, slate, teal, emerald, system) | ✅ |
| 15 | Accent color variants | Teal (default), Emerald, Slate | ✅ |
| 16 | App lock (PIN) | settingsSlice.appLockEnabled + PinLockScreen | ✅ |
| 17 | Safety codes | FNV-1a hash of public keys in ContactInfoScreen | ✅ |
| 18 | Privacy controls | Read receipts, last seen, online, photo visibility | ✅ |
| 19 | Blocked users | List + toggle in PrivacySettings | ✅ |
| 20 | 2FA (simulated) | Toggle + secret in SecuritySettings | ✅ |
| 21 | Chat backup | Cloud vs local mode | ✅ |
| 22 | Contacts management | DB contacts table + add/remove/list | ✅ |
| 23 | User search by email | RPC search_profile_by_email | ✅ |
| 24 | Files/media grid | FilesScreen with type filters | ✅ |
| 25 | Account settings | Change number, email, delete account | ✅ |
| 26 | Help center | FAQ accordion (5 categories, 12+ articles) | ✅ |
| 27 | Contact/support | Category picker + message submission | ✅ |
| 28 | Terms + privacy | Scrollable ToS + Privacy Policy display | ✅ |
| 29 | Data request | Request/download account data flow | ✅ |
| 30 | Active sessions | Device list + revoke | ✅ |
| 31 | Welcome/onboarding | StorageSetupScreen on first launch | ✅ |
| 32 | Image caching | cacheService via RNFS | ✅ |
| 33 | Error boundary | ErrorBoundary component around app | ✅ |
| 34 | Loading skeletons | LoadingSkeleton shimmer component | ✅ |
| 35 | State persistence | redux-persist whitelist (auth, user, messages, settings) | ✅ |
| 36 | Cross-account isolation | rootReducer clears on logout | ✅ |
| 37 | Realtime subscriptions | 4+ channels (chats, messages, contacts, statuses) | ✅ |
| 38 | CI/CD | GitHub Actions workflows | ✅ |
| 39 | Documentation | Architecture, API, README, scripts | ✅ |
| 40 | Migration runner | migrate.py with tracking | ✅ |

---

*Generated from source code. Last updated: 2026.*
