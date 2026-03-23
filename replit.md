# Elite Esports Platform

A premium competitive gaming platform with two codebases:
1. **Web app** — Vite + React (SPA, runs on port 5000 via `npm run dev`)
2. **Mobile app** — Expo + React Native (in `mobile/` directory, shares all `src/` stores/logic)

## Architecture

The platform uses a shared `src/` layer — all Zustand stores, Supabase client, theme colors, and TypeScript types are shared between both the Vite web app and the Expo mobile app.

### Web App (Vite/React)
- Entry: `index.html` → `src/main.tsx` → `src/App.tsx`
- Router: `src/routes/AppRouter.tsx` (React Router v7)
- Pages are organized into:
  - `src/auth/` — Login, SignUp, ForgotPassword, ResetPassword, VerifyEmail
  - `src/app/` — all user-facing pages (Home, Wallet, Profile, etc.)
  - `src/admin/` — all admin panel pages (AdminDashboard, AdminMatches, etc.)

### Mobile App (Expo)
- Entry: `mobile/` directory via expo-router (file-based routing, root configured in app.json)
- Root layout: `mobile/_layout.tsx` (Supabase auth listener, global store initialization)

## Tech Stack

**Web:**
- Vite 6 + React 19.1.0 + TypeScript 5.9
- React Router v7 (SPA mode)
- Tailwind CSS v4 (via @tailwindcss/vite)
- Framer Motion / motion (animations)
- Lucide React (icons)

**Mobile:**
- Expo SDK 54 + React Native 0.81.5
- expo-router v6 (file-based routing, root: `mobile/`)
- React Native StyleSheet (uses `src/theme/colors.ts` — no Tailwind)
- @expo/vector-icons
- react-native-gesture-handler, react-native-safe-area-context, react-native-reanimated

**Shared:**
- Zustand v5 (state management)
- Supabase (auth, database, real-time) — `src/lib/supabase.ts` (web) + `src/lib/supabase.native.ts` (mobile)
- TypeScript

## EAS Build Configuration

`eas.json` is configured for Android + iOS:

| Profile     | Android            | iOS              | Distribution |
|-------------|--------------------|------------------|--------------|
| development | APK (debug)        | Simulator        | internal     |
| preview     | APK                | internal         | internal     |
| production  | AAB (Play Store)   | Store (App Store)| store        |

**iOS bundle ID:** `com.elite.esports.mobile`
**Android package:** `com.elite.esports.mobile`
**EAS project ID:** `0bdb1889-e4dc-43a2-94f3-aa8f825bc590`

To submit to stores, `./google-service-account.json` (Android) and Apple credentials (iOS) must be provided. These are NOT committed to the repo.

## Project Structure

