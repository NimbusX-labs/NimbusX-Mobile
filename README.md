<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/NimbusX-labs/NimbusX-Mobile/main/docs/assets/logo-dark.svg">
    <img alt="NimbusX" src="https://raw.githubusercontent.com/NimbusX-labs/NimbusX-Mobile/main/docs/assets/logo-light.svg" width="480">
  </picture>
</p>

<p align="center">
  <b>End-to-end encrypted messenger.</b><br/>
  <sub>React Native · Supabase · tweetnacl · Zero metadata</sub>
</p>

<p align="center">
  <a href="https://github.com/NimbusX-labs/NimbusX-Mobile/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/NimbusX-labs/NimbusX-Mobile/ci.yml?branch=main&label=CI&logo=github&style=flat-square">
  </a>
  <a href="https://github.com/NimbusX-labs/NimbusX-Mobile/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-06B6D4?style=flat-square">
  </a>
  <a href="https://reactnative.dev/">
    <img src="https://img.shields.io/badge/React_Native-0.84-61DAFB?style=flat-square&logo=react">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript">
  </a>
  <a href="https://supabase.com/">
    <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase">
  </a>
  <img src="https://img.shields.io/badge/E2EE-Curve25519-00E5FF?style=flat-square">
</p>

---

<br/>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#security">Security</a> •
  <a href="#contributing">Contributing</a>
</p>

<br/>

<p align="center">
  <img src="https://github-readme-stats.vercel.app/api/pin/?username=NimbusX-labs&repo=NimbusX-Mobile&theme=tokyonight&hide_border=true&bg_color=0B1120&title_color=00E5FF&icon_color=00E5FF&text_color=9CA3AF">
</p>

<br/>

---

<a name="features"></a>

## ✦ Features

<br/>

<table>
  <tr>
    <td width="50%" align="center">
      <br/>
      <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Locked%20with%20Key.png" width="48"/>
      <br/>
      <b>End-to-End Encryption</b>
      <br/>
      <sub>Curve25519 ECDH + XSalsa20-Poly1305 via tweetnacl.<br/>Keys generated on-device, never transmitted.</sub>
      <br/><br/>
    </td>
    <td width="50%" align="center">
      <br/>
      <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Dizzy.png" width="48"/>
      <br/>
      <b>Pulse</b>
      <br/>
      <sub>Private broadcasts to chosen contacts.<br/>Like a message — but lives in a dedicated feed.</sub>
      <br/><br/>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <br/>
      <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Busts%20in%20Silhouette.png" width="48"/>
      <br/>
      <b>Groups</b>
      <br/>
      <sub>Group chats with admin controls,<br/>member management, and E2EE.</sub>
      <br/><br/>
    </td>
    <td width="50%" align="center">
      <br/>
      <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Framed%20Picture.png" width="48"/>
      <br/>
      <b>Media Sharing</b>
      <br/>
      <sub>Images, GIFs, stickers, files, voice.<br/>All encrypted in transit and at rest.</sub>
      <br/><br/>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <br/>
      <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shield.png" width="48"/>
      <br/>
      <b>Privacy Controls</b>
      <br/>
      <sub>Profile visibility, read receipts,<br/>last seen, online status, blocked users.</sub>
      <br/><br/>
    </td>
    <td width="50%" align="center">
      <br/>
      <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Key.png" width="48"/>
      <br/>
      <b>Safety Codes</b>
      <br/>
      <sub>25-digit numeric codes for<br/>out-of-band identity verification.</sub>
      <br/><br/>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <br/>
      <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Artist%20Palette.png" width="48"/>
      <br/>
      <b>Theme System</b>
      <br/>
      <sub>Dark / Light / System modes.<br/>Accent variants: Teal, Emerald, Slate.</sub>
      <br/><br/>
    </td>
    <td width="50%" align="center">
      <br/>
      <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Link.png" width="48"/>
      <br/>
      <b>App Lock</b>
      <br/>
      <sub>PIN-based lock screen overlay.<br/>Security notifications on key changes.</sub>
      <br/><br/>
    </td>
  </tr>
</table>

<br/>

---

<a name="tech-stack"></a>

## ✦ Tech Stack

<br/>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black">
  <img src="https://img.shields.io/badge/React_Native-0.84-61DAFB?style=for-the-badge&logo=react&logoColor=black">
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/Redux_Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white">
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white">
  <img src="https://img.shields.io/badge/tweetnacl-00E5FF?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMwMEU1RkYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMwQjExMjAiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtd2VpZ2h0PSJib2xkIj5FQTwvdGV4dD48L3N2Zz4=&logoColor=black">
  <img src="https://img.shields.io/badge/React_Navigation_7-8B5CF6?style=for-the-badge&logo=react&logoColor=white">
</p>

<br/>

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 19 + React Native 0.84 | Cross-platform mobile UI |
| **State** | Redux Toolkit + redux-persist | Client state + AsyncStorage persistence |
| **Backend** | Supabase (PG, Auth, Realtime, Storage) | Data, auth, live sync, file hosting |
| **Encryption** | tweetnacl (Curve25519 + XSalsa20-Poly1305) | E2EE message sealing/unsealing |
| **Navigation** | React Navigation 7 (Stack + Bottom Tabs) | Screen routing |
| **Auth** | Supabase Auth + Google Sign-In | Identity provider |

