<!--
████████████████████████████████████████████████████████████████████████████████
██                                                                            ██
██         TERMS OF USE — READ BEFORE ANY ACTION IN THIS REPOSITORY          ██
██         Applies to ALL AI agents, developers, bots, and CI scripts        ██
██                                                                            ██
██  ┌─────────────────────────────────────────────────────────────────────┐  ██
██  │ RULE 1 · BACKEND: SUPABASE ONLY                                     │  ██
██  │   - No other backend, database service, or data layer is permitted  │  ██
██  │   - Use supabase client from @/services/supabase for ALL data       │  ██
██  │   - Schema changes go to Supabase Dashboard → SQL Editor ONLY       │  ██
██  ├─────────────────────────────────────────────────────────────────────┤  ██
██  │ RULE 2 · NO LOCAL DATABASE — ALL LOCAL/ALTERNATIVE DBs BANNED       │  ██
██  │   BANNED: Replit PostgreSQL, Replit Database (key-value),           │  ██
██  │           AI-created databases, Replit Agent databases,             │  ██
██  │           SQLite, Neon, PlanetScale, Turso, Drizzle ORM,            │  ██
██  │           Prisma, Firebase, or ANY non-Supabase database            │  ██
██  │   If Replit offers to create a DB → DECLINE. Do not use it.        │  ██
██  ├─────────────────────────────────────────────────────────────────────┤  ██
██  │ RULE 3 · NPM ONLY — pnpm IS PERMANENTLY AND COMPLETELY BANNED       │  ██
██  │   NEVER:  pnpm install / pnpm add / pnpm run / pnpm <anything>      │  ██
██  │   NEVER:  pnpm-lock.yaml / pnpm-workspace.yaml                      │  ██
██  │   ALWAYS: npm install --legacy-peer-deps / npm run / npm add        │  ██
██  ├─────────────────────────────────────────────────────────────────────┤  ██
██  │ RULE 4 · pnpm IS RESTRICTED                                         │  ██
██  │   pnpm is banned forever. Using it breaks the environment.          │  ██
██  │   All tooling, lock files, and scripts are configured for npm.      │  ██
██  └─────────────────────────────────────────────────────────────────────┘  ██
██                                                                            ██
██   These rules are NON-NEGOTIABLE. They override every framework default,  ██
██   every skill, every template, and every AI suggestion.                   ██
██   Full details in AGENTS.md — read it before doing anything.              ██
██                                                                            ██
████████████████████████████████████████████████████████████████████████████████
-->

# CRITICAL — READ BEFORE ANYTHING ELSE

## RULE #1 — BACKEND: SUPABASE ONLY

**Supabase is the sole, permanent, authoritative backend. No other backend is permitted — ever.**

**❌ NEVER DO:**
- Create any local/remote database schema outside Supabase
- Use `lib/db/`, Drizzle, Prisma, or any ORM for mobile app features
- Use Replit PostgreSQL, Neon, or any other database for app data
- Replace or wrap Supabase Auth with any other auth system
- Create Express routes or API routes to proxy Supabase
- Move Supabase queries from the mobile app into a server layer
- Run `drizzle-kit push` or any DDL outside the Supabase SQL Editor

**✅ ALWAYS DO:**
- Query via the `supabase` client from `@/services/supabase`
- Add tables via SQL in **Supabase Dashboard → SQL Editor** only
- Use `supabase.auth.*` for all authentication
- Use `supabase.from('table_name')` for all reads/writes
- Use `supabase.storage` for all file uploads
- Use `supabase.channel()` for all real-time subscriptions

> Enforced in `AGENTS.md` Rule 1. See that file for full details.

---

## RULE #2 — NO LOCAL DATABASE — ALL BANNED

**All local and alternative databases are permanently restricted.**

**❌ BANNED — NEVER USE:**
- **Replit Databases** — Replit PostgreSQL, Replit Database (key-value), any DB auto-created by Replit or Replit Agent
- **AI Databases** — any database suggested or created by an AI agent
- **Local Databases** — SQLite, LowDB, NeDB, better-sqlite3, PouchDB
- **Alternative Cloud DBs** — Neon, PlanetScale, Turso, CockroachDB, Firebase Firestore
- **ORMs / Schema Tools** — Drizzle ORM, Prisma, TypeORM, Sequelize, Knex (for any DB other than Supabase)

> If the Replit environment offers to create a database → **decline it. Do not use it.**
> Full details in `AGENTS.md` Rule 2.

---

## RULE #3 — npm ONLY — pnpm IS BANNED FOREVER

**npm is the only permitted package manager. pnpm is permanently banned.**

