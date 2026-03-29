# Elite eSports — Replit Project

---

## ⚠️ CRITICAL — READ BEFORE MAKING ANY CHANGES

### Supabase is the sole, permanent, and authoritative backend. This is non-negotiable.

**DO NOT:**
- Create, suggest, or scaffold any local database schema (no Drizzle tables, no Prisma models, no raw SQL `CREATE TABLE`)
- Use `lib/db/` for anything — it exists in the monorepo but is NOT used by the mobile app
- Use Replit's built-in PostgreSQL database for any app data
- Replace or wrap Supabase with any other auth system, ORM, or database
- Generate migration files targeting any database other than the live Supabase project
- Move Supabase queries to a backend API layer — the mobile app queries Supabase directly

**DO:**
- Query data via the `supabase` client from `@/services/supabase`
- Add new tables by writing SQL and running it in the **Supabase Dashboard → SQL Editor**
- Use `supabase.auth.*` for all authentication
- Use `supabase.from('table_name')` for all database reads and writes
- Use `supabase.storage` for all file uploads
- Use `supabase.channel()` for all real-time subscriptions
- Reference `supabase/migrations/` for the canonical schema — these files show what tables exist

### Why
This is a React Native / Expo mobile app. The Supabase project (`azxhcalksgudjemwjekd`) holds all production data, user accounts, RLS policies, real-time channels, and file storage. Rewriting or duplicating this infrastructure would destroy live user data and break all platform features.

---

## Overview
A professional React Native Expo mobile app (Android-first, web-previewed) for competitive eSports tournaments. Package: `com.elite.esports.android`, version 1.0.0 Alpha. Built with Expo Router v6, Supabase as the sole backend, and a fully modular feature-based architecture. All currencies in Indian Rupees (₹).

## Replit Environment Setup

The project runs on Replit with the Expo dev server via the `artifacts/elite-esports: expo` workflow. Package management has been fully migrated from pnpm to **npm** to resolve EAS build failures (`ERR_PNPM_NO_LOCKFILE`). A `package-lock.json` is committed at the workspace root for EAS builds.

### Environment Variables
Stored in Replit shared userenv and available at runtime. The app falls back to defaults in `supabase.config.ts` if these are not set:

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Full Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous/client API key |
| `EXPO_PUBLIC_SUPABASE_PROJECT_ID` | Supabase project ID |

> No service role key or secret key is stored in the app. Only the three public keys above are used.

## EAS Build Setup

`eas.json` is at the **workspace root** (required for monorepo EAS builds). Package management is **npm** — a `package-lock.json` is committed at the workspace root so EAS build servers detect npm automatically (no pnpm required on the build server).

`eas-build-pre-install.sh` (at workspace root and inside `artifacts/elite-esports/`) runs before EAS's install step. Both scripts use `npm install` (no pnpm activation). The one inside `artifacts/elite-esports/` does the real work — it resolves the monorepo root (two levels up) and runs `npm install --legacy-peer-deps`.

**Migration note:** The project was migrated from pnpm to npm because EAS builds repeatedly failed with `ERR_PNPM_NO_LOCKFILE`. The `packageManager` field was removed from root `package.json`, `pnpm-workspace.yaml` and `pnpm-lock.yaml` were deleted (including the one inside `artifacts/elite-esports/`), and `package-lock.json` was generated at the workspace root. The `artifacts/api-server` package was excluded from npm workspaces (esbuild version incompatibility). `.npmrc` uses `legacy-peer-deps=true` instead of pnpm-specific settings.

**Android Gradle SDK versions** are explicitly set in `app.json` (`compileSdkVersion: 35`, `targetSdkVersion: 35`, `minSdkVersion: 24`) to prevent the "A problem occurred evaluating project ':app'" Gradle error on EAS build servers.

**`expo-glass-effect` removed** from `package.json` — it was not used anywhere in the codebase, is iOS-only (`"platforms": ["apple"]`), and had an empty `"android": {}` in its `expo-module.config.json` that could trigger broken Android autolinking.

## Android Native Project (Bare Workflow)

The `android/` directory is **committed to the repo** (bare workflow). EAS detects this and skips `expo prebuild`, using the native files directly.

