# Elite eSports — Replit Project

## Overview
A professional React Native Expo mobile app (Android-first, web-previewed) for competitive eSports tournaments. Package: `com.elite.esports.android`, version 1.0.0 Alpha. Built with Expo Router, Supabase backend, and a fully modular feature-based architecture.

## Project Structure (Monorepo)
```
artifacts/
  elite-esports/       # Mobile app — @workspace/elite-esports
  api-server/          # Express API server — @workspace/api-server
  mockup-sandbox/      # Vite canvas preview server — @workspace/mockup-sandbox
lib/
  api-client-react/    # Shared API client
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
│   │   ├── index.tsx             # Home — tournament list
│   │   ├── live.tsx              # Live matches
│   │   ├── leaderboard.tsx       # Rankings
│   │   ├── wallet.tsx            # Wallet & balance
│   │   └── profile.tsx           # User profile
│   ├── match/[id].tsx            # Match detail + join
│   ├── tournament/[id].tsx       # Redirects to match/[id]
│   ├── notifications.tsx
│   ├── settings.tsx
│   ├── edit-profile.tsx
│   ├── add-money.tsx
│   ├── withdraw.tsx
│   ├── transaction-history.tsx
│   └── support.tsx
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
    │   └── WalletContext.tsx     # Balance + transactions
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
- **Font**: Inter (400, 500, 600, 700 weights)
- **Theme**: Forced dark mode (`userInterfaceStyle: dark` in app.json)
- All design tokens live in `src/utils/colors.ts` → `Colors` object

## Backend (Supabase)
- URL: `EXPO_PUBLIC_SUPABASE_URL` (env secret)
- Key: `EXPO_PUBLIC_SUPABASE_ANON_KEY` (env secret)
- Tables: `matches`, `match_registrations`, `leaderboard`, `wallets`, `transactions`, `notifications`, `profiles`, `support_tickets`
- Auth: Email + password (Supabase Auth)
- Realtime: Used for matches feed, notifications, wallet updates

## Key Tech Decisions
- `useBottomTabBarHeight` → imported from `@react-navigation/bottom-tabs`
- `Platform.OS === 'web'` → 67px top inset, 34px bottom inset (proxy iframe)
- `expo-secure-store` → session persistence on native; localStorage adapter on web
- Tab layout: `isLiquidGlassAvailable()` → Native tabs on iOS 26+, Tabs component elsewhere
- All currencies in Indian Rupees (₹)

## Workflows
- `artifacts/elite-esports: expo` — Expo dev server (port from `$PORT` env)
- `artifacts/api-server: API Server` — Express on port 8080
- `artifacts/mockup-sandbox: Component Preview Server` — Vite on port 8081
