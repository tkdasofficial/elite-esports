# Elite eSports — Complete Project Blueprint

> **Version:** Final | **Date:** 2026-04-08  
> **Supabase Project:** `azxhcalksgudjemwjekd` → `https://azxhcalksgudjemwjekd.supabase.co`  
> **App Location:** `artifacts/elite-esports/`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Authentication Flow](#4-authentication-flow)
5. [App Screens & Features](#5-app-screens--features)
6. [Database Schema](#6-database-schema)
7. [RPC Functions](#7-rpc-functions)
8. [Database Triggers](#8-database-triggers)
9. [Wallet System](#9-wallet-system)
10. [Match Lifecycle](#10-match-lifecycle)
11. [Prize & Referral System](#11-prize--referral-system)
12. [Native Cloud Messaging (NCM)](#12-native-cloud-messaging-ncm)
13. [Sponsorship System](#13-sponsorship-system)
14. [Teams System](#14-teams-system)
15. [Ad System](#15-ad-system)
16. [Real-time Subscriptions](#16-real-time-subscriptions)
17. [Row-Level Security Summary](#17-row-level-security-summary)
18. [Storage](#18-storage)
19. [Admin Operations](#19-admin-operations)
20. [Known Caveats & Fixes](#20-known-caveats--fixes)

---

## 1. Project Overview

Elite eSports is a full-featured **React Native mobile gaming tournament platform** backed by **Supabase** (PostgreSQL + Auth + Realtime + Storage). Users:

- Sign up via **OTP email flow** (new) or **password** (returning)
- Complete a **KYC profile setup** (full name, username, country, password, optional referral code)
- **Browse & join** paid or free matches (tournaments) with wallet-based entry fees
- **Manage a wallet**: deposit via UPI QR code + UTR, withdraw to UPI ID
- **Claim prizes** after matches (rank-based or admin-defined splits)
- View a **global leaderboard** (ranked by match wins)
- **Manage teams** (create, join via invite code, captain role)
- Earn **referral bonuses** (₹10 to referrer per new referred user)
- Watch **live match streams** (YouTube / Twitch / Facebook / TikTok)
- Receive **real-time push notifications** via NCM (Native Cloud Messaging)
- Submit **support tickets** and **player reports**
- **Get sponsored** (apply for brand sponsorship, submit post links, earn wallet rewards)
- Earn **ad bonuses** (₹1/day for watching rewarded ads)

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Mobile Framework | **Expo** (React Native) with **Expo Router** (file-based routing) |
| Language | **TypeScript** |
| Backend / Database | **Supabase** (PostgreSQL, Auth, Realtime, Storage) |
| State Management | React Context (AuthContext, WalletContext, ProfileContext, NCMContext, ThemeContext, NotificationsContext, AdContext) |
| Navigation | Expo Router (tabs + stack) |
| UI Components | React Native core + custom components |
| Icons | `@expo/vector-icons` (Ionicons, Feather) |
| Animations | `expo-linear-gradient`, custom skeleton loaders |
| List Performance | `@shopify/flash-list` (Home tab) |
| Push Notifications | FCM tokens stored in `fcm_tokens`, NCM via Supabase Realtime |
| Ads | AdMob (interstitial + rewarded) via `ad_units`, `ad_triggers`, `ad_settings` |
| Clipboard | `expo-clipboard` |
| Secure Storage | `expo-secure-store` (DUID persistence for NCM) |
| Device Info | Custom `DeviceFingerprint` service |

---

## 3. Repository Structure

```
artifacts/elite-esports/
├── app/
│   ├── _layout.tsx               Root layout (AuthProvider, WalletProvider, etc.)
│   ├── index.tsx                 Redirect: tabs or auth
│   ├── (auth)/
│   │   ├── email-verify.tsx      Step 1: email → new/existing check
│   │   ├── otp-verify.tsx        Step 2: OTP confirmation (signup / login / reset)
│   │   └── kyc.tsx               Step 3: Profile setup (new users only)
│   ├── (tabs)/
│   │   ├── index.tsx             Home — match list + filters
│   │   ├── live.tsx              Live — ongoing matches
│   │   ├── leaderboard.tsx       Leaderboard — top players by wins
│   │   ├── wallet.tsx            Wallet — balance + recent transactions
│   │   └── profile.tsx           Profile — stats, games, menu
│   ├── match/[id].tsx            Match detail — join/leave/claim/watch
│   ├── add-money.tsx             Deposit (UPI QR + UTR)
│   ├── withdraw.tsx              Withdrawal (UPI ID + amount)
│   ├── transaction-history.tsx   Full 30-day transaction log
│   ├── edit-profile.tsx          Edit name/username/avatar/games
│   ├── my-matches.tsx            User's match history
│   ├── my-team.tsx               Team detail + members
│   ├── referral.tsx              Referral code + earnings
│   ├── notifications.tsx         In-app notification list
│   ├── notification/[id].tsx     Single notification detail
│   ├── settings.tsx              App settings (theme, etc.)
│   ├── support.tsx               Submit support ticket
│   ├── sponsored.tsx             Sponsorship application + post submission
│   ├── account-info.tsx          Account details
│   ├── about.tsx                 About page
│   ├── terms.tsx                 Terms of Service
│   ├── privacy.tsx               Privacy Policy
│   ├── disclaimer.tsx            Disclaimer
│   └── tournament/               Tournament-specific screens
├── src/
│   ├── config/
│   │   └── supabase.config.ts    Supabase URL + anon key
│   ├── services/
│   │   ├── supabase.ts           Supabase client singleton
│   │   ├── walletApi.ts          submitDeposit / submitWithdrawal
│   │   ├── NCMService.ts         initNCM, subscribeNCMRealtime, deregisterDevice
│   │   ├── NotificationService.ts  saveFcmToken / removeFcmToken
│   │   └── DeviceFingerprint.ts  DUID generation + event logging
│   ├── store/
│   │   ├── AuthContext.tsx        Session, user, signOut + FCM token mgmt
│   │   ├── WalletContext.tsx      balance, transactions, realtime listener
│   │   ├── ProfileContext.tsx     Profile data cache + save
│   │   ├── NCMContext.tsx         NCM init, DUID, battery saver detection
│   │   ├── NotificationsContext.tsx  Unread count + list
│   │   ├── AdContext.tsx          Ad loading state
│   │   └── ThemeContext.tsx       Dark/Light theme
│   ├── features/
│   │   ├── auth/                 Auth input components
│   │   ├── home/                 MatchCard, SkeletonCard, AdvancedFiltersSheet, useMatches, useMatchOptions
│   │   ├── live/                 LiveMatchCard, SkeletonLiveCard, useLiveMatches
│   │   ├── leaderboard/          LeaderRow, useLeaderboard
│   │   ├── match/                useMatchDetail, useMatchPlayers, useMatchWinners, usePrizeTiers
│   │   ├── wallet/               TransactionItem
│   │   └── profile/              useProfile
│   ├── hooks/
│   │   └── useAdGate.ts          gateWithInterstitial / gateWithRewarded
│   ├── utils/
│   │   ├── types.ts              Match, ProfileData, STATUS_CONFIG, etc.
│   │   ├── colors.ts             getColors(isDark) → AppColors
│   │   └── authHelpers.ts        navigateAfterAuth (checks kyc_completed)
│   └── components/
│       ├── GlobalHeader.tsx      Top bar with search + notification bell
│       ├── ScreenHeader.tsx      Back-button page header
│       ├── AvatarSVG.tsx         12 built-in avatar SVGs (stored as numeric index 0-11)
│       ├── SkeletonBar.tsx       Animated placeholder loader
│       └── AdLoadingOverlay.tsx  Ad countdown overlay

supabase/
├── COMPLETE_SETUP.sql            Single-file idempotent DB setup (ALL migrations)
├── backend_setup.sql             Earlier version (use COMPLETE_SETUP.sql instead)
└── migrations/
    ├── 001_games.sql
    ├── 002_missing_tables.sql
    ├── 003_claim_match_prize.sql
    ├── 004_leaderboard_wins.sql
    ├── 005_add_upi_id_to_withdrawals.sql
    ├── 006_screenshot_url_nullable.sql
    ├── 007_enable_realtime.sql
    ├── 008_auto_delete_old_transactions.sql
    ├── 009_team_slogan_avatar_code.sql
    ├── 010_teams_complete_setup.sql
    ├── 011_credit_ad_bonus.sql
    ├── 012_backend_rpcs.sql
    ├── 013_game_mode_squad_type.sql
    ├── 014_check_email_rpc.sql
    ├── 015_kyc_gate_in_join_match.sql
    ├── 016_ncm_full_backend.sql
    ├── 017_upi_id_and_admin_settings.sql
    └── 018_fix_wallet_tx_enums.sql  ← LATEST (most authoritative)
```

---

## 4. Authentication Flow

### New User

```
email-verify.tsx
  → user enters email
  → check_email_registered(email) RPC → false (new)
  → navigate to otp-verify.tsx?mode=signup
    → supabase.auth.signInWithOtp(email)  [sends magic link / OTP]
    → user enters 6-digit OTP
    → supabase.auth.verifyOtp(email, token, 'email')
    → session created → handle_new_user trigger fires (auto-create users row + wallet)
    → navigateAfterAuth() checks kyc_completed → false
    → navigate to kyc.tsx

kyc.tsx
  → user fills: full_name, username, country, region, city, zip, phone, password, referral_code (opt)
  → validate username uniqueness (users table query)
  → supabase.auth.updateUser({ password })
  → supabase.from('users').upsert({ id, name, username, avatar_url: '0' })
  → supabase.auth.updateUser({ data: { full_name, username, country, ..., kyc_completed: true } })
  → supabase.rpc('sync_kyc_status')  [copies kyc_completed from auth.users.raw_user_meta_data → users.kyc_completed]
  → supabase.rpc('use_referral_code', { p_code })  [if referral code entered]
  → router.replace('/(tabs)')
```

### Existing User

```
email-verify.tsx
  → check_email_registered(email) → true
  → show password field (step = 'login')
  → supabase.auth.signInWithPassword(email, password)
  → navigateAfterAuth() checks kyc_completed → true
  → router.replace('/(tabs)')
```

### Password Reset / Magic Link Login

```
otp-verify.tsx?mode=reset
  → supabase.auth.resetPasswordForEmail(email)
  → user enters OTP
  → verify → update password → navigate to tabs

otp-verify.tsx?mode=auth
  → signInWithOtp (magic link / email OTP)
  → verify → navigate (kyc check)
```

### Auth State Management

`AuthContext` uses `supabase.auth.onAuthStateChange`:
- `SIGNED_IN` → saves FCM token, logs device fingerprint event
- `SIGNED_OUT` → removes FCM token, navigates to email-verify
- `TOKEN_REFRESHED` → saves FCM token

### KYC Gating

`navigateAfterAuth(userId)`:
1. Queries `users` table for `kyc_completed`
2. Falls back to `auth.users.user_metadata.kyc_completed`
3. If false → `/(auth)/kyc`
4. If true → `/(tabs)`

At the RPC level: `join_match` checks `kyc_completed` from `auth.users.raw_user_meta_data` (the app also checks this client-side before calling the RPC).

---

## 5. App Screens & Features

### Tab 1 — Home (`app/(tabs)/index.tsx`)

- Displays all matches from `matches` table joined with `games(name)`
- **Status chips**: All / Ongoing / Upcoming / Ended
- **Advanced Filters Sheet**: sort by time/prize/entry, filter by game/mode/squad, free/paid
- **Search**: real-time client-side filter on title/game/prize/entry
- **Retry** on network error
- Navigates to `match/[id]` on tap

**Hook:** `useMatches` — fetches from `matches` with `game_id`, `games(name)`, realtime UPDATE listener  
**Hook:** `useMatchOptions` — fetches `match_modes` and `squad_types` for filter options

### Tab 2 — Live (`app/(tabs)/live.tsx`)

- Shows only `status = 'ongoing'` matches
- Client-side search filter
- Skeleton loader while fetching

**Hook:** `useLiveMatches` — same as useMatches but pre-filtered for ongoing

### Tab 3 — Leaderboard (`app/(tabs)/leaderboard.tsx`)

- Reads from `leaderboard` VIEW (aggregates wins + points + kills + matches_played from `match_results` + `users`)
- Only shows players who have at least 1 win (`HAVING wins > 0`)
- Skeleton loader, pull-to-refresh

**Hook:** `useLeaderboard` — queries `leaderboard` view ordered by wins DESC

### Tab 4 — Wallet (`app/(tabs)/wallet.tsx`)

- Shows current balance from `wallets` table (falls back to `profiles.balance` for legacy)
- Recent transactions (last 7 days) aggregated from 4 tables:
  - `payments` (deposits)
  - `withdrawals` (withdrawal requests)
  - `transactions` (legacy)
  - `wallet_transactions` (internal ledger)
- **Add Money** → `add-money.tsx`
- **Withdraw** → `withdraw.tsx`
- **Full History** → `transaction-history.tsx`
- Pull-to-refresh, realtime listeners on all 4 tables

**Context:** `WalletContext` — manages balance + transaction list, realtime subscriptions

### Tab 5 — Profile (`app/(tabs)/profile.tsx`)

- Shows avatar (SVG, index 0–11 stored as string in `users.avatar_url`)
- Name, username, badge (avatar name)
- Stats strip: Played (count from `match_participants`) / Wins (rank=1 from `match_results`) / Earned (sum of approved credits from `wallet_transactions`)
- Linked games from `user_games` + `games`
- Menu: My Team / My Matches / Referral / Get Sponsored / Settings / Support
- Sign Out (removes FCM token, signs out from Supabase)

### Match Detail (`app/match/[id].tsx`)

- Hero banner image (from `matches.banner_url`)
- Prize pool + entry fee card
- Player slots meter (joined_players / max_players)
- Game mode / squad type chips
- Match description + rules
- **Room credentials** (visible only to participants when `room_visible = true`)
- **Live stream links** (YouTube / Twitch / Facebook / TikTok) — opens in browser
- **Players modal** — list of joined participants with avatars
- **Winners / Prize Distribution modal** — rank-based prize tiers
- **Join Match** (upcoming, not full, KYC-gated) — shows confirm modal with in-game name/uid
- **Leave Match** — no refund (shows warning modal)
- **Claim Prize** (completed, participant, has result) — gated behind rewarded ad
- **Your Result card** (completed matches with a result)
- Realtime UPDATE listener on the match row

### Add Money (`app/add-money.tsx`)

- Displays UPI QR code (from `app_settings.upi_id`)
- User enters UTR + amount → `submitDeposit(amount, utr)` → inserts into `payments` (status: pending)
- NCM trigger fires → notifies user of pending deposit

### Withdraw (`app/withdraw.tsx`)

- User enters amount + UPI ID → `submitWithdrawal(amount, upi_id)` → inserts into `withdrawals` (status: pending)
- NCM trigger fires → notifies user of pending withdrawal
- KYC gated

### Transaction History (`app/transaction-history.tsx`)

- Full 30-day aggregated transaction list from all 4 sources
- Credit (green) / Debit (red) labels with icons
- Status badges: pending / approved / rejected

### Edit Profile (`app/edit-profile.tsx`)

- Change name, username, avatar (12 built-in SVG options)
- Add/remove linked games (game + in-game UID + in-game name)
- Saves to `users` + `user_games` via `useProfile.save()`

### Referral (`app/referral.tsx`)

- Shows user's 8-character referral code (SHA-256 first 8 hex chars of user ID)
- Copy / Share native share sheet
- Stats: referral count + total earned (from `wallet_transactions` where reference_id LIKE 'referral:%')
- History list of all referral bonuses received
- RPC: `get_referral_code()` — lazy creates code if missing

### Notifications (`app/notifications.tsx`)

- Lists notifications from `notifications` table (user's own)
- Mark as read on tap
- Realtime listener on `notifications` table

### Sponsored (`app/sponsored.tsx`)

- **Stage 1**: Apply with platform (Instagram/YouTube/TikTok/Twitter), profile URL, follower count → inserts `sponsorship_applications`
- **Stage 2**: Once approved, submit post URL → inserts `sponsored_posts`
- Admin reviews via `verify_sponsored_post()` RPC → credits wallet reward

### My Team (`app/my-team.tsx`)

- Shows team the user belongs to (from `team_members` + `teams`)
- Captain can edit team details (name, tag, slogan, game)
- Invite code display for sharing

### My Matches (`app/my-matches.tsx`)

- Lists matches the user has joined (`match_participants` + `matches`)
- Shows status + result if available

### Settings (`app/settings.tsx`)

- Toggle dark/light theme (persisted via ThemeContext)
- Account info link
- Notification preferences

---

## 6. Database Schema

### Core User Tables

#### `public.users`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | References `auth.users(id)` |
| `name` | TEXT | Full name |
| `username` | TEXT UNIQUE | 3+ chars, alphanumeric + underscore |
| `avatar_url` | TEXT | Numeric string "0"–"11" (index into AvatarSVG array) |
| `kyc_completed` | BOOLEAN | Default false; set by `sync_kyc_status()` |
| `phone` | TEXT | With country code e.g. +919876543210 |
| `referral_code` | TEXT UNIQUE | SHA-256(user_id)[0:8] uppercase |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**RLS:** SELECT = public | INSERT = own only | UPDATE = own only

#### `public.admin_users`
| Column | Type | Notes |
|---|---|---|
| `user_id` | UUID PK | References `auth.users(id)` |

**RLS:** SELECT = public | all write = admin only (no write policies — managed manually)

#### `public.wallets`
| Column | Type | Notes |
|---|---|---|
| `user_id` | UUID PK | References `auth.users(id)` |
| `balance` | NUMERIC | CHECK >= 0 |
| `updated_at` | TIMESTAMPTZ | Updated on every balance change |

**RLS:** SELECT = own only | ALL (admin)

#### `public.user_roles`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID | References `auth.users(id)` |
| `role` | TEXT | Fine-grained role label |

---

### Games & Matches

#### `public.games`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT UNIQUE | e.g. "BGMI", "Free Fire" |
| `banner_url` | TEXT | Image URL |
| `status` | TEXT | 'active' or 'inactive' |

#### `public.matches`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `game_id` | UUID FK → games | |
| `title` | TEXT | Tournament title |
| `game` | TEXT | Denormalized game name |
| `banner_url` | TEXT | Match banner image |
| `entry_fee` | NUMERIC | 0 = free |
| `prize_pool` | NUMERIC | Total prize |
| `max_players` | INTEGER | |
| `joined_players` | INTEGER | Incremented by `join_match`, decremented by `leave_match` |
| `status` | TEXT | upcoming / ongoing / completed / cancelled |
| `scheduled_at` | TIMESTAMPTZ | When match is scheduled |
| `starts_at` | TIMESTAMPTZ | Actual start time |
| `room_id` | TEXT | Game room ID (admin-set) |
| `room_password` | TEXT | Game room password (admin-set) |
| `room_visible` | BOOLEAN | Show room credentials to participants |
| `description` | TEXT | About the match |
| `rules` | TEXT | Newline-separated rule list |
| `live_stream_url` | TEXT | Generic stream URL |
| `youtube_url` | TEXT | YouTube live URL |
| `twitch_url` | TEXT | Twitch URL |
| `facebook_url` | TEXT | Facebook live URL |
| `tiktok_url` | TEXT | TikTok live URL |
| `game_mode` | TEXT | e.g. "Battle Royale", "TDM" |
| `squad_type` | TEXT | e.g. "Solo", "Squad" |
| `created_at` | TIMESTAMPTZ | |

**RLS:** SELECT = public | ALL (admin)

#### `public.match_participants`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `match_id` | UUID FK → matches | |
| `user_id` | UUID FK → auth.users | |
| `joined_at` | TIMESTAMPTZ | |
| UNIQUE | (match_id, user_id) | One entry per user per match |

**RLS:** SELECT = authenticated | INSERT = own only | ALL (admin)

#### `public.match_results`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `match_id` | UUID FK → matches | |
| `user_id` | UUID FK → auth.users | |
| `rank` | INTEGER | Final placement |
| `kills` | INTEGER | Kill count |
| `points` | INTEGER | Score points |
| `prize_amount` | NUMERIC | Optional explicit prize (used by NCM trigger) |
| UNIQUE | (match_id, user_id) | |

**ON INSERT:** `trg_auto_prize_on_result` fires → auto-credits wallet  
**ON INSERT:** `ncm_match_result` fires → push notification to player

#### `public.match_prize_splits`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `match_id` | UUID FK → matches | |
| `rank` | INTEGER | Placement rank |
| `prize_amount` | NUMERIC | Explicit prize for this rank |
| UNIQUE | (match_id, rank) | |

Admin sets custom per-rank prize amounts. Fallback is 50%/30%/10% of prize_pool.

#### `public.match_modes`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT UNIQUE | e.g. "Full Map", "TDM", "Battle Royale" |
| `sort_order` | INTEGER | Display order |
| `status` | TEXT | active / inactive |

**Seed:** Full Map, TDM, PVP, Battle Royale, Clash Squad, Ranked

#### `public.squad_types`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT UNIQUE | e.g. "Solo", "Duo", "Squad" |
| `sort_order` | INTEGER | |
| `status` | TEXT | active / inactive |

**Seed:** Solo, Duo, 3v3, 4v4, Squad

#### `public.leaderboard` (VIEW)
```sql
SELECT u.id, u.username, u.avatar_url,
  COUNT(DISTINCT CASE WHEN mr.rank = 1 THEN mr.match_id END) AS wins,
  COALESCE(SUM(mr.points), 0) AS total_points,
  COALESCE(SUM(mr.kills), 0)  AS total_kills,
  COUNT(DISTINCT mr.match_id)  AS matches_played
FROM users u INNER JOIN match_results mr ON mr.user_id = u.id
GROUP BY u.id HAVING wins > 0
```

---

### Financial Tables

#### `public.payments`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `amount` | NUMERIC | |
| `utr` | TEXT | UPI Transaction Reference |
| `screenshot_url` | TEXT | Optional proof image |
| `status` | TEXT | pending / approved / rejected |
| `ai_status` | TEXT | Optional AI-verification result |
| `created_at` | TIMESTAMPTZ | |

**ON INSERT:** `ncm_payment_received` trigger → "Deposit Received" notification  
**ON UPDATE:** `ncm_payment_status` trigger → "Approved" or "Rejected" notification

#### `public.withdrawals`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `amount` | NUMERIC | |
| `upi_id` | TEXT | User's UPI ID for payout |
| `status` | TEXT | pending / approved / rejected |
| `created_at` | TIMESTAMPTZ | |

**ON INSERT:** `ncm_withdrawal_received` trigger  
**ON UPDATE:** `ncm_withdrawal_status` trigger

#### `public.wallet_transactions`
Internal credit/debit ledger. All wallet movements are recorded here.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `type` | TEXT | 'credit' or 'debit' (TEXT + CHECK, NOT ENUM) |
| `amount` | NUMERIC | |
| `status` | TEXT | 'pending' / 'approved' / 'rejected' (default: 'approved') |
| `reference_id` | TEXT | Namespaced reference (see below) |
| `created_at` | TIMESTAMPTZ | |

**Reference ID Namespace:**
| Prefix | Meaning |
|---|---|
| `entry:<match_id>` | Entry fee deduction |
| `result:<match_id>` | Manual prize claim |
| `autopay:<match_id>` | Auto-distributed prize |
| `refund:<match_id>` | Entry fee refund (cancelled match) |
| `referral:<new_user_id>` | Referral bonus to referrer |
| `ad_bonus:<user_id>:<YYYY-MM-DD>` | Daily ad bonus |
| `sponsored:<post_id>` | Sponsorship reward |
| `deposit:<id>` | Admin manual deposit |
| `withdraw:<id>` | Admin manual debit |

**ON INSERT:** `ncm_wallet_credited` trigger fires for prize/referral/ad/refund credits

---

### Communication & Social

#### `public.notifications`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `title` | TEXT | |
| `message` | TEXT | |
| `type` | TEXT | e.g. 'general', 'match_joined', 'prize_credited', 'deposit_approved' |
| `is_read` | BOOLEAN | Default false |
| `created_at` | TIMESTAMPTZ | |

#### `public.user_games`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `game_id` | UUID FK → games | |
| `uid` | TEXT | In-game player UID |
| `in_game_name` | TEXT | In-game display name |
| UNIQUE | (user_id, game_id) | |

#### `public.support_tickets`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `category` | TEXT | e.g. 'general', 'payment', 'match' |
| `subject` | TEXT | |
| `message` | TEXT | |
| `status` | TEXT | open / in_progress / resolved |

#### `public.reports`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `description` | TEXT | |
| `related_match_id` | UUID FK → matches | Optional |
| `status` | TEXT | open / resolved |

#### `public.broadcasts`
Admin broadcast messages (title + message). Public read.

#### `public.fcm_tokens`
Firebase Cloud Messaging device tokens.
| Column | Type | Notes |
|---|---|---|
| `user_id` | UUID FK | |
| `token` | TEXT | FCM push token |
| `platform` | TEXT | android / ios |
| `email` | TEXT | |
| UNIQUE | (user_id, token) | |

---

### Teams

#### `public.teams`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT | Team name |
| `tag` | TEXT | Max 5 chars tag |
| `game` | TEXT | Primary game |
| `slogan` | TEXT | Optional tagline |
| `avatar_url` | TEXT | Team avatar |
| `invite_code` | TEXT UNIQUE | Shareable join code |
| `created_by` | UUID FK | Team captain's user ID |

**RLS:** SELECT = public | INSERT = authenticated (created_by = auth.uid()) | UPDATE = captain only | ALL (admin)

#### `public.team_members`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `team_id` | UUID FK → teams | |
| `user_id` | UUID FK | |
| `role` | TEXT | 'captain' or 'member' |
| UNIQUE | (team_id, user_id) | |

---

### Admin Configuration

#### `public.app_settings`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Only one row exists |
| `min_deposit` | NUMERIC | Min deposit amount (default ₹10) |
| `max_deposit` | NUMERIC | Max deposit amount (default ₹50,000) |
| `min_withdraw` | NUMERIC | Min withdrawal (default ₹50) |
| `max_withdraw` | NUMERIC | Max withdrawal (default ₹50,000) |
| `upi_id` | TEXT | Admin's UPI ID shown on deposit screen |

#### `public.points_settings`
Kill points + rank-based scoring configuration (1 row).

#### `public.ad_units`
AdMob unit IDs per type (interstitial / rewarded / app_open).

#### `public.ad_triggers`
Maps trigger events (e.g. 'join_match', 'leave_match') to ad units with cooldown settings.

#### `public.ad_settings`
Global ads on/off toggle + default cooldown seconds.

---

### Sponsorship

#### `public.sponsorship_applications`
Stage 1: User applies with platform + profile URL + follower count.  
Admin approves/rejects. Approved users can submit sponsored posts.

#### `public.sponsored_posts`
Stage 2: User submits post URL.  
Admin calls `verify_sponsored_post(post_id)` → credits reward + notifies user.

---

### NCM (Native Cloud Messaging)

#### `public.device_registrations`
| Column | Type | Notes |
|---|---|---|
| `duid` | TEXT UNIQUE | Device Unique ID (generated by app, stored in SecureStore) |
| `user_id` | UUID FK | |
| `platform` | TEXT | ios / android / web |
| `push_token` | TEXT | Optional raw APNs/FCM token |
| `is_active` | BOOLEAN | False when user logs out |

#### `public.ncm_notifications`
| Column | Type | Notes |
|---|---|---|
| `target_user_id` | UUID | NULL = broadcast to all |
| `target_duid` | TEXT | NULL = all devices of user |
| `title` | TEXT | |
| `body` | TEXT | |
| `data` | JSONB | e.g. `{"type":"match_joined","match_id":"..."}` |
| `channel_id` | TEXT | Android notification channel |
| `status` | TEXT | pending / delivered / failed |
| `delivered_at` | TIMESTAMPTZ | |
| `retry_count` | INTEGER | |

**Realtime INSERT** on this table → device subscribes and fires a local notification immediately.

**Android Notification Channels:**
| Channel | Used For |
|---|---|
| `elite-esports-match` | Match join/live/result |
| `elite-esports-reward` | Prizes, referral bonuses, ad bonuses |
| `elite-esports-account` | Deposits, withdrawals |
| `elite-esports-default` | Broadcasts, general |

---

## 7. RPC Functions

All RPCs are `SECURITY DEFINER` (run as DB owner, bypass RLS) with explicit `GRANT EXECUTE TO authenticated`.

| Function | Caller | Purpose |
|---|---|---|
| `check_email_registered(email TEXT)` → BOOLEAN | anon + authenticated | Check if email exists in auth.users (for new vs returning user routing) |
| `join_match(match_id UUID)` → JSONB | authenticated | Balance check → debit wallet → insert participant → increment joined_players |
| `leave_match(match_id UUID)` → JSONB | authenticated | Remove participant → decrement joined_players (NO refund) |
| `claim_match_prize(match_id UUID)` → JSONB | authenticated | Credit rank prize (from match_prize_splits or % fallback) + sync wallet |
| `auto_distribute_prize()` → TRIGGER | DB trigger | Auto-credit prize on match_results INSERT (same logic as claim_match_prize) |
| `get_user_match_result(match_id UUID)` → JSONB | authenticated | Return rank/kills/points/prize/already_claimed for a completed match |
| `credit_ad_bonus()` → JSONB | authenticated | Credit ₹1 daily rewarded-ad bonus (deduped by date in IST timezone) |
| `sync_kyc_status()` → void | authenticated | Copy kyc_completed from auth.users.raw_user_meta_data → public.users |
| `get_referral_code()` → TEXT | authenticated | Get or generate caller's 8-char referral code |
| `use_referral_code(code TEXT)` → JSONB | authenticated | Credit referrer ₹10 bonus (each new user can only be referred once) |
| `update_app_settings(...)` → JSONB | admin only | Update UPI ID, deposit/withdrawal limits |
| `get_admin_settings()` → JSONB | admin only | Read current app_settings row |
| `verify_sponsored_post(post_id, reward?)` → JSONB | admin only | Mark post verified + credit reward + notify user |
| `notify_user(user_id, title, body, channel, data)` → void | DB triggers | Insert into ncm_notifications + notifications |
| `broadcast_notification(title, body, user_id?)` → JSONB | admin only | Push to all active devices (or one user) |

### join_match Logic

```
1. Ensure authenticated (auth.uid() not null)
2. Load match: status, entry_fee, max_players, joined_players
3. Status must be 'upcoming'
4. joined_players must be < max_players
5. Check not already joined (idempotency)
6. If entry_fee > 0:
   a. Read wallet balance
   b. If insufficient → return error
   c. UPDATE wallets SET balance = balance - fee
   d. INSERT wallet_transactions (type='debit', ref='entry:<match_id>')
7. INSERT match_participants
8. UPDATE matches SET joined_players = joined_players + 1
9. Return { success: true }
```

### Prize Distribution Priority

1. Check `match_prize_splits` for explicit rank prize
2. If not found or 0, apply percentage of `prize_pool`:
   - Rank 1 → 50%
   - Rank 2 → 30%
   - Rank 3 → 10%
   - Rank 4+ → 0

---

## 8. Database Triggers

### `on_auth_user_created` (AFTER INSERT on auth.users)
Calls `handle_new_user()`:
- Creates `public.users` row with name + referral_code
- Creates `public.wallets` row with balance = 0

### `trg_auto_prize_on_result` (AFTER INSERT on match_results)
Calls `auto_distribute_prize()`:
- Looks up prize from `match_prize_splits` or falls back to %
- Credits wallet + records `wallet_transactions`
- Idempotent (checks existing record by reference_id)

### NCM Triggers (8 total)

| Trigger | Table | Event | Notification |
|---|---|---|---|
| `ncm_match_joined` | match_participants | INSERT | "You're In!" |
| `ncm_wallet_credited` | wallet_transactions | INSERT | prize/referral/ad/refund credit |
| `ncm_payment_received` | payments | INSERT | "Deposit Received" (pending) |
| `ncm_payment_status` | payments | UPDATE | "Approved" or "Rejected" |
| `ncm_withdrawal_received` | withdrawals | INSERT | "Withdrawal Requested" |
| `ncm_withdrawal_status` | withdrawals | UPDATE | "Processed" or "Rejected" |
| `ncm_match_result` | match_results | INSERT | "#Rank result published" |
| `ncm_match_status_change` | matches | UPDATE of status | all participants: "Match is LIVE!" or "Match Cancelled" |

---

## 9. Wallet System

### Balance Source
1. Primary: `wallets.balance` (real-time via Supabase Realtime)
2. Fallback: `profiles.balance` (legacy)

### Transaction Sources (WalletContext aggregates from 4 tables)
All queries are scoped to last 7 days. Full history available via `transaction-history.tsx` (30 days).

| Table | Direction | Label |
|---|---|---|
| `payments` | Credit (pending) | "Deposit" |
| `withdrawals` | Debit (pending) | "Withdrawal" |
| `transactions` | Credit/Debit | legacy |
| `wallet_transactions` | Credit/Debit | determined by reference_id prefix |

### Deposit Flow
1. User opens `add-money.tsx`
2. App loads `app_settings.upi_id` → shows UPI QR
3. User pays externally, enters UTR + amount
4. `submitDeposit(amount, utr)` → INSERT into `payments` (status: pending)
5. `ncm_payment_received` trigger → "Deposit Received" push notification
6. Admin reviews in admin panel → UPDATE status to 'approved'
7. Admin credits wallet (manual or via webhook/automation)
8. `ncm_payment_status` trigger → "Deposit Approved" push notification
9. `wallets` realtime update → WalletContext refreshes balance

### Withdrawal Flow
1. User opens `withdraw.tsx`
2. Enters amount + UPI ID → `submitWithdrawal(amount, upi_id)` → INSERT into `withdrawals`
3. `ncm_withdrawal_received` trigger → "Withdrawal Requested" notification
4. Admin processes payment externally → UPDATE status to 'approved'/'rejected'
5. `ncm_withdrawal_status` trigger → "Processed" or "Rejected" notification

---

## 10. Match Lifecycle

```
Status: upcoming → ongoing → completed
                ↘ cancelled
```

| Status | User Actions |
|---|---|
| upcoming | Join (if not full, KYC complete, sufficient balance), Leave |
| ongoing | Leave, Watch live stream, View room credentials (if room_visible) |
| completed | Claim prize (if ranked, hasn't claimed), View results |
| cancelled | None (entry fee is noted as not refunded per current leave_match RPC) |

### Join Flow (with Ad Gate)
```
handleJoinPress()
  → KYC check (user.user_metadata.kyc_completed)
  → fetchGameProfile(game_id) → loads user_games + users
  → if no game profile → show "Add Game" modal
  → show JoinConfirm modal (game uid + username + fee)
  → handleJoinConfirm()
    → gateWithInterstitial()  [shows interstitial ad]
    → supabase.rpc('join_match', { _match_id })
    → refreshWallet()
```

### Leave Flow (with Ad Gate, No Refund)
```
handleLeave() → LeaveModal → confirm
  → gateWithInterstitial()
  → supabase.rpc('leave_match', { _match_id })
  → Alert: "Entry fee NOT refunded"
  → router.back()
```

### Prize Claim Flow (with Rewarded Ad)
```
handleClaim()
  → gateWithRewarded(
      onAdWatched: credit_ad_bonus() [₹1],
      afterReward: claim_match_prize(match_id) → credit wallet
    )
  → refreshWallet()
```

---

## 11. Prize & Referral System

### Prize Distribution
- **Auto-distribute**: `trg_auto_prize_on_result` fires when admin inserts match_results rows
- **Manual claim**: User taps "Claim Prize" → `claim_match_prize()` RPC
- **Idempotency**: `reference_id` checked before any credit to prevent double-payment
- **Prize tiers**: `match_prize_splits` table first, then 50%/30%/10% fallback

### Referral System
- Each user gets an 8-char code: `UPPER(sha256(user_id)[0:8])`
- Code is stored in `users.referral_code` (UNIQUE constraint)
- At KYC: user enters referrer's code → `use_referral_code(code)` RPC:
  1. Find owner of code (cannot self-refer)
  2. Check idempotency (`reference_id = 'referral:<new_user_id>'`)
  3. Credit owner ₹10 in wallet + record in `wallet_transactions`
- `get_referral_code()` RPC: lazy-creates code if missing, used in Referral screen
- History: query `wallet_transactions WHERE reference_id LIKE 'referral:%'`

---

## 12. Native Cloud Messaging (NCM)

### Architecture

```
Device boots → NCMContext.initNCM(user)
  → generates/loads DUID from SecureStore
  → upserts device_registrations (duid, user_id, platform, push_token)
  → checks battery saver (Android) → prompt if active
  → subscribeNCMRealtime(user_id)
    → supabase.channel('ncm-<user_id>')
    → listens for INSERT on ncm_notifications WHERE target_user_id = user_id OR NULL
    → on INSERT: fires local notification via Expo Notifications API
    → marks notification as 'delivered' (UPDATE ncm_notifications SET status='delivered')
  
  Background: BackgroundFetch polls every 15 min for 'pending' NCM notifications
              (offline fallback when Realtime websocket is not connected)
```

### Notification Delivery Path

```
DB event (e.g. admin approves deposit)
  → UPDATE payments SET status = 'approved'
  → trigger ncm_payment_status fires
  → calls notify_user(user_id, title, body, channel, data)
  → INSERT into ncm_notifications (status: 'pending')
  → INSERT into notifications (in-app list)
  → Supabase Realtime sends INSERT event to subscribed device
  → App receives via channel.on('postgres_changes')
  → scheduleLocalNotification() → OS shows push notification
  → App marks ncm_notification as 'delivered'
```

### Sign-Out Cleanup

```
AuthContext.signOut()
  → removeFcmTokenForUser(userId) → DELETE from fcm_tokens WHERE user_id
  → NCMContext detects user = null
    → deregisterDevice(userId) → UPDATE device_registrations SET is_active = false
    → unsubscribe Realtime channel
```

---

## 13. Sponsorship System

### Stage 1 — Application
- User submits: platform, profile_url, follower_count
- INSERT into `sponsorship_applications` (status: pending)
- Admin reviews → UPDATE status to 'approved' / 'rejected'

### Stage 2 — Post Submission (approved users only)
- User submits: post_url, platform
- INSERT into `sponsored_posts` (status: pending, linked to application_id)
- Admin calls `verify_sponsored_post(post_id, reward_amount?)`
  - Marks post verified
  - Credits user wallet (reward_amount from application or default ₹50)
  - Records wallet_transactions (type='credit', ref='sponsored:<post_id>')
  - Sends in-app notification

---

## 14. Teams System

### Create Team
- INSERT into `teams` (created_by = auth.uid())
- INSERT into `team_members` (role = 'captain')
- `invite_code` = unique shareable code (UUID or short hash)

### Join Team
- Search team by invite_code
- INSERT into `team_members` (role = 'member')
- RLS: only own user_id

### Captain Controls
- UPDATE `teams` (name, tag, slogan, game) — RLS: captain only
- Kick members via DELETE `team_members`

### Realtime
Both `teams` and `team_members` are in `supabase_realtime` publication.

---

## 15. Ad System

### Ad Gate Hook (`useAdGate.ts`)

```typescript
gateWithInterstitial(callback, label?, triggerId?)
  → check ad_settings.ads_enabled
  → check cooldown from ad_triggers WHERE trigger = triggerId
  → if enabled + not in cooldown:
    → show AdLoadingOverlay
    → load + show interstitial ad (AdMob)
    → after close: execute callback
  → else: execute callback directly

gateWithRewarded(onAdWatched, afterReward)
  → show rewarded ad
  → onAdWatched fires during ad (credit_ad_bonus RPC)
  → afterReward fires after dismiss (claim prize)
```

### Ad Triggers
Configured in `ad_triggers` table:
- `join_match` → interstitial before joining
- `leave_match` → interstitial before leaving
- `claim_prize` → rewarded ad before prize claim

### Ad Units
| Type | Used When |
|---|---|
| interstitial | Between actions (join/leave) |
| rewarded | Prize claim (required to watch) |
| app_open | App launch (optional) |

---

## 16. Real-time Subscriptions

### WalletContext
```
supabase.channel('wallet-unified-<user_id>')
  .on('postgres_changes', { table: 'wallets', filter: user_id=eq.<id> })        → reload balance+txns
  .on('postgres_changes', { table: 'payments', filter: user_id=eq.<id> })       → reload
  .on('postgres_changes', { table: 'withdrawals', filter: user_id=eq.<id> })    → reload
  .on('postgres_changes', { table: 'wallet_transactions', filter: ... })         → reload
```

### Match Detail (`useMatchDetail`)
```
supabase.channel('match-<id>')
  .on('postgres_changes', { event: 'UPDATE', table: 'matches', filter: id=eq.<id> }) → refetch
```

### NCMContext
```
supabase.channel('ncm-<user_id>')
  .on('postgres_changes', { event: 'INSERT', table: 'ncm_notifications',
      filter: target_user_id=eq.<user_id> })  → fire local notification
```

### Tables in `supabase_realtime` Publication
- matches, notifications, wallets, wallet_transactions
- withdrawals, teams, team_members
- ncm_notifications, device_registrations
- sponsorship_applications, sponsored_posts
- app_settings, match_prize_splits

---

## 17. Row-Level Security Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| users | public | own only | own only | — |
| admin_users | public | — | — | — |
| wallets | own only | — | — | — |
| games | public | admin | admin | admin |
| matches | public | admin | admin | admin |
| match_participants | authenticated | own only | — | admin |
| match_results | public | admin | admin | admin |
| match_prize_splits | public | admin | admin | admin |
| match_modes | public | admin | admin | admin |
| squad_types | public | admin | admin | admin |
| payments | own only | own only | admin | admin |
| withdrawals | own only | own only | admin | admin |
| wallet_transactions | own only | — | — | — |
| notifications | own only | — | own only (is_read) | — |
| user_games | public | own only | own only | own only |
| support_tickets | own only | own only | admin | admin |
| reports | own only | own only | admin | admin |
| broadcasts | public | admin | admin | admin |
| fcm_tokens | own only | own only | own only | own only |
| teams | public | own (captain) | captain only | admin |
| team_members | public | own only | admin | own only |
| app_settings | public | admin | admin | admin |
| points_settings | public | admin | admin | admin |
| ad_units | public | admin | admin | admin |
| ad_triggers | public | admin | admin | admin |
| ad_settings | public | admin | admin | admin |
| sponsorship_applications | own only | own only | admin | admin |
| sponsored_posts | own only | own only | admin | admin |
| device_registrations | own only | own only | own only | — |
| ncm_notifications | own + broadcast | — | own (mark delivered) | admin |
| user_roles | public | admin | admin | admin |

All `admin` operations require: `EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())`

---

## 18. Storage

### Bucket: `game-banners`
- **Public read**: all users can load banner images
- **Admin write**: only admin users can upload/delete
- Used for `games.banner_url` and `matches.banner_url`

---

## 19. Admin Operations

### Grant Admin Access
```sql
INSERT INTO public.admin_users (user_id) VALUES ('<auth-user-uuid>');
```

### Set UPI ID
```sql
UPDATE public.app_settings SET upi_id = 'yourname@bank';
-- or via RPC:
SELECT update_app_settings(p_upi_id => 'yourname@bank');
```

### Approve Deposit
```sql
UPDATE public.payments SET status = 'approved' WHERE id = '<payment-id>';
-- Then credit wallet manually:
UPDATE public.wallets SET balance = balance + <amount> WHERE user_id = '<user-id>';
INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
VALUES ('<user-id>', 'credit', <amount>, 'approved', 'deposit:<payment-id>');
```

### Publish Match Results
```sql
-- Sets results + auto_distribute_prize trigger fires
INSERT INTO public.match_results (match_id, user_id, rank, kills, points)
VALUES ('<match-id>', '<user-id>', 1, 5, 80);
-- Then mark match completed:
UPDATE public.matches SET status = 'completed' WHERE id = '<match-id>';
```

### Broadcast Notification
```sql
SELECT broadcast_notification('Title', 'Message body');                          -- all users
SELECT broadcast_notification('Title', 'Message', '<specific-user-uuid>');       -- one user
```

### Create Match Mode / Squad Type
```sql
INSERT INTO public.match_modes (name, sort_order) VALUES ('Custom Mode', 7);
INSERT INTO public.squad_types (name, sort_order) VALUES ('5v5', 6);
```

---

## 20. Known Caveats & Fixes

### wallet_transactions ENUM Bug (Fixed in Migration 018)
The original schema used PostgreSQL ENUM types for `wallet_transactions.type` and `wallet_transactions.status`. This caused errors like `invalid input value for enum wallet_tx_type: 'debit'` when `join_match` tried to insert. **Fix**: converted both columns to `TEXT` with `CHECK` constraints. The `COMPLETE_SETUP.sql` includes the conversion DDL that safely handles both fresh and existing databases.

### KYC Gate — App vs DB Layer
- **Migration 015** added KYC gate inside `join_match` RPC (checks `users.kyc_completed`)
- **Migration 018** moved the gate back to the app layer only (to avoid complexity, since the app always checks `user.user_metadata.kyc_completed` before calling the RPC)
- **Current state**: KYC is enforced at the **app layer** in `handleJoinPress()`. The RPC does NOT check kyc_completed to avoid SECURITY DEFINER vs auth.users query complexity.

### Leave Match — No Refund Policy
The current `leave_match` RPC **never refunds** the entry fee. The `leaveMatch()` frontend function always returns `{ refunded: false, refundAmount: 0 }`. The Alert shown to the user explicitly states the fee is not refunded.

### Avatar Storage
`users.avatar_url` stores a **numeric string** (e.g. `"0"`, `"1"`, ..., `"11"`) representing the index into the built-in `AvatarSVG` component array. It is **not** a URL. The profile hook converts it: `parseInt(avatar_url, 10)` → passed as `avatar_index` to `AvatarSVG`.

### Leaderboard View
The view uses `INNER JOIN` (not LEFT JOIN) and `HAVING wins > 0`, so **only users with at least 1 win appear**. This is intentional to keep the leaderboard meaningful.

### Transaction History — 4-Source Aggregation
`WalletContext` queries 4 tables in parallel (`payments`, `withdrawals`, `transactions`, `wallet_transactions`), deduplicates by ID, and sorts by `created_at DESC`. The `transactions` table is a **legacy** table; new systems use `wallet_transactions` exclusively.

### notify_user Helper — notifications.type Column
`notifications.type` was added in Migration 018. On fresh DBs the column exists from `CREATE TABLE`. On existing DBs, Migration 018's `DO $$ ALTER TABLE ADD COLUMN IF NOT EXISTS $$` block adds it safely. The `COMPLETE_SETUP.sql` includes this conditional ADD COLUMN.

---

*Blueprint generated from full analysis of all 18 migrations + complete app source code.*