<br/>

---

<a name="getting-started"></a>

## ✦ Getting Started

<br/>

<details>
<summary><b>📱 Quick Start (3 minutes)</b></summary>
<br/>

```bash
# 1. Clone
git clone https://github.com/NimbusX-labs/NimbusX-Mobile.git
cd NimbusX-Mobile

# 2. Install
npm install

# 3. Launch Metro
npm start

# 4. Run
npm run android   # Android emulator/device
npm run ios       # iOS simulator
```

</details>

<details>
<summary><b>🗄️ Supabase Setup</b></summary>
<br/>

```bash
# Requires: Python 3.10+ and supabase-py
# Run all migrations in order:
python scripts/migrate.py --url <SUPABASE_URL> --key <SERVICE_KEY>

# Or manually execute in SQL Editor:
#   1. supabase-schema.sql
#   2. supabase-e2ee-migration.sql
#   3. supabase-pulse-migration.sql

# Configure environment:
cp .env.example .env   # Add SUPABASE_URL and SUPABASE_ANON_KEY

# Enable Google Sign-In in Supabase Auth settings
```

</details>

<details>
<summary><b>🎲 Seed Demo Data</b></summary>
<br/>

```bash
python scripts/seed.py --url <SUPABASE_URL> --key <SERVICE_KEY>
# Creates: Alice, Bob, Carol + contacts + sample pulses
# Login: <email>@demo.com / password123
```

</details>

<details>
<summary><b>📦 Project Structure</b></summary>
<br/>

```
nimbusx/
├── docs/
│   ├── architecture/          # System design docs
│   ├── api/                   # API reference
│   └── screenshots/           # App screenshots
├── scripts/
│   ├── setup.ps1              # Guided bootstrap
│   ├── seed.py                # Demo data seeder
│   └── migrate.py             # SQL migration runner
├── .github/
│   ├── workflows/             # CI pipeline
│   ├── ISSUE_TEMPLATE/        # Bug + feature templates
│   └── PULL_REQUEST_TEMPLATE.md
└── src/
    ├── assets/                # Static assets
    ├── components/            # Reusable UI
    │   ├── chat/              #   Chat components
    │   └── common/            #   Shared components
    ├── config/                # Supabase client
    ├── constants/             # DB collections, paths
    ├── hooks/                 # Custom hooks
    ├── navigation/            # Navigators
    ├── screens/               # Screens
    ├── services/              # DB, storage, cache
    ├── store/                 # Redux slices
    ├── theme/                 # Design system
    ├── types/                 # TypeScript interfaces
    └── utils/                 # Crypto, formatters
```

</details>

<br/>

---

<a name="architecture"></a>

## ✦ Architecture

<br/>

### Encryption Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Alice   │         │ Supabase │         │   Bob    │
│  Device  │         │  Server  │         │  Device  │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │  Generate keypair  │                    │
     │  on login          │                    │
     │───────────────────│                     │
     │                    │                    │
     │  Store public key  │                    │
     │───────────────────>│                    │
     │                    │                    │
     │  Fetch Bob's key   │                    │
     │───────────────────>│                    │
     │<───────────────────│                    │
     │                    │                    │
     │  ECDH shared sec   │                    │
     │  ────────────────  │                    │
     │                    │                    │
     │  Encrypt msg       │                    │
     │                    │                    │
     │───────────────────>│  Store ciphertext  │
     │                    │───────────────────>│
     │                    │                    │
     │                    │                    │  ECDH shared sec
     │                    │                    │  ────────────────
     │                    │                    │
     │                    │                    │  Decrypt msg
     │                    │                    │
```

### Pulse Privacy

```
                    ┌──────────────────┐
                    │   Alice sends    │
                    │   a Pulse        │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │   Bob    │   │  Carol   │   │  Dave    │
        │   ✅     │   │   ✅     │   │   ❌     │
        │  sees it │   │  sees it │   │ no access│
        └──────────┘   └──────────┘   └──────────┘

Alice explicitly chose Bob and Carol as recipients.
Dave never knows the Pulse existed.
```

### Data Flow: Sending a Message

```
Tap Send
  │
  ▼
ChatInput
  │
  ▼
firestoreService.sendMessage()
  │
  ├── Is 1-to-1 chat? ── Yes ──► Fetch recipient's public key
  │                                   │
  │                                   ▼
  │                            ECDH shared secret
  │                                   │
  │                                   ▼
  │                            Encrypt plaintext
  │                                   │
  └── No ─────────────────────────────┘
                      │
                      ▼
              INSERT into messages table
                      │
                      ▼
              Realtime event ──────────► Recipient decrypts
                                                │
                                                ▼
                                        Redux store updated
                                                │
                                                ▼
                                        MessageBubble renders