```
/
├── mobile/                    # Expo mobile screens (expo-router)
│   ├── _layout.tsx            # Root layout — auth, store init
│   ├── index.tsx              # Auth redirect entry
│   ├── (auth)/                # Login, Signup, ForgotPassword, ResetPassword, VerifyEmail
│   ├── (tabs)/                # Home, Live, Leaderboard, Wallet, Profile
│   ├── match/[id].tsx         # Match detail + join/leave
│   ├── notifications.tsx      # Notifications list
│   ├── notifications/[id].tsx # Notification detail
│   ├── blocked-users.tsx      # Blocked users management
│   ├── my-matches.tsx         # User's joined tournaments
│   ├── my-team.tsx            # Team & game profiles
│   ├── settings.tsx           # App settings
│   ├── edit-profile.tsx       # Edit profile
│   ├── add-game.tsx           # Link game IGN/UID
│   ├── edit-game/[id].tsx     # Edit game profile
│   ├── tournaments.tsx        # All tournaments browser
│   ├── transactions.tsx       # Full transaction history
│   ├── profile-setup.tsx      # New user onboarding
│   ├── terms.tsx              # Terms & Conditions
│   ├── privacy.tsx            # Privacy Policy
│   ├── help.tsx               # Help Center
│   ├── about.tsx              # About page
│   └── admin/                 # Admin panel
│       ├── _layout.tsx        # Admin auth guard
│       ├── index.tsx          # Admin dashboard
│       ├── matches.tsx        # Manage tournaments
│       ├── match-form.tsx     # Create/edit tournament
│       ├── participants.tsx   # Match participants + winner selection
│       ├── users.tsx          # User management
│       ├── economy.tsx        # Approve deposits & withdrawals
│       ├── games.tsx          # Game catalog management
│       ├── campaign.tsx       # Ad campaigns
│       ├── tags.tsx           # Ad tags/codes
│       ├── settings.tsx       # Platform settings
│       ├── notifications.tsx  # Send broadcast notifications
│       ├── support.tsx        # Support tickets
│       ├── rules.tsx          # Game rules
│       ├── referrals.tsx      # Referral history
│       └── categories.tsx     # Game categories
│
├── src/
│   ├── auth/                  # Web auth pages
│   ├── app/                   # Web user pages
│   ├── admin/                 # Web admin pages
│   ├── routes/
│   │   └── AppRouter.tsx      # Web SPA router
│   ├── store/                 # Zustand stores (shared web + mobile)
│   │   ├── authStore.ts
│   │   ├── userStore.ts
│   │   ├── matchStore.ts
│   │   ├── gameStore.ts
│   │   ├── platformStore.ts
│   │   ├── notificationStore.ts
│   │   ├── bannerStore.ts
│   │   ├── campaignStore.ts
│   │   ├── categoryStore.ts
│   │   ├── adTagStore.ts
│   │   └── adEngineStore.ts
│   ├── lib/
│   │   ├── supabase.ts        # Web Supabase client
│   │   └── supabase.native.ts # Mobile Supabase client (AsyncStorage)
│   ├── theme/
│   │   └── colors.ts          # Color palette (Colors.brandPrimary = #FF6B2B)
│   └── types.ts
│
├── assets/                    # Expo assets (all 1024x1024 px)
│   ├── icon.png
│   ├── adaptive-icon.png
│   ├── splash-icon.png
│   └── favicon.png
│
├── backend/
│   ├── sql/                   # Supabase schema migrations
│   └── server.js              # Express server for production web build
│
├── index.html                 # Vite web entry
├── vite.config.ts
├── metro.config.js            # Metro bundler (@ alias, extra sourceExts)
├── babel.config.js            # babel-preset-expo + reanimated plugin
├── app.json                   # Expo config (iOS/Android ids, plugins, runtimeVersion)
├── eas.json                   # EAS build profiles (dev/preview/production)
├── expo-env.d.ts              # Expo type declarations
└── tsconfig.json              # extends expo/tsconfig.base
```

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
EXPO_PUBLIC_SUPABASE_PROJECT_ID
EXPO_PUBLIC_ADMIN_EMAIL      # Email for admin role
```

For web (Vite), these can also be set as:
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
GEMINI_API_KEY / VITE_GEMINI_API_KEY
```

## Running

```bash
npm run dev       # Vite web app → port 5000 (primary workflow)
npm run start     # Expo mobile (QR code for Expo Go)
```

## Workflows

- **Start application**: `npm run dev` → Vite on port 5000
- **Start Mobile**: Expo Metro bundler on port 8081

## Key Design Notes

- Web and mobile use the **same Zustand stores** and Supabase client
- Mobile uses `react-native-safe-area-context` — all screens wrap with `useSafeAreaInsets()`
- Admin screens guard with `useUserStore().isAdmin` + redirect to `/(auth)/login` or `/(tabs)` if unauthorized
- Color theme at `src/theme/colors.ts` — `Colors.appBg = #0a0a0f`, `Colors.brandPrimary = #FF6B2B`
- `mobile/_layout.tsx` initializes: fetchMatches, fetchGames, fetchBanners, fetchCampaigns, fetchCategories, fetchSettings on mount
- `supabase.native.ts` uses AsyncStorage for session persistence on mobile
- `vite.config.ts` excludes `.local/**` from file watching to prevent Replit state files from triggering reloads
- Assets must be 1024×1024 px for Expo EAS builds (already resized)
- React pinned to 19.1.0 to match Expo SDK 54 expected version

## Supabase Tables

- `profiles` — user data (username, coins, rank, bio, phone, role, is_admin)
- `matches` — tournament data
- `match_participants` — joined players per match
- `game_profiles` — user IGN/UID per game
- `transactions` — deposit/withdrawal/win/entry records
- `notifications` — push notification records
- `platform_settings` — UPI ID, fees, feature toggles
- `teams` / `team_members` — squad management
- `blocked_users` — user block relationships
- `referrals` — referral tracking
- `ad_tags` — ad tag codes and placements
- `campaigns` — ad campaign configurations
