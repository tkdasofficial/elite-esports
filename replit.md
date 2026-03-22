# Elite Esports — Mobile App

A premium competitive mobile gaming platform built with Expo + React Native for Android & iOS. Features real-money tournaments, leaderboards, wallet management, and admin controls.

## Architecture: Dual App Structure

This project runs TWO apps from the same codebase:

1. **Expo Mobile App** (primary) — `app/` directory, served via `npx expo start --port 8080`
2. **Web App** (preserved) — `src/pages/` + Vite, served via `npm run dev` on port 5000

## Tech Stack — Mobile (Expo)

- **Framework**: Expo SDK 53 + React Native 0.79
- **Navigation**: expo-router v5 (file-based routing, `app/` directory)
- **Styling**: React Native StyleSheet (no Tailwind — uses `src/theme/colors.ts`)
- **Icons**: @expo/vector-icons (Ionicons, Feather)
- **Animations**: react-native-reanimated + react-native-gesture-handler
- **State Management**: Zustand (same stores as web app — `src/store/`)
- **Backend/Auth/DB**: Supabase with AsyncStorage session persistence
- **SafeArea**: react-native-safe-area-context

## Tech Stack — Web (Vite, preserved)

- **Framework**: React 19 + TypeScript
- **Build**: Vite 6 + Tailwind CSS v4
- **Routing**: React Router DOM v7
- **Animations**: Motion (Framer Motion)

## Project Structure

```
/
├── app/                     # Expo mobile screens (expo-router)
│   ├── _layout.tsx          # Root layout (auth listener, providers)
│   ├── index.tsx            # Auth redirect entry point
│   ├── (auth)/              # Login, signup, forgot-password, etc.
│   ├── (tabs)/              # Home, Live, Leaderboard, Wallet, Profile
│   ├── match/[id].tsx       # Match details + join/leave
│   ├── admin/               # Admin panel (dashboard, matches, users, economy)
│   ├── settings.tsx
│   ├── edit-profile.tsx
│   ├── add-game.tsx
│   ├── edit-game/[id].tsx
│   ├── notifications.tsx
│   ├── tournaments.tsx
│   ├── transactions.tsx
│   ├── my-matches.tsx
│   ├── my-team.tsx
│   ├── terms.tsx / privacy.tsx / help.tsx / about.tsx
│   └── profile-setup.tsx
│
├── components/              # Shared React Native components
│   ├── MatchCard.tsx        # Tournament card with progress bar
│   └── LetterAvatar.tsx     # Letter-based avatar generator
│
├── src/
│   ├── store/               # Zustand stores (shared between web & mobile)
│   │   ├── authStore.ts     # Auth session state
│   │   ├── userStore.ts     # User profile, coins, transactions, game profiles
│   │   ├── matchStore.ts    # Tournament data with real-time Supabase
│   │   ├── gameStore.ts     # Available games list
│   │   └── platformStore.ts # Platform settings (UPI ID, etc.)
│   ├── lib/
│   │   └── supabase.ts      # Supabase client with AsyncStorage
│   ├── theme/
│   │   └── colors.ts        # Dark mode color palette
│   └── types.ts             # TypeScript types (Match, User, Game, etc.)
│
├── assets/                  # App icons & splash screens
├── app.json                 # Expo config
├── babel.config.js          # Expo babel preset + reanimated plugin
├── metro.config.js          # Metro bundler config
└── eas.json                 # EAS Build config (Android/iOS)
```

## Environment Variables

All env vars use `EXPO_PUBLIC_` prefix for mobile:

- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key
- `EXPO_PUBLIC_SUPABASE_PROJECT_ID` — Supabase project ID
- `EXPO_PUBLIC_ADMIN_EMAIL` — Email address for admin role assignment

## Running the App

```bash
# Mobile (Expo) — scan QR code with Expo Go
npx expo start --port 8080

# Web (Vite, preserved)
npm run dev
```

## Mobile Screen Map

| Route | Screen |
|-------|--------|
| `/` | Auth redirect (auto-routes to login or home) |
| `/(auth)/login` | Login (email + OAuth) |
| `/(auth)/signup` | Sign up |
| `/(auth)/forgot-password` | Password reset request |
| `/(auth)/verify-email` | Email verification prompt |
| `/profile-setup` | Username setup for new users |
| `/(tabs)` | Home tab |
| `/(tabs)/live` | Tournaments browser |
| `/(tabs)/leaderboard` | Player rankings |
| `/(tabs)/wallet` | Wallet + deposit/withdrawal |
| `/(tabs)/profile` | User profile |
| `/match/[id]` | Match details + join/leave |
| `/my-matches` | Registered tournaments |
| `/my-team` | Team & game profiles |
| `/notifications` | Notifications list |
| `/settings` | App settings |
| `/edit-profile` | Edit username, bio, phone |
| `/add-game` | Link game profile (IGN + UID) |
| `/edit-game/[id]` | Edit/remove game profile |
| `/tournaments` | All tournaments browser |
| `/transactions` | Full transaction history |
| `/admin` | Admin dashboard |
| `/admin/matches` | Manage tournaments |
| `/admin/match-form` | Create/edit tournament |
| `/admin/users` | User management + coin adjustment |
| `/admin/economy` | Approve/reject deposits & withdrawals |
| `/admin/notifications` | Broadcast notifications |

## Supabase Tables

- `profiles` — user data (username, coins, rank, bio, phone, role)
- `matches` — tournament data
- `match_participants` — joined players per match
- `game_profiles` — user IGN/UID per game
- `transactions` — deposit/withdrawal/win/entry records
- `notifications` — push notification records
- `platform_settings` — UPI ID, fees, toggles
- `teams` / `team_members` — squad management
