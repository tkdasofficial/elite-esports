# SYSTEM_MAP — Elite eSports Mobile App
> Generated: 2026-03-30 | Role: System Architect | Purpose: External AI Sync & Web Admin Compatibility

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Navigation Flow](#3-navigation-flow)
4. [Data Flow — Supabase Integration](#4-data-flow--supabase-integration)
5. [Database Schema & RLS Policies](#5-database-schema--rls-policies)
6. [Context Providers & Global State](#6-context-providers--global-state)
7. [Local State (Not Persisted to DB)](#7-local-state-not-persisted-to-db)
8. [Auth Logic](#8-auth-logic)
9. [Realtime Subscriptions](#9-realtime-subscriptions)
10. [Admin Panel](#10-admin-panel)
11. [Instructions for Web Admin AI (Lovable)](#11-instructions-for-web-admin-ai-lovable)

---

## 1. Project Overview

**App Name:** Elite eSports  
**Platform:** React Native (Expo) — iOS, Android, Web  
**Purpose:** Mobile gaming tournament platform for India. Users join paid/free matches, track their leaderboard rank, manage a wallet, and withdraw winnings to UPI/bank.  
**Supabase Project ID:** `azxhcalksgudjemwjekd`  
**Supabase URL:** `https://azxhcalksgudjemwjekd.supabase.co`

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54 + Expo Router v6 (file-based routing) |
| Language | TypeScript |
| UI | React Native + StyleSheet (no UI library) |
| Icons | `@expo/vector-icons` — Ionicons + Feather |
| Animation | `react-native-reanimated` v4 + native Animated API |
| Haptics | `expo-haptics` |
| Gradients | `expo-linear-gradient` |
| Backend | Supabase (Auth + PostgreSQL + Realtime + Storage) |
| Auth Storage | `expo-secure-store` (native) / `localStorage` (web) |
| Server State | `@tanstack/react-query` (matches, games, leaderboard) |
| Local Persistence | `@react-native-async-storage/async-storage` |
| Navigation | Expo Router Native Stack |
| Charts (Admin) | `react-native-svg` (custom sparklines, bar charts, area charts) |
| Lists | `@shopify/flash-list` |

---

## 3. Navigation Flow

### 3.1 Root Stack (`app/_layout.tsx`)
```
RootStack (headerShown: false)
├── /onboarding          ← OnboardingStack (nested)
├── /(auth)              ← AuthStack (grouped, no URL segment)
├── /(tabs)              ← TabNavigator (grouped, no URL segment)
├── /notifications
├── /settings
├── /edit-profile
├── /tournament/[id]
├── /match/[id]
├── /add-money
├── /withdraw
├── /transaction-history
├── /support
├── /my-matches
├── /my-team
├── /terms
├── /privacy
├── /about
└── /admin               ← AdminStack (gestureEnabled: false)
```

### 3.2 Onboarding Stack (`app/onboarding/_layout.tsx`)
```
Stack (animation: slide_from_right, gestureEnabled: false)
├── /onboarding/Play      ← Page 1 — JOIN THE BATTLE
├── /onboarding/Win       ← Page 2 — DOMINATE THE RANKS
└── /onboarding/Withdraw  ← Page 3 — INSTANT REWARDS
```

**Onboarding Flow:**
```
app/index.tsx
  → AsyncStorage.getItem('onboarding_seen')
      → null/false  →  /onboarding/Play
                           ↓ NEXT (router.push)
                       /onboarding/Win
                           ↓ NEXT (router.push)
                       /onboarding/Withdraw
                           ↓ GET STARTED
                           AsyncStorage.setItem('onboarding_seen', 'true')
                           router.replace('/(auth)/options')
      → true + no session  →  /(auth)/options
      → true + session      →  /(tabs)
      → true + admin        →  /admin
```

### 3.3 Auth Stack (`app/(auth)/_layout.tsx`)
```
/(auth)/options     ← Landing: Social OAuth buttons + Email option
/(auth)/email-auth  ← Unified email entry (switches to login or signup)
/(auth)/login       ← Email + Password sign-in
/(auth)/signup      ← Email + Password registration
```

### 3.4 Tab Navigator (`app/(tabs)/_layout.tsx`)
```
Tabs (custom BlurView tab bar, Feather icons, haptic feedback)
├── (tabs)/index        ← Home — upcoming/ongoing matches
├── (tabs)/live         ← Live — ongoing matches with stream links
├── (tabs)/leaderboard  ← Ranks — points + kills leaderboard
├── (tabs)/wallet       ← Wallet — balance, add money, withdraw
└── (tabs)/profile      ← Profile — user info, game UIDs, avatar
```

### 3.5 Admin Stack (`app/admin/_layout.tsx`)
```
/admin              ← Dashboard (stats, charts, activity feed)
/admin/matches      ← Match CRUD
/admin/games        ← Game CRUD + banner upload
/admin/users        ← User list + balance edit
/admin/payments     ← Approve/reject deposits
/admin/withdrawals  ← Approve/reject withdrawals
/admin/support      ← Support ticket management
/admin/reports      ← Player reports
/admin/broadcast    ← Push notification sender
/admin/monetization ← AdMob settings (units, triggers, on/off)
```

---

## 4. Data Flow — Supabase Integration

### 4.1 Client Initialization
**File:** `src/services/supabase.ts`

```
supabase = createClient(url, anonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,  // SecureStore on native, localStorage on web
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
})
```

### 4.2 How the App Reads Data

| Screen / Hook | Tables Queried | Method |
|---|---|---|
| `useProfile` | `users`, `wallets`, `admin_users`, `user_games + games` | `Promise.all` parallel fetch |
| `WalletContext` | `wallets`, `payments`, `withdrawals`, `wallet_transactions` | `Promise.all` + Realtime |
| `NotificationsContext` | `notifications` | fetch + Realtime |
| `useMatches` | `matches` (joined with `games`) | React Query |
| `useMatchDetail` | `matches + games`, `match_participants` | fetch + Realtime channel |
| `useLeaderboard` | `leaderboard` (VIEW) | React Query |
| `useGames` | `games` | React Query |
| `useMyMatches` | `match_participants`, `matches` | fetch |
| `useMyTeam` | `teams`, `team_members` | fetch |
| Admin Dashboard | `users`, `matches`, `payments`, `withdrawals` | parallel fetch |

### 4.3 How the App Writes Data

| Action | Table Written | Method |
|---|---|---|
| Sign up / create profile | `auth.users` → trigger creates `users` row | Supabase Auth trigger |
| Update profile | `users` (upsert), `user_games` (delete + re-insert) | `useProfile.save()` |
| Join match | `match_participants` (insert), `matches` (update joined_players) | `useMatchDetail.joinMatch()` |
| Deposit money | `payments` (insert) | `add-money.tsx` |
| Withdraw money | `withdrawals` (insert) | `withdraw.tsx` |
| Submit support ticket | `support_tickets` (insert) | `support.tsx` |
| Submit report | `reports` (insert) | in-app form |
| Mark notification read | `notifications` (update is_read) | `NotificationsContext.markAsRead()` |
| Create/update team | `teams`, `team_members` | `my-team.tsx` |
| Admin: approve payment | `payments` (update status), `wallets` (update balance) | `admin/payments.tsx` |
| Admin: create match | `matches` (insert) | `admin/matches.tsx` |

---

## 5. Database Schema & RLS Policies

### Core Tables

#### `users`
```sql
id         UUID  PK  → auth.users.id
name       TEXT
username   TEXT  UNIQUE
avatar_url TEXT        (stores numeric index as string "0"-"9")
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```
**RLS:** SELECT public | INSERT own (auth.uid = id) | UPDATE own

---

#### `admin_users`
```sql
user_id UUID PK → auth.users.id
```
**RLS:** SELECT public | All ops: admin only  
**Usage:** Single allow-list. App checks `SELECT user_id FROM admin_users WHERE user_id = auth.uid()`. Non-empty result = admin.

---

#### `wallets`
```sql
user_id    UUID  PK  → auth.users.id
balance    NUMERIC    DEFAULT 0, CHECK >= 0
updated_at TIMESTAMPTZ
```
**RLS:** SELECT own | Admin full access  
**Note:** Balance is never decremented directly by the client. Admin approves payments to credit it.

---

#### `wallet_transactions`
```sql
id           UUID  PK
user_id      UUID  → auth.users.id
type         TEXT  CHECK (credit | debit)
amount       NUMERIC
status       TEXT  CHECK (pending | approved | rejected)
reference_id TEXT
created_at   TIMESTAMPTZ
```
**RLS:** SELECT own | Admin full access  
**Usage:** Entry fee deductions and prize credits after match results.

---

#### `payments` (Deposits)
```sql
id             UUID  PK
user_id        UUID  → auth.users.id
amount         NUMERIC
utr            TEXT          (UPI Transaction Reference)
screenshot_url TEXT
status         TEXT  CHECK (pending | approved | rejected)
ai_status      TEXT          (reserved for AI-verification)
created_at     TIMESTAMPTZ
```
**RLS:** SELECT own | INSERT own | Admin full access

---

#### `withdrawals`
```sql
id         UUID  PK
user_id    UUID  → auth.users.id
amount     NUMERIC
status     TEXT  CHECK (pending | approved | rejected)
created_at TIMESTAMPTZ
```
**RLS:** SELECT own | INSERT own | Admin full access

---

#### `games`
```sql
id         UUID  PK
name       TEXT  UNIQUE
banner_url TEXT
status     TEXT  DEFAULT 'active'
created_at TIMESTAMPTZ
```
**RLS:** SELECT public | Admin full access

---

#### `matches`
```sql
id              UUID  PK
game_id         UUID  → games.id
title           TEXT
entry_fee       NUMERIC  DEFAULT 0
prize_pool      NUMERIC  DEFAULT 0
max_players     INTEGER  DEFAULT 100
joined_players  INTEGER  DEFAULT 0
status          TEXT  CHECK (upcoming | ongoing | completed | cancelled)
room_id         TEXT      (revealed only to joined players)
room_password   TEXT      (revealed only to joined players)
live_stream_url TEXT
created_at      TIMESTAMPTZ
```
**RLS:** SELECT public | Admin full access  
**Note:** `room_id` and `room_password` are stored in plaintext. Access is controlled by RLS on `match_participants`.

---

#### `match_participants`
```sql
id        UUID  PK
match_id  UUID  → matches.id
user_id   UUID  → auth.users.id
joined_at TIMESTAMPTZ
UNIQUE(match_id, user_id)
```
**RLS:** SELECT authenticated users | INSERT own | Admin full access

---

#### `match_results`
```sql
id       UUID  PK
match_id UUID  → matches.id
user_id  UUID  → auth.users.id
rank     INTEGER  DEFAULT 0
kills    INTEGER  DEFAULT 0
points   INTEGER  DEFAULT 0
UNIQUE(match_id, user_id)
```
**RLS:** SELECT public | Admin full access

---

#### `notifications`
```sql
id         UUID  PK
user_id    UUID  → auth.users.id
title      TEXT
message    TEXT
is_read    BOOLEAN  DEFAULT false
created_at TIMESTAMPTZ
```
**RLS:** SELECT own | UPDATE own (mark read) | Admin full access  
**Realtime:** Yes — app subscribes via Supabase channel.

---

#### `user_games`
```sql
id      UUID  PK
user_id UUID  → auth.users.id
game_id UUID  → games.id
uid     TEXT      (in-game UID string)
UNIQUE(user_id, game_id)
```
**RLS:** SELECT public | INSERT/UPDATE/DELETE own

---

#### `support_tickets`
```sql
id         UUID  PK
user_id    UUID  → auth.users.id
message    TEXT      (format: "[Category] Subject\n\nBody")
status     TEXT  CHECK (open | in_progress | resolved)
created_at TIMESTAMPTZ
```
**RLS:** SELECT own | INSERT own | Admin full access

---

#### `reports`
```sql
id               UUID  PK
user_id          UUID  → auth.users.id
description      TEXT
related_match_id UUID  → matches.id (nullable)
created_at       TIMESTAMPTZ
```
**RLS:** SELECT own | INSERT own | Admin full access

---

#### `teams` & `team_members`
```sql
-- teams
id, name, tag (≤5 chars), game TEXT, created_by UUID

-- team_members
id, team_id, user_id, role CHECK (captain | member), joined_at
```
**RLS:** SELECT public | INSERT own | UPDATE captain only | Admin full access

---

#### `app_settings` (Single row)
```sql
min_deposit  NUMERIC  DEFAULT 10
max_deposit  NUMERIC  DEFAULT 50000
min_withdraw NUMERIC  DEFAULT 50
max_withdraw NUMERIC  DEFAULT 50000
```
**RLS:** SELECT public | Admin full access

---

#### `points_settings` (Single row)
```sql
kill_points           INTEGER  DEFAULT 1
rank_1_points         INTEGER  DEFAULT 50
rank_2_points         INTEGER  DEFAULT 35
rank_3_points         INTEGER  DEFAULT 25
rank_4_points         INTEGER  DEFAULT 20
rank_5_points         INTEGER  DEFAULT 15
rank_6_to_10_points   INTEGER  DEFAULT 10
```
**RLS:** SELECT public | Admin full access

---

#### `ad_units`, `ad_triggers`, `ad_settings`
```sql
-- ad_units: name, type (interstitial|rewarded|app_open), ad_unit_id, status
-- ad_triggers: trigger TEXT, ad_unit_id, enabled, cooldown_seconds
-- ad_settings: ads_enabled BOOLEAN, default_cooldown INTEGER
```
**RLS:** SELECT public (for app to read ad config) | Admin full access

---

#### VIEW: `leaderboard`
```sql
SELECT
  u.id AS user_id, u.username, u.avatar_url,
  SUM(mr.points)       AS total_points,
  SUM(mr.kills)        AS total_kills,
  COUNT(DISTINCT mr.match_id) AS matches_played
FROM users u
LEFT JOIN match_results mr ON mr.user_id = u.id
GROUP BY u.id, u.username, u.avatar_url
```
**Note:** This is a VIEW. RLS is enforced on underlying tables, not on the view itself.

---

#### Realtime Publication Tables
```
supabase_realtime publication includes:
  matches, notifications, wallets, wallet_transactions
```

---

## 6. Context Providers & Global State

All providers are wrapped in `app/_layout.tsx` in this order:
```
SafeAreaProvider
  StatusBar (light)
  ErrorBoundary
    QueryClientProvider (React Query, staleTime: 30s, retry: 2)
      ThemeProvider
        AuthProvider
          ProfileProvider
            NotificationsProvider
              WalletProvider
                GestureHandlerRootView
                  KeyboardProvider
                    RootLayoutNav
```

| Context | File | State Shape | Source |
|---|---|---|---|
| `AuthContext` | `store/AuthContext.tsx` | `session, user, loading, isAdmin, adminLoading, signOut` | Supabase Auth |
| `ProfileContext` | `store/ProfileContext.tsx` | `profile, loading, fetchError, save(), refresh()` | `users`, `wallets`, `user_games` tables |
| `WalletContext` | `store/WalletContext.tsx` | `balance, transactions[], loading, refreshWallet()` | `wallets`, `payments`, `withdrawals`, `wallet_transactions` |
| `NotificationsContext` | `store/NotificationsContext.tsx` | `notifications[], unreadCount, markAsRead(), markAllAsRead()` | `notifications` table + Realtime |
| `ThemeContext` | `store/ThemeContext.tsx` | `theme (dark/light), isDark, toggleTheme(), colors` | AsyncStorage |
| `AdminSidebarContext` | `store/AdminSidebarContext.tsx` | `isOpen, toggle()` | UI only (no persistence) |

---

## 7. Local State (Not Persisted to DB)

The following state variables exist **only in memory or AsyncStorage** and are **not stored in Supabase**:

| Variable | Location | Type | Purpose |
|---|---|---|---|
| `onboarding_seen` | AsyncStorage (`app/index.tsx`) | `'true'` / null | Whether user has completed onboarding |
| `theme` | AsyncStorage (`ThemeContext`) | `'dark'` / `'light'` | User's theme preference |
| `isOpen` (sidebar) | `AdminSidebarContext` | boolean | Admin sidebar open/close state |
| `loadingProvider` | `(auth)/options.tsx` | `Provider \| null` | Which social auth button is loading |
| `email`, `password` | `(auth)/login.tsx`, `signup.tsx` | string | Form field values (never sent to DB) |
| `joining` | `useMatchDetail.ts` | boolean | Whether a join-match request is in-flight |
| `step`, `dir` | — (removed, now native routing) | — | Was used by old orchestrator (deleted) |
| Chart noise points | `admin/index.tsx` (AreaChart) | number[] | Random simulated trend data (not from DB) |
| `stats`, `matchCounts`, `recentMatches`, `activity` | `admin/index.tsx` | local component state | Fetched per-render, not in a global context |

---

## 8. Auth Logic

### 8.1 Session Management
- **Storage:** `expo-secure-store` on native (encrypted keychain), `localStorage` on web.
- **Auto-refresh:** Supabase client handles token refresh automatically.
- **Persistence:** `persistSession: true` — survives app restarts.
- **State:** `AuthContext` listens to `supabase.auth.onAuthStateChange`. On `SIGNED_OUT`, redirects to `/(auth)/options`.

### 8.2 Email / Password Auth (Implemented)
**Sign In:** `supabase.auth.signInWithPassword({ email, password })`  
**Sign Up:** `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`  
After sign-in, app checks `admin_users` table and routes to `/admin` or `/(tabs)`.

**Error handling (login.tsx):**
- `invalid login credentials` → "Incorrect email or password"
- `email not confirmed` → "Please verify your email"

### 8.3 Social OAuth (Implemented — Google, GitHub, Facebook)
**Flow (PKCE):**
```
1. supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } })
2. expo-web-browser.openAuthSessionAsync(oauthUrl, redirectUrl)
3. supabase.auth.exchangeCodeForSession(result.url)
4. router.replace('/(tabs)')
```
**File:** `app/(auth)/options.tsx`  
**Note:** `WebBrowser.maybeCompleteAuthSession()` is called at module level.

### 8.4 Admin Detection
```
supabase.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle()
→ data !== null  →  isAdmin = true  →  redirect to /admin
```
Admin access is checked in:
- `AuthContext` (on session change)
- `app/index.tsx` (on first load)
- `app/(tabs)/_layout.tsx` (guard redirect)
- `app/(auth)/login.tsx` (post login redirect)

### 8.5 Planned / Not Yet Implemented
- Password reset flow (no screen exists)
- Phone number / OTP auth
- Biometric re-auth for withdrawals

---

## 9. Realtime Subscriptions

| Context | Channel Name | Table | Events | Trigger |
|---|---|---|---|---|
| `WalletContext` | `wallet-{userId}` | `wallets` | `*` | Re-fetches entire wallet state |
| `NotificationsContext` | `notifications-{userId}` | `notifications` | `*` | Re-fetches notification list |
| `useMatchDetail` | `match-{matchId}` | `matches` | `UPDATE` | Updates single match in state |

All channels are cleaned up via `supabase.removeChannel()` in `useEffect` cleanup.

---

## 10. Admin Panel

**Access Guard:** `isAdmin` from `admin_users` table. Non-admins are redirected away from `/admin/*`.

### Admin Screens & Their DB Operations

| Screen | Read | Write |
|---|---|---|
| `admin/index` | users(count), matches(all+status), payments(amounts), withdrawals(pending count), activity feed | None (read-only dashboard) |
| `admin/matches` | matches + games | INSERT, UPDATE, DELETE matches |
| `admin/games` | games | INSERT, UPDATE, DELETE games + Storage upload (game-banners bucket) |
| `admin/users` | users + wallets | UPDATE wallet balance (manual credit/debit) |
| `admin/payments` | payments + users | UPDATE payment status → triggers wallet credit |
| `admin/withdrawals` | withdrawals + users | UPDATE withdrawal status |
| `admin/support` | support_tickets + users | UPDATE ticket status |
| `admin/reports` | reports + users + matches | UPDATE report status |
| `admin/broadcast` | — | INSERT notifications (broadcast to all users) |
| `admin/monetization` | ad_units, ad_triggers, ad_settings, points_settings, app_settings | UPDATE all ad/points/limits config |

### Storage
- **Bucket:** `game-banners` (public read)
- **Write Policy:** Admin only
- **Used by:** `admin/games.tsx` for game banner images

---

## 11. Instructions for Web Admin AI (Lovable)

> **Copy and paste this entire section into your Lovable project prompt.**

---

### Context
You are building a **Web Admin Dashboard** for a mobile gaming app called **Elite eSports**. The mobile app is built with React Native + Expo. The web admin panel connects to the **same Supabase project** — do NOT create a new Supabase project.

**Supabase Project URL:** `https://azxhcalksgudjemwjekd.supabase.co`  
**Supabase Anon Key:** (use the same key as the mobile app — ask the user to provide it from their `.env`)

---

### Admin Identity
An admin is a user whose `id` exists in the `public.admin_users` table:
```sql
SELECT user_id FROM public.admin_users WHERE user_id = auth.uid()
```
Always check this before allowing access to any admin route. Do not use a separate admin role system.

---

### Tables You Can Read and Write

The following tables are accessible to admins with full CRUD rights (all policies use `EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())`):

| Table | Purpose |
|---|---|
| `users` | Registered players — name, username, avatar_url |
| `admin_users` | Admin allow-list |
| `wallets` | User balances |
| `wallet_transactions` | Credit/debit ledger |
| `payments` | Deposit requests (pending → approved/rejected) |
| `withdrawals` | Withdrawal requests (pending → approved/rejected) |
| `matches` | Tournaments — CRUD |
| `games` | Game titles — CRUD |
| `match_participants` | Which players joined which match |
| `match_results` | Per-player results (rank, kills, points) |
| `notifications` | Send notifications to specific users or broadcast |
| `support_tickets` | User help requests |
| `reports` | In-match player reports |
| `teams` / `team_members` | Team data |
| `app_settings` | Deposit/withdrawal limits (single row) |
| `points_settings` | Kill and rank point values (single row) |
| `ad_units` / `ad_triggers` / `ad_settings` | AdMob configuration |

**Read-only view:**
- `leaderboard` — aggregated points/kills per user

---

### Key Business Logic to Implement

#### Approving a Deposit (payments table)
```sql
-- 1. Update payment status
UPDATE public.payments SET status = 'approved' WHERE id = :paymentId;

-- 2. Credit the user's wallet
UPDATE public.wallets SET balance = balance + :amount, updated_at = NOW()
WHERE user_id = :userId;

-- 3. Insert a wallet transaction record
INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
VALUES (:userId, 'credit', :amount, 'approved', :paymentId);
```

#### Approving a Withdrawal
```sql
-- 1. Update withdrawal status
UPDATE public.withdrawals SET status = 'approved' WHERE id = :withdrawalId;

-- 2. Deduct from wallet (check balance >= amount first)
UPDATE public.wallets SET balance = balance - :amount, updated_at = NOW()
WHERE user_id = :userId AND balance >= :amount;
```

#### Broadcasting a Notification
```sql
-- Insert one row per user
INSERT INTO public.notifications (user_id, title, message)
SELECT id, :title, :message FROM public.users;
```

---

### Important Field Notes

- `matches.joined_players` — This is an integer counter (NOT a count query). Update it manually when adding/removing participants.
- `matches.game_id` — Foreign key to `games.id`. When creating a match, select from the `games` table.
- `matches.live_stream_url` — The field is named `live_stream_url` in the DB, but the mobile app uses `stream_url` in TypeScript. Always use `live_stream_url` in SQL.
- `users.avatar_url` — Stores a numeric index as a string (e.g. `"3"`), NOT a URL. Do not treat it as an image URL.
- `support_tickets.message` — Format is `"[Category] Subject\n\nBody"` (the mobile app encodes category and subject into a single text field).

---

### Match Status Values
```
upcoming   → Tournament not started yet (show room details to joined players only)
ongoing    → Tournament in progress (live stream link active)
completed  → Tournament finished (results uploaded, prizes distributed)
cancelled  → Tournament cancelled (refund entry fees)
```

---

### Do NOT Do These Things
- Do NOT create a separate `profiles` table — user data is in `public.users`.
- Do NOT create a separate `roles` table for admin — use `public.admin_users`.
- Do NOT modify the `leaderboard` view — it is auto-calculated from `match_results`.
- Do NOT hardcode Supabase credentials in UI components — use environment variables.
- Do NOT allow balance to go below zero — always check `balance >= amount` before deducting.
- Do NOT delete users — only update their status/balance.

---

### Recommended Admin Panel Pages

1. **Dashboard** — Total users, total revenue (sum of approved payments), active matches, pending items count
2. **Matches** — List, create, edit, delete. Filter by status. Show joined_players/max_players ratio.
3. **Games** — List, create, edit with banner image upload to `game-banners` storage bucket.
4. **Users** — List users with balance. Ability to manual credit/debit wallet.
5. **Payments** — List pending deposits. Approve or reject with one click.
6. **Withdrawals** — List pending withdrawals. Approve or reject.
7. **Match Results** — Upload kill/rank results per match. Auto-calculate points using `points_settings`.
8. **Support** — View and resolve support tickets.
9. **Reports** — View player reports with match context.
10. **Broadcast** — Send a notification to all users or a specific user.
11. **Settings** — Edit `app_settings` (deposit/withdrawal limits) and `points_settings`.
12. **Monetization** — Toggle ads on/off, manage ad units and triggers.

---

---

## Native Cloud Messaging (NCM) Module

### Overview
A custom push-notification system built on top of Supabase Realtime and `expo-background-fetch`.
Guarantees delivery even when battery-saver mode kills background network connections.

### New Permissions (Android)
| Permission | Purpose |
|---|---|
| `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` | Already present — match geo features |
| `POST_NOTIFICATIONS` | Already present — system notifications |
| `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` | NEW — request app be exempted from battery-save killing |
| `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_DATA_SYNC` | NEW — background data processing |

### New Supabase Tables

#### `device_registrations`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | auto |
| `user_id` | UUID FK → auth.users | |
| `duid` | TEXT UNIQUE | Device Unique ID, generated on first launch, stored in SecureStore |
| `platform` | TEXT | 'android' \| 'ios' |
| `os_version` | TEXT | |
| `push_token` | TEXT | FCM/APNs token |
| `email` | TEXT | |
| `display_name` | TEXT | |
| `is_active` | BOOLEAN | false on sign-out |
| `updated_at` | TIMESTAMPTZ | |

#### `ncm_notifications`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | auto |
| `title` | TEXT | Notification subject |
| `body` | TEXT | Notification message |
| `channel_id` | TEXT | Android channel, default: 'elite-esports-default' |
| `target_user_id` | UUID nullable | NULL = broadcast to all |
| `target_duid` | TEXT nullable | NULL = all devices of target user |
| `status` | TEXT | 'pending' \| 'delivered' \| 'failed' |
| `delivered_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |

### Key Source Files
| File | Purpose |
|---|---|
| `src/services/NCMService.ts` | DUID generation, device registration, Realtime subscription, background task, battery check |
| `src/store/NCMContext.tsx` | Provider: initializes NCM on login, prompts battery-saver alert |
| `app/admin-ncm.tsx` | Admin console: send notifications, view devices, view delivery history |
| `supabase/migrations/015_ncm_module.sql` | Schema for `device_registrations` + `ncm_notifications` |

### Workflow 1 — Device Registration
1. User installs app and signs in
2. `NCMContext` → `initNCM(user)` called
3. `NCMService.registerDevice()` generates DUID (stored in SecureStore) and upserts `device_registrations` row
4. Battery saver detection runs; if active, user is prompted to exempt the app

### Workflow 2 — Admin Sends Notification
1. Admin opens **NCM Console** (`admin-ncm.tsx`)
2. Fills in Title, Message, Channel; optionally targets a specific User UUID or DUID
3. INSERT → `ncm_notifications` with `status = 'pending'`
4. On each device, Supabase Realtime fires an INSERT trigger
5. `subscribeNCMRealtime()` checks if the row targets this user/DUID; if yes, fires local notification
6. Row status updated to `'delivered'`

### Background Fallback
- `expo-background-fetch` task `NCM_BACKGROUND_POLL` runs every ≥15 min
- On each wake, it queries `ncm_notifications` for any `pending` rows targeting the user
- Ensures delivery even after battery-saver kills the foreground Realtime socket
- Also triggers on `AppState` change to `active` (foreground resume)

*End of SYSTEM_MAP.md — Elite eSports*
