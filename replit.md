# Elite eSports — Replit Project

## Overview
A professional React Native Expo mobile app (Android-first, web-previewed) for competitive eSports tournaments. Package: `com.elite.esports.android`, version 1.0.0 Alpha. Built with Expo Router v6, Supabase backend, and a fully modular feature-based architecture. All currencies in Indian Rupees (₹).

## Replit Environment Setup

The project runs on Replit with the Expo dev server. The workflow `Start application` starts the Expo bundler and serves the web version at port 8080.

### Environment Variables
Supabase credentials are stored in `.replit` under `[userenv.shared]` and are available as environment variables at runtime:

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Full Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous/client API key |
| `EXPO_PUBLIC_SUPABASE_PROJECT_ID` | Supabase project ID |

These are also committed as fallbacks in `artifacts/elite-esports/src/config/supabase.config.ts` so the app always connects without manual setup.

## Supabase Backend Connection

The app uses Supabase for all backend operations: authentication, database queries, realtime subscriptions, and file storage. The Replit PostgreSQL database (provisioned in the `lib/db` package) is not used by the mobile app — it exists as a Drizzle-managed database for any future server-side API needs.

The Supabase client (`artifacts/elite-esports/src/services/supabase.ts`) resolves credentials in order: environment variable → `supabase.config.ts` default.

## Project Structure (Monorepo)
```
artifacts/
  elite-esports/       # Mobile app — @workspace/elite-esports
  api-server/          # Express API server — @workspace/api-server
  mockup-sandbox/      # Vite canvas preview server — @workspace/mockup-sandbox
lib/
  api-client-react/    # Shared REST API client (NOT used by mobile app)
  api-spec/            # OpenAPI spec + orval codegen
  api-zod/             # Shared Zod schemas
  db/                  # Drizzle ORM + Replit PostgreSQL (not used by mobile app)
```

## Elite eSports Architecture

### Directory Layout
```
artifacts/elite-esports/
├── app/                          # Expo Router routes (routing only)
│   ├── _layout.tsx               # Root layout — providers, fonts, navigation
│   ├── index.tsx                 # Auth redirect (session check)
│   ├── +not-found.tsx
│   ├── (auth)/                   # Unauthenticated screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                   # 5-tab navigation
│   │   ├── _layout.tsx           # Tab bar (ClassicTabLayout Android/web, NativeTabLayout iOS26+)
│   │   ├── index.tsx             # Home — tournament list
│   │   ├── live.tsx              # Live matches
│   │   ├── leaderboard.tsx       # Rankings
│   │   ├── wallet.tsx            # Wallet & balance
│   │   └── profile.tsx           # User profile
│   ├── match/[id].tsx            # Match detail + join
│   ├── tournament/[id].tsx       # Redirects to match/[id]
│   ├── notifications.tsx
│   ├── settings.tsx              # Cross-platform password change modal
│   ├── edit-profile.tsx
│   ├── add-money.tsx
│   ├── withdraw.tsx
│   ├── transaction-history.tsx
│   └── support.tsx
│
├── eas.json                      # EAS Build profiles (development, preview, production, production-aab)
├── metro.config.js               # Monorepo-aware Metro config (watchFolders + nodeModulesPaths)
│
└── src/                          # All source modules
    ├── components/               # Shared UI components
    │   ├── GlobalHeader.tsx      # App header with logo + notif badge
    │   ├── ErrorBoundary.tsx
    │   ├── ErrorFallback.tsx
    │   └── KeyboardAwareScrollViewCompat.tsx
    │
    ├── features/                 # Domain-specific modules
    │   ├── auth/
    │   │   └── components/
    │   │       ├── AuthLogo.tsx
    │   │       └── AuthInput.tsx
    │   ├── home/
    │   │   ├── components/MatchCard.tsx
    │   │   └── hooks/useMatches.ts
    │   ├── live/
    │   │   ├── components/LiveMatchCard.tsx
    │   │   └── hooks/useLiveMatches.ts
    │   ├── leaderboard/
    │   │   ├── components/LeaderRow.tsx
    │   │   └── hooks/useLeaderboard.ts
    │   ├── wallet/
    │   │   └── components/TransactionItem.tsx
    │   ├── profile/
    │   │   └── hooks/useProfile.ts
    │   └── match/
    │       ├── components/RoomDetails.tsx
    │       └── hooks/useMatchDetail.ts
    │
    ├── hooks/                    # Global/reusable hooks (future)
    ├── services/
    │   └── supabase.ts           # Supabase client (SecureStore adapter)
    ├── store/                    # React Context providers
    │   ├── AuthContext.tsx       # Session, user, signOut
    │   ├── ThemeContext.tsx      # Dark/light theme
    │   ├── NotificationsContext.tsx
    │   └── WalletContext.tsx
    └── utils/
        ├── colors.ts             # Design tokens (Colors object)
        └── types.ts              # Shared TypeScript interfaces
```

### Path Alias
`tsconfig.json` maps `@/*` → `./src/*`. So:
- `@/utils/colors` → `src/utils/colors.ts`
- `@/store/AuthContext` → `src/store/AuthContext.tsx`
- `@/features/home/hooks/useMatches` → `src/features/home/hooks/useMatches.ts`
- `@/components/GlobalHeader` → `src/components/GlobalHeader.tsx`

## Design System
- **Primary color**: `#FE4C11` (orange-red)
- **Background**: `#0A0A0A` (near-black)
- **Font**: Inter (400, 500, 600, 700 weights via @expo-google-fonts/inter)
- **Theme**: Forced dark mode (`userInterfaceStyle: dark` in app.json)
- All design tokens live in `src/utils/colors.ts` → `Colors` object

## Backend (Supabase)
- URL: `EXPO_PUBLIC_SUPABASE_URL` = `https://azxhcalksgudjemwjekd.supabase.co`
- Key: `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Tables: `matches`, `match_registrations`, `leaderboard`, `wallets`, `transactions`, `notifications`, `profiles`, `support_tickets`, `games`, `users`, `admin_users`, `payments`, `withdrawals`, `user_games`, `team_members`, `teams`, `match_participants`
- Auth: Email + password (Supabase Auth)
- Realtime: Used for matches feed, notifications, wallet updates (channels namespaced with `user.id`)
- Storage: `game-banners` bucket for game banner images

## EAS Build Profiles (`eas.json`)
| Profile | Type | Output | Use |
|---|---|---|---|
| `development` | internal | debug APK | Testing with dev client |
| `preview` | internal | APK | Internal testing |
| `production` | store | APK | Play Store (APK) |
| `production-aab` | store | AAB | Play Store (recommended) |

## Key Tech Decisions
- `useBottomTabBarHeight` → imported from `@react-navigation/bottom-tabs` (^7.4.0, peer of expo-router)
- `Platform.OS === 'web'` → 67px top inset, 34px bottom inset (proxy iframe)
- `expo-secure-store` → session persistence on native; localStorage adapter on web
- Tab layout: `isLiquidGlassAvailable()` → Native tabs on iOS 26+, Tabs component elsewhere
- Android tab background: solid `#0A0A0A` `View` (no null return from tabBarBackground)
- Settings password change: cross-platform `Modal` + `TextInput` (replaced iOS-only `Alert.prompt`)
- React Compiler enabled (`experiments.reactCompiler: true` in app.json)

## Workflows
- `Start application` — Expo dev server for `@workspace/elite-esports` (port from `$PORT` env, default 8080)