```

<br/>

---

<a name="security"></a>

## ✦ Security

<br/>

NimbusX was designed with privacy as the default, not an afterthought.

<table>
  <tr>
    <td align="center" width="33%">
      <br/>
      <img src="https://img.shields.io/badge/Curve25519-00E5FF?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMwMEU1RkYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMwQjExMjAiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtd2VpZ2h0PSJib2xkIj5FQ0RIPC90ZXh0Pjwvc3ZnPg==&logoColor=black">
      <br/>
      <b>Key Exchange</b>
      <br/>
      <sub>Curve25519 elliptic-curve Diffie-Hellman.<br/>Keys generated on-device via tweetnacl.<br/>Private key never leaves AsyncStorage.</sub>
      <br/><br/>
    </td>
    <td align="center" width="33%">
      <br/>
      <img src="https://img.shields.io/badge/XSalsa20-00E5FF?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMwMEU1RkYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMwQjExMjAiIGZvbnQtc2l6ZT0iOSIgZm9udC13ZWlnaHQ9ImJvbGQiPigpfFwvPC90ZXh0Pjwvc3ZnPg==&logoColor=black">
      <br/>
      <b>Symmetric Cipher</b>
      <br/>
      <sub>XSalsa20 stream cipher + Poly1305 MAC.<br/>Authenticated encryption (sealed boxes).<br/>Same algorithm used by WhatsApp.</sub>
      <br/><br/>
    </td>
    <td align="center" width="33%">
      <br/>
      <img src="https://img.shields.io/badge/RLS-00E5FF?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMwMEU1RkYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMwQjExMjAiIGZvbnQtc2l6ZT0iOSIgZm9udC13ZWlnaHQ9ImJvbGQiPlJMUzwvdGV4dD48L3N2Zz4=&logoColor=black">
      <br/>
      <b>Row Level Security</b>
      <br/>
      <sub>Database-enforced access control.<br/>Users can only read their own chats,<br/>messages, and explicitly-shared Pulses.</sub>
      <br/><br/>
    </td>
  </tr>
</table>

<br/>

**Key security properties:**

- **🔑 Key generation** — Curve25519 keypairs created via `cryptoService.getOrCreateKeyPair()` on first login
- **💾 Key storage** — Private key persisted in `AsyncStorage` (`nimbusx_private_key:{uid}`), never transmitted over the network
- **🔐 Message encryption** — Each 1-to-1 message encrypted with an ECDH-derived shared secret before INSERT
- **🔄 Decryption** — Recipient computes the same shared secret and decrypts on receipt
- **🆔 Safety codes** — FNV-1a hash of concatenated public keys produces a 25-digit numeric code for out-of-band verification
- **🚪 State isolation** — `rootReducer` clears all Redux slices on `auth/logout` to prevent cross-account leakage
- **🛡️ Database RLS** — Supabase Row Level Security enforces data isolation at the query level; Pulse `shared_with` array restricts visibility to explicitly chosen recipients

<br/>

---

## ✦ Contributing

<br/>

<p align="center">
  <a href=".github/ISSUE_TEMPLATE/bug_report.md">
    <img src="https://img.shields.io/badge/Report_Bug-EF4444?style=for-the-badge&logo=bugcrowd&logoColor=white">
  </a>
  <a href=".github/ISSUE_TEMPLATE/feature_request.md">
    <img src="https://img.shields.io/badge/Request_Feature-8B5CF6?style=for-the-badge&logo=featurebase&logoColor=white">
  </a>
  <a href=".github/PULL_REQUEST_TEMPLATE.md">
    <img src="https://img.shields.io/badge/Open_PR-00E5FF?style=for-the-badge&logo=github&logoColor=black">
  </a>
</p>

<br/>

1. **Find or create an issue** — use the templates above
2. **Fork + branch** — `git checkout -b feat/my-change`
3. **Code** — follow existing patterns, keep it clean
4. **Verify** — `npm run lint && npx tsc --noEmit`
5. **PR** — open a pull request using the [template](.github/PULL_REQUEST_TEMPLATE.md)

All PRs must pass CI (ESLint + TypeScript checks) before review.

<br/>

---

## ✦ License

<br/>

<p align="center">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/Open_Source-MIT-06B6D4?style=for-the-badge&logo=open-source-initiative&logoColor=white">
  </a>
</p>

<p align="center">
  <sub>Built with ❤️ using React Native, Supabase, and tweetnacl</sub><br/>
  <sub>© 2026 NimbusX Labs · MIT Licensed</sub>
</p>

<br/>

<p align="center">
  <a href="https://github.com/NimbusX-labs/NimbusX-Mobile/stargazers">
    <img src="https://img.shields.io/github/stars/NimbusX-labs/NimbusX-Mobile?style=social">
  </a>
  &nbsp;
  <a href="https://github.com/NimbusX-labs/NimbusX-Mobile/forks">
    <img src="https://img.shields.io/github/forks/NimbusX-labs/NimbusX-Mobile?style=social">
  </a>
  &nbsp;
  <a href="https://github.com/NimbusX-labs/NimbusX-Mobile/issues">
    <img src="https://img.shields.io/github/issues/NimbusX-labs/NimbusX-Mobile?style=social">
  </a>
</p>
