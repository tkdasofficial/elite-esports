# Elite eSports — Mobile App

A professional React Native (Expo) mobile app for competitive eSports tournaments. Android-first, web-previewed via Expo Router.

## Stack
- **Framework**: Expo SDK 54 + Expo Router v4 (`root: "src"`)
- **Backend**: Supabase (auth, realtime, postgres)
- **State**: React Context (Auth, Wallet, Notifications, Theme)
- **Font**: Inter (400/500/600/700 via expo-google-fonts)
- **Currency**: Indian Rupees (₹)
- **Theme**: Dark (#0A0A0A bg, #FE4C11 primary, #111111 card, #1A1A1A elevated)

## Key Design Tokens — `src/utils/colors.ts`
- `Colors.primary` = `#FE4C11`
- `Colors.background.dark` = `#0A0A0A`
- `Colors.background.card` = `#111111`
- `Colors.background.elevated` = `#1A1A1A`

## Route Structure
With `root: "src"` in app.json, ALL routes are relative to `src/app/`:
- `/(tabs)` — Home, Live, Leaderboard, Wallet, Profile
- `/(auth)/login`, `/(auth)/signup`
- `/match/[id]`
- `/notifications`, `/settings`, `/edit-profile`
- `/add-money`, `/withdraw`, `/transaction-history`
- `/support`
- **NO `/app/` prefix** in any `router.push()` calls

## Architecture — `src/`
```
src/
├── app/                     # Expo Router file-based routes
│   ├── (tabs)/              # Bottom tab screens
│   ├── (auth)/              # Login/signup screens
│   ├── _layout.tsx          # Root layout (providers, fonts, Supabase base URL)
│   └── index.tsx            # Auth redirect guard
├── components/              # Shared UI (GlobalHeader, KeyboardAwareScrollViewCompat)
├── features/                # Feature modules (home, live, match, leaderboard, profile, wallet)
│   └── <feature>/
│       ├── components/
│       └── hooks/           # Data-fetching hooks with useCallback + error state
├── services/
│   └── supabase.ts          # Supabase client + setBaseUrl
├── store/                   # React Contexts (Auth, Wallet, Notifications, Theme)
└── utils/
    ├── colors.ts            # Design tokens
    └── types.ts             # Shared TypeScript types
```

## Supabase Tables
`matches`, `match_registrations`, `leaderboard`, `wallets`, `transactions`, `notifications`, `profiles`, `support_tickets`

## Env Vars
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (secret)
- `EXPO_PUBLIC_DOMAIN` — injected by workflow, used for Supabase `setBaseUrl`

## Workflow Command
```
EXPO_PACKAGER_PROXY_URL=https://$REPLIT_EXPO_DEV_DOMAIN EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN EXPO_PUBLIC_REPL_ID=$REPL_ID REACT_NATIVE_PACKAGER_HOSTNAME=$REPLIT_DEV_DOMAIN pnpm exec expo start --localhost --port ${PORT:-8081}
```

## Known Patterns
- All data hooks use `useCallback` to prevent stale closures and re-fetches
- `useRef` pattern used in WalletContext and NotificationsContext to avoid stale user in callbacks
- `expo-clipboard@~8.0.8` used for copy-to-clipboard (correct SDK 54 version)
- `KeyboardAwareScrollViewCompat` is a cross-platform wrapper (avoids `KeyboardAvoidingView` iOS-only issues)
- Settings password change uses a cross-platform `Modal` (not `Alert.prompt` which is iOS-only)
- Profile menu "Soon" badge shown for routes not yet implemented
- Theme persisted to AsyncStorage and restored on startup

## Testing
- Web: visit the Replit preview — logs appear in browser console
- Physical device: scan QR code with Expo Go (Android)
- Metro bundler at `localhost:8081`