| What you want to do | Correct command |
|---|---|
| Install all dependencies | `npm install --legacy-peer-deps` |
| Install in `artifacts/elite-esports/` | `cd artifacts/elite-esports && npm install --legacy-peer-deps` |
| Add a new package | `npm add <package>` |
| Run a script | `npm run <script>` |
| Clean install (CI) | `npm ci` |

**❌ NEVER do any of these — ever:**
- `pnpm install` — BANNED
- `pnpm add` — BANNED
- `pnpm run` — BANNED
- `pnpm exec` — BANNED
- any `pnpm` command — BANNED
- create `pnpm-lock.yaml` — BANNED
- create `pnpm-workspace.yaml` — BANNED

---

## RULE #4 — pnpm IS RESTRICTED

pnpm is banned forever. Using it breaks the environment and has been flagged as a
repeated critical failure. All tooling, lock files, and scripts are configured for npm.

> Enforcement: `.npmrc` at project root • `AGENTS.md` Rule 3 • this file Rule #3 & #4

---

# Elite eSports — Replit Project

A professional React Native Expo mobile app (Android-first, web-previewed) for competitive eSports tournaments. Package: `com.elite.esports.android`, version 1.0.0 Alpha. Built with Expo Router v6, Supabase as the sole backend, and a fully modular feature-based architecture. All currencies in Indian Rupees (₹).

## Replit Environment Setup

The project runs on Replit with the Expo dev server via the `artifacts/elite-esports: expo` workflow. Package management uses **npm**. A `package-lock.json` is committed at the workspace root for EAS builds.

### Environment Variables
Stored in Replit shared userenv and available at runtime:

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Full Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous/client API key |
| `EXPO_PUBLIC_SUPABASE_PROJECT_ID` | Supabase project ID |

## EAS Build Setup

`eas.json` is at the **workspace root** (required for monorepo EAS builds). Package management is **npm** — a `package-lock.json` is committed at the workspace root so EAS build servers detect npm automatically.

`eas-build-pre-install.sh` (at workspace root and inside `artifacts/elite-esports/`) runs before EAS's install step. Both scripts use `npm install`. The one inside `artifacts/elite-esports/` does the real work — it resolves the monorepo root (two levels up) and runs `npm install --legacy-peer-deps`.

**Notes:** The `artifacts/api-server` package is excluded from npm workspaces (esbuild version incompatibility). `.npmrc` uses `legacy-peer-deps=true`.

**Android Gradle SDK versions** are explicitly set in `app.json` (`compileSdkVersion: 35`, `targetSdkVersion: 35`, `minSdkVersion: 24`).

## Android Native Project (Bare Workflow)

The `android/` directory is **committed to the repo** (bare workflow). EAS detects this and skips `expo prebuild`, using the native files directly.

Key files:
- `android/build.gradle` — Root Gradle build file with `kotlinVersion = "2.0.21"`
- `android/gradle.properties` — `KeyboardController_*` fallback properties, `newArchEnabled=true`
- `android/app/build.gradle` — namespace `com.elite.esports.android`
- `android/settings.gradle` — Auto-linking via Expo + React Native Gradle Plugin

## Supabase Backend

**Project ID:** `azxhcalksgudjemwjekd`
**URL:** `https://azxhcalksgudjemwjekd.supabase.co`

### Existing Tables (live in Supabase)
| Table | Purpose |
|---|---|
| `users` | User profiles — `id, name, username, avatar_url, created_at, updated_at` |
| `admin_users` | Admin access list — `user_id` |
| `matches` | Tournament matches — `id, game_id, title, entry_fee, prize_pool, max_players, joined_players, status, room_id, room_password, live_stream_url, created_at` |
| `match_participants` | Who joined a match — `id, match_id, user_id, joined_at` |
| `match_results` | Result per match — `id, match_id, user_id, rank, kills, points` |
| `games` | Game titles — `id, name, banner_url, status, created_at` |
| `wallets` | User wallet — `user_id, balance, updated_at` |
| `wallet_transactions` | Ledger — `id, user_id, type, amount, status, reference_id, created_at` |
| `payments` | Deposit proofs — `id, user_id, amount, utr, screenshot_url, status, ai_status, created_at` |
| `withdrawals` | Withdrawal requests — `id, user_id, amount, status, created_at` |
| `notifications` | In-app notifications — `id, user_id, title, message, is_read, created_at` |
| `leaderboard` | Aggregate rankings — `user_id, username, avatar_url, total_points, total_kills, matches_played` |
| `user_games` | User's game UIDs — `id, user_id, game_id, uid` |
| `support_tickets` | Help tickets — `id, user_id, message, status, created_at` |
| `reports` | User reports — `id, user_id, description, related_match_id, created_at` |
| `ad_units` | Ad unit config — `id, name, type, ad_unit_id, status` |
| `ad_triggers` | Ad event config — `id, trigger, ad_unit_id, enabled, cooldown_seconds` |
| `ad_settings` | Global ad toggle — `id, ads_enabled, default_cooldown` |
| `user_roles` | Role assignments — `id, user_id, role` |
| `points_settings` | Kill/rank points values |
| `app_settings` | Min/max deposit & withdraw amounts |
| `teams` | Teams — `id, name, tag, game, created_by, created_at` |
| `team_members` | Team membership — `id, team_id, user_id, role, joined_at` |