Key files:
- `android/build.gradle` — Root Gradle build file. Has an explicit `buildscript.ext` block with all SDK versions and `kotlinVersion = "2.0.21"`. This fixes `react-native-keyboard-controller`'s `build.gradle` which reads `rootProject.ext.kotlinVersion` during Gradle configuration. Without this, `kotlin_version` is `null` and Gradle fails with "A problem occurred evaluating project ':app'".
- `android/gradle.properties` — Has `KeyboardController_*` fallback properties (used if `rootProject.ext.*` isn't set) and `newArchEnabled=true`.
- `android/app/build.gradle` — App module Gradle file with namespace `com.elite.esports.android`, uses `rootProject.ext.*` for SDK versions.
- `android/settings.gradle` — Auto-linking setup via Expo + React Native Gradle Plugin.
- `android/app/src/main/java/com/elite/esports/android/` — `MainActivity.kt` and `MainApplication.kt`.

**Important:** If `app.json` plugins are updated (e.g., adding native modules), run `expo prebuild --platform android` to regenerate the `android/` directory, then commit the changes.


## Supabase Backend

**Project ID:** `azxhcalksgudjemwjekd`  
**URL:** `https://azxhcalksgudjemwjekd.supabase.co`

Supabase is the sole and permanent backend for all app data. The Replit PostgreSQL database is NOT used by the mobile app.

### Existing Tables (live in Supabase)
| Table | Purpose |
|---|---|
| `users` | User profiles — columns: `id, name, username, avatar_url, created_at, updated_at` |
| `admin_users` | Admin access list — columns: `user_id` |
| `matches` | Tournament matches — columns: `id, game_id, title, entry_fee, prize_pool, max_players, joined_players, status, room_id, room_password, live_stream_url, created_at` |
| `match_participants` | Who joined a match — columns: `id, match_id, user_id, joined_at` |
| `match_results` | Result per match — columns: `id, match_id, user_id, rank, kills, points` |
| `games` | Game titles — columns: `id, name, banner_url, status, created_at` |
| `wallets` | User wallet — columns: `user_id, balance, updated_at` |
| `wallet_transactions` | Ledger — columns: `id, user_id, type, amount, status, reference_id, created_at` |
| `payments` | Deposit proofs — columns: `id, user_id, amount, utr, screenshot_url, status, ai_status, created_at` |
| `withdrawals` | Withdrawal requests — columns: `id, user_id, amount, status, created_at` |
| `notifications` | In-app notifications — columns: `id, user_id, title, message, is_read, created_at` |
| `leaderboard` | Aggregate rankings — columns: `user_id, username, avatar_url, total_points, total_kills, matches_played` |
| `user_games` | User's game UIDs — columns: `id, user_id, game_id, uid` |
| `support_tickets` | Help tickets — columns: `id, user_id, message, status, created_at` |
| `reports` | User reports — columns: `id, user_id, description, related_match_id, created_at` |
| `ad_units` | Ad unit config — columns: `id, name, type, ad_unit_id, status` |
| `ad_triggers` | Ad event config — columns: `id, trigger, ad_unit_id, enabled, cooldown_seconds` |
| `ad_settings` | Global ad toggle — columns: `id, ads_enabled, default_cooldown` |
| `user_roles` | Role assignments — columns: `id, user_id, role` |
| `points_settings` | Kill/rank points values |
| `app_settings` | Min/max deposit & withdraw amounts |

### Tables Requiring Migration (run `supabase/migrations/002_missing_tables.sql` in Supabase SQL Editor)
| Table | Used By |
|---|---|
| `teams` | My Team screen — create/view team |
| `team_members` | My Team screen — member list with `users` join |
| `broadcasts` | Admin Broadcast screen (inserts into `notifications`) |

**IMPORTANT:** Run `supabase/migrations/002_missing_tables.sql` in Supabase Dashboard → SQL Editor before using the Teams or Admin Broadcast features.

### DB Column Mapping (key adaptations in `dbAdapters.ts`)
The app type `Match` uses friendly names; `adaptMatch()` maps DB columns:
- `matches.joined_players` → `match.players_joined`
- `matches.live_stream_url` → `match.stream_url`
- `matches.game_id` + `games.name` → `match.game`
- `games.banner_url` → `match.banner_url`
- `matches.created_at` (fallback) → `match.starts_at`

## Project Structure (Monorepo)
```
artifacts/
  elite-esports/       # Mobile app — @workspace/elite-esports
  api-server/          # Express API server — @workspace/api-server (not used by mobile app)
  mockup-sandbox/      # Vite canvas preview server — @workspace/mockup-sandbox
lib/
  db/                  # Drizzle ORM + Replit PostgreSQL (NOT used by mobile app)
supabase/
  migrations/
    001_games.sql      # Reference schema (informational)
    002_missing_tables.sql  # Run this in Supabase SQL Editor!
```

## Elite eSports Architecture

### Directory Layout
```
artifacts/elite-esports/
├── app/                          # Expo Router routes (routing only)
│   ├── _layout.tsx               # Root layout — providers, fonts, navigation
│   ├── index.tsx                 # Auth redirect (session check)
│   ├── (auth)/                   # Unauthenticated screens
│   │   ├── options.tsx           # Login / Sign Up choice
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                   # 5-tab navigation
│   │   ├── _layout.tsx           # Tab bar
│   │   ├── index.tsx             # Home — tournament list
│   │   ├── live.tsx              # Live matches
│   │   ├── leaderboard.tsx       # Rankings
│   │   ├── wallet.tsx            # Wallet & balance
│   │   └── profile.tsx           # User profile
│   ├── admin/                    # Admin-only screens
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Admin dashboard
│   │   ├── matches.tsx           # Create/manage matches
│   │   ├── users.tsx             # User management
│   │   ├── payments.tsx          # Payment approvals
│   │   ├── withdrawals.tsx       # Withdrawal approvals
│   │   ├── games.tsx             # Game management
│   │   ├── reports.tsx           # View reports
│   │   ├── support.tsx           # View support tickets
│   │   ├── monetization.tsx      # Ad settings
│   │   └── broadcast.tsx         # Send push notifications
│   ├── match/[id].tsx            # Match detail + join
│   ├── notifications.tsx
│   ├── settings.tsx
│   ├── edit-profile.tsx
│   ├── add-money.tsx
│   ├── withdraw.tsx
│   ├── transaction-history.tsx
│   ├── my-team.tsx               # Team management
│   └── support.tsx
│
└── src/                          # All source modules
    ├── components/               # Shared UI components
    ├── features/                 # Domain-specific modules
    │   ├── home/hooks/useMatches.ts
    │   ├── live/hooks/useLiveMatches.ts
    │   ├── leaderboard/hooks/useLeaderboard.ts
    │   ├── match/hooks/useMatchDetail.ts
    │   ├── match/hooks/useMyMatches.ts   # uses match_participants
    │   ├── profile/hooks/useProfile.ts   # users table (no updated_at issue)
    │   └── team/hooks/useMyTeam.ts       # uses teams + team_members + users
    ├── services/
    │   ├── supabase.ts           # Supabase client (SecureStore adapter)
    │   ├── dbAdapters.ts         # adaptMatch(), matchToDbPayload()
    │   └── NotificationService.ts  # Push permission, Android channels, token registration
    ├── store/
    │   ├── AuthContext.tsx        # Session, user, isAdmin (via admin_users)
    │   ├── WalletContext.tsx      # Balance, realtime subscription
    │   └── NotificationsContext.tsx
    └── utils/
        ├── colors.ts             # Design tokens
        └── types.ts              # Shared TypeScript interfaces
```

### Path Alias
`@/*` → `./src/*`

## Design System — Grok/YouTube Premium Level
- **Primary**: `#FE4C11` (orange-red) — used sparingly for CTAs and key accents
- **Background**: `#000000` true black (bg.dark), `#0F0F0F` cards (bg.card), `#161616` elevated (bg.elevated), `#1E1E1E` surface (bg.surface)
- **Borders**: `#272727` (border.default), `#141414` (border.subtle) — hairline only
- **Text**: `#FFFFFF` primary, `#9E9E9E` secondary, `#555555` muted
- **Font**: Inter (400, 500, 600, 700 weights via @expo-google-fonts/inter)
- **Theme**: Forced dark mode — OLED-friendly true black
- **Logo mark**: Solid orange square `#FE4C11` with white bolt icon — no border or dark bg
- **Tab bar**: 62px height, hairline top border, orange pill indicator (3px top bar) above active icon
- **Cards**: `borderRadius: 16`, hairline border, YouTube-quality gradient overlays on banners
- **Buttons**: `height: 48-54`, `borderRadius: 10-14`, no pill shape (except onboarding CTA)
- **Input fields**: `height: 54`, elevated bg `#161616`, orange border on focus

## EAS Build Profiles (`eas.json`)
| Profile | Type | Output | Use |
|---|---|---|---|
| `development` | internal | debug APK | Dev/testing with dev client |
| `preview` | internal | APK | Internal QA testing |
| `production` | store | **AAB** | Play Store submission (standard) |
| `production-apk` | internal | APK | Direct APK distribution |

## Key Tech Decisions
- Supabase Auth — email + password
- `expo-secure-store` → session persistence on native; localStorage adapter on web
- React Compiler enabled
- `adaptMatch()` / `matchToDbPayload()` bridge DB column names ↔ app type names
- `support_tickets` — category + subject are encoded into the `message` field as `[Category] Subject\n\nMessage`
- Admin check: `admin_users` table lookup on every auth state change

## Notification System
- **expo-notifications ~0.32.16** installed and configured
- **5 notification channels** on Android: Default, Match Alerts, Rewards, Tournaments, Account & Security — all HIGH importance
- **Permission requested at app startup** (`initNotifications()` in `_layout.tsx`)
- **Settings screen** shows real system permission status with "Open System Settings" link when blocked
- **Notification preference toggles** (All, Match, Reward, Tournament, Account) stored in AsyncStorage — disabled when system permission denied
- Push tokens registered via Expo push token system, stored in AsyncStorage

## Location Permission
- **expo-location ~19.0.8** installed with proper iOS `infoPlist` entries and Android permissions in `app.json`
- iOS: `NSLocationWhenInUseUsageDescription` and `NSLocationAlwaysAndWhenInUseUsageDescription`
- Android: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`

## Package Identity
- **Android package**: `com.elite.esports.android`
- **iOS bundle ID**: `com.elite.esports.ios`
- **App name**: Elite eSports
- **Version**: 1.0.0 (versionCode 1)

## Workflows
- `artifacts/elite-esports: expo` — Expo dev server (`@workspace/elite-esports`, port `$PORT`, default 8080)
