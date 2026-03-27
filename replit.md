# Elite eSports — Replit Project

## Overview
A professional React Native Expo mobile app (Android-first, web-previewed) for competitive eSports tournaments. Package: `com.elite.esports.android`, version 1.0.0. Built with Expo Router, Supabase backend, and a fully modular feature-based architecture.

## Project Structure
```
/                              # Root — all config files live here
├── src/                       # All application source code
│   ├── app/                   # Expo Router pages (root: "src" in app.json)
│   │   ├── _layout.tsx        # Root layout — providers, fonts, navigation
│   │   ├── index.tsx          # Auth redirect → /app/(tabs) or /app/(auth)/login
│   │   ├── +not-found.tsx
│   │   ├── (auth)/            # Unauthenticated screens
│   │   │   ├── login.tsx
│   │   │   └── signup.tsx
│   │   ├── (tabs)/            # 5-tab navigation
│   │   │   ├── index.tsx      # Home — tournament list
│   │   │   ├── live.tsx       # Live matches
│   │   │   ├── leaderboard.tsx
│   │   │   ├── wallet.tsx
│   │   │   └── profile.tsx
│   │   ├── match/[id].tsx
│   │   ├── tournament/[id].tsx
│   │   ├── notifications.tsx
│   │   ├── settings.tsx
│   │   ├── edit-profile.tsx
│   │   ├── add-money.tsx
│   │   ├── withdraw.tsx
│   │   ├── transaction-history.tsx
│   │   └── support.tsx
│   ├── components/            # Shared UI components
│   │   ├── GlobalHeader.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorFallback.tsx
│   │   └── KeyboardAwareScrollViewCompat.tsx
│   ├── features/              # Domain-specific modules
│   │   ├── auth/components/
│   │   ├── home/components/ + hooks/
│   │   ├── live/components/ + hooks/
│   │   ├── leaderboard/components/ + hooks/
│   │   ├── wallet/components/
│   │   ├── profile/hooks/
│   │   └── match/components/ + hooks/
│   ├── store/                 # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── NotificationsContext.tsx
│   │   └── WalletContext.tsx
│   ├── services/
│   │   └── supabase.ts        # Supabase client
│   ├── utils/
│   │   ├── colors.ts          # Design tokens
│   │   └── types.ts           # Shared TypeScript interfaces
│   ├── hooks/                 # Global/reusable hooks
│   ├── assets/images/         # App icons, splash screens
│   ├── scripts/
│   │   └── build.js           # Production build script
│   └── lib/                   # Shared libraries
│       ├── api-client-react/  # Custom fetch + React Query hooks
│       ├── api-spec/          # OpenAPI spec (openapi.yaml)
│       ├── api-zod/           # Zod schemas
│       └── db/                # Drizzle ORM schema
├── backend/                   # Express API / Supabase integration
│   ├── app.ts
│   ├── index.ts
│   ├── lib/logger.ts
│   ├── middlewares/
│   └── routes/
├── package.json
├── tsconfig.json              # Excludes backend/ and server-only libs
├── app.json
├── eas.json                   # EAS build profiles
├── babel.config.js
├── metro.config.js
├── expo-env.d.ts
├── pnpm-workspace.yaml
└── .gitignore
```

## Path Alias
`tsconfig.json` maps `@/*` → `./src/*`. Examples:
- `@/utils/colors` → `src/utils/colors.ts`
- `@/store/AuthContext` → `src/store/AuthContext.tsx`
- `@/lib/api-client-react/src` → `src/lib/api-client-react/src/index.ts`

## Design System
- **Primary color**: `#FE4C11` (orange-red)
- **Background**: `#0A0A0A` (near-black)
- **Font**: Inter (400, 500, 600, 700 weights)
- **Theme**: Forced dark mode (`userInterfaceStyle: dark` in app.json)
- All design tokens live in `src/utils/colors.ts` → `Colors` object

## Backend (Supabase)
- URL: `EXPO_PUBLIC_SUPABASE_URL` (env var)
- Key: `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Replit secret)
- Project ID: `EXPO_PUBLIC_SUPABASE_PROJECT_ID` (env var)
- Tables: `matches`, `match_registrations`, `leaderboard`, `wallets`, `transactions`, `notifications`, `profiles`, `support_tickets`
- Auth: Email + password (Supabase Auth)
- Realtime: Used for matches feed, notifications, wallet updates

## EAS Build Profiles
- **development** — internal dev client build
- **preview** — internal APK for testing
- **production** — APK for Play Store (default)
- **production-aab** — AAB for Play Store submission

## Key Tech Decisions
- `src/app/` = Expo Router pages (expo-router `root: "src"` set in app.json)
- Route paths have `/app/` prefix: e.g. `/app/(tabs)`, `/app/(auth)/login`, `/app/match/[id]`
- `useBottomTabBarHeight` → `@react-navigation/bottom-tabs`
- `Platform.OS === 'web'` → 67px top inset, 34px bottom inset
- `expo-secure-store` → session persistence on native; localStorage adapter on web
- All currencies in Indian Rupees (₹)
- `backend/` and `src/lib/db` excluded from mobile tsconfig (server-only)

## Workflow
- `Elite eSports` — Expo dev server running from root (port 8081)
