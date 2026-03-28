# Elite eSports — Replit Project

## Overview
A professional React Native Expo mobile app (Android-first, web-previewed) for competitive eSports tournaments. Package: `com.elite.esports.android`, version 1.0.0 Alpha. Built with Expo Router v6, Supabase backend, and a fully modular feature-based architecture. All currencies in Indian Rupees (₹).

## Project Structure (Monorepo)
```
artifacts/
  elite-esports/       # Mobile app — @workspace/elite-esports
  api-server/          # Express API server — @workspace/api-server
  mockup-sandbox/      # Vite canvas preview server — @workspace/mockup-sandbox
lib/
  api-client-react/    # Shared REST API client (NOT used by mobile app)
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
    │   │   └── hooks/useProfile.ts  # Fixed: loading resets when userId is undefined
    │   └── match/
    │       ├── components/RoomDetails.tsx
    │       └── hooks/useMatchDetail.ts
    │
    ├── hooks/                    # Global/reusable hooks (future)
    ├── services/
    │   └── supabase.ts           # Supabase client (SecureStore adapter, graceful missing-URL handling)
    ├── store/                    # React Context providers
    │   ├── AuthContext.tsx       # Session, user, signOut
    │   ├── ThemeContext.tsx      # Dark/light theme
    │   ├── NotificationsContext.tsx  # Fixed: useCallback + stable useMemo deps
    │   └── WalletContext.tsx     # Fixed: useCallback + stable useMemo deps
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
- URL: `EXPO_PUBLIC_SUPABASE_URL` = `https://azxhcalksgudjemwjekd.supabase.co` (shared env var)
- Key: `EXPO_PUBLIC_SUPABASE_ANON_KEY` (secret)
- Tables: `matches`, `match_registrations`, `leaderboard`, `wallets`, `transactions`, `notifications`, `profiles`, `support_tickets`
- Auth: Email + password (Supabase Auth)
- Realtime: Used for matches feed, notifications, wallet updates (channels namespaced with `user.id`)

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
- `@workspace/api-client-react` removed from mobile app — screens use Supabase directly
- React Compiler enabled (`experiments.reactCompiler: true` in app.json)

## Bugs Fixed
1. **`useProfile`**: Loading state now resets to `false` when `userId` is undefined (prevented infinite spinner)
2. **`settings.tsx`**: `Alert.prompt` (iOS-only) replaced with cross-platform `Modal` + `TextInput` password dialog
3. **`WalletContext`**: `fetchWallet` wrapped in `useCallback`, stable `useMemo` deps eliminate stale closures
4. **`NotificationsContext`**: `fetchNotifications`, `markAsRead`, `markAllAsRead` wrapped in `useCallback`, stable deps
5. **`(tabs)/_layout.tsx`**: `tabBarBackground` now returns solid `View` on Android (no `null`)
6. **`supabase.ts`**: `setItem`/`removeItem` now return `SecureStore` promises; graceful fallback if env vars missing
7. **`app/_layout.tsx`**: Removed unused `@workspace/api-client-react` import and `setBaseUrl` call
8. **Realtime channels**: Namespaced with `user.id` (`wallet-${user.id}`, `notifications-${user.id}`) to prevent channel collisions

## Workflows
- `artifacts/elite-esports: expo` — Expo dev server (port from `$PORT` env)
- `artifacts/api-server: API Server` — Express on port 8080
- `artifacts/mockup-sandbox: Component Preview Server` — Vite canvas preview