### DB Column Mapping (`dbAdapters.ts`)
- `matches.joined_players` → `match.players_joined`
- `matches.live_stream_url` → `match.stream_url`
- `matches.game_id` + `games.name` → `match.game`
- `games.banner_url` → `match.banner_url`
- `matches.created_at` (fallback) → `match.starts_at`

## Project Structure (Monorepo)
```
artifacts/
  elite-esports/       # Mobile app — @workspace/elite-esports
  api-server/          # Express API server (NOT used by mobile app)
  mockup-sandbox/      # Vite canvas preview server
lib/
  db/                  # Drizzle ORM + Replit PostgreSQL (NOT used by mobile app)
supabase/
  migrations/
    001_games.sql      # Reference schema (informational)
    002_missing_tables.sql  # Run this in Supabase SQL Editor!
```

## Elite eSports App Architecture

### Directory Layout
```
artifacts/elite-esports/
├── app/                          # Expo Router routes
│   ├── _layout.tsx               # Root layout — providers, fonts, navigation
│   ├── index.tsx                 # Auth redirect
│   ├── (auth)/                   # Login / Sign Up screens
│   ├── (tabs)/                   # 5-tab navigation (Home, Live, Leaderboard, Wallet, Profile)
│   ├── admin/                    # Admin-only screens
│   ├── match/[id].tsx            # Match detail + join
│   ├── notification/[id].tsx     # Notification detail (full message view)
│   ├── notifications.tsx
│   ├── settings.tsx
│   ├── edit-profile.tsx
│   ├── add-money.tsx
│   ├── withdraw.tsx
│   ├── transaction-history.tsx
│   ├── my-team.tsx
│   └── support.tsx
│
└── src/                          # All source modules
    ├── components/               # Shared UI components
    ├── features/                 # Domain hooks per feature
    ├── services/
    │   ├── supabase.ts           # Supabase client (SecureStore adapter)
    │   ├── dbAdapters.ts         # adaptMatch(), matchToDbPayload()
    │   └── NotificationService.ts
    ├── store/
    │   ├── AuthContext.tsx        # Session, user, isAdmin
    │   ├── WalletContext.tsx      # Balance, realtime
    │   └── NotificationsContext.tsx
    └── utils/
        ├── colors.ts             # Design tokens
        └── types.ts              # Shared TypeScript interfaces
```

### Path Alias
`@/*` → `./src/*`

## Design System
- **Primary color**: `#FE4C11` (orange-red)
- **Background**: `#0A0A0A` (near-black)
- **Font**: Inter (400, 500, 600, 700 via @expo-google-fonts/inter)
- **Theme**: Forced dark mode

## EAS Build Profiles
| Profile | Type | Output | Use |
|---|---|---|---|
| `development` | internal | debug APK | Dev/testing with dev client |
| `preview` | internal | APK | Internal QA testing |
| `production` | store | AAB | Play Store submission |
| `production-apk` | internal | APK | Direct APK distribution |

## Key Tech Decisions
- Supabase Auth — email + password
- `expo-secure-store` → session persistence on native; localStorage adapter on web
- React Compiler enabled
- `adaptMatch()` / `matchToDbPayload()` bridge DB column names ↔ app type names
- Admin check: `admin_users` table lookup on every auth state change

## Notification System
- `expo-notifications ~0.32.16` installed and configured
- 5 Android channels: Default, Match Alerts, Rewards, Tournaments, Account & Security — all HIGH importance
- Permission requested at app startup (`initNotifications()` in `_layout.tsx`)
- Notification detail screen at `app/notification/[id].tsx` — shows full title, message, timestamp, type

## Package Identity
- **Android package**: `com.elite.esports.android`
- **iOS bundle ID**: `com.elite.esports.ios`
- **App name**: Elite eSports
- **Version**: 1.0.0 (versionCode 1)

## Workflows
- `artifacts/elite-esports: expo` — Expo dev server (port `$PORT`, default 8080)
