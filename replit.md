# Elite Esports Platform

A premium competitive gaming platform with two codebases:
1. **Web app** — Vite + React (SPA, runs on port 5000 via `npm run dev`)
2. **Mobile app** — Expo + React Native (in `app/` directory, shares all `src/` stores/logic)

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
- Entry: `app/` directory via expo-router (file-based routing)
- Root layout: `app/_layout.tsx` (Supabase auth listener, global store initialization)

## Tech Stack

**Web:**
- Vite + React 18 + TypeScript
- React Router v7 (SPA mode)
- Tailwind CSS + custom variables
- Framer Motion / motion/react (animations)

**Mobile:**
- Expo SDK 54 + React Native 0.79.6
- expo-router v5 (file-based routing)
- React Native StyleSheet (uses `src/theme/colors.ts` — no Tailwind)
- @expo/vector-icons (Ionicons)
- react-native-gesture-handler, react-native-safe-area-context
- Note: react-native-reanimated v4 conflicts with Expo Go; use RN Animated API instead

**Shared:**
- Zustand (state management)
- Supabase (auth, database, real-time)
- TypeScript

## Project Structure

```
/
├── app/                       # Expo mobile screens (expo-router)
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
│       ├── index.tsx          # Admin dashboard (stats + nav)
│       ├── matches.tsx        # Manage tournaments
│       ├── match-form.tsx     # Create/edit tournament
│       ├── participants.tsx   # Match participants + winner selection
│       ├── users.tsx          # User management + coin adjustment
│       ├── economy.tsx        # Approve deposits & withdrawals
│       ├── games.tsx          # Game catalog management
│       ├── campaign.tsx       # Ad campaigns (Image/Video/Banner)
│       ├── tags.tsx           # Ad tags/codes
│       ├── settings.tsx       # Platform settings
│       ├── notifications.tsx  # Send broadcast notifications
│       ├── support.tsx        # Support tickets
│       ├── rules.tsx          # Game rules
│       ├── referrals.tsx      # Referral history
│       └── categories.tsx     # Game categories
│
├── components/                # Shared React Native components
│   ├── MatchCard.tsx
│   └── LetterAvatar.tsx
│
├── src/
│   ├── auth/                  # Web auth pages (moved from src/pages/)
│   ├── app/                   # Web user pages (moved from src/pages/)
│   ├── admin/                 # Web admin pages (moved from src/pages/)
│   ├── routes/
│   │   └── AppRouter.tsx      # Web SPA router
│   ├── store/                 # Zustand stores (shared web + mobile)
│   │   ├── authStore.ts
│   │   ├── userStore.ts
│   │   ├── matchStore.ts
│   │   ├── gameStore.ts
│   │   ├── platformStore.ts   # Settings, rules, support tickets
│   │   ├── notificationStore.ts
│   │   ├── bannerStore.ts
│   │   ├── campaignStore.ts
│   │   ├── categoryStore.ts
│   │   ├── adTagStore.ts
│   │   └── adEngineStore.ts
│   ├── components/            # Shared web components
│   ├── lib/
│   │   └── supabase.ts
│   ├── theme/
│   │   └── colors.ts          # Color palette (Colors.brandPrimary = #FF6B2B)
│   └── types.ts
│
├── index.html                 # Vite web entry
├── vite.config.ts
├── app.json                   # Expo config
├── metro.config.js
├── babel.config.js
└── eas.json
```

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
EXPO_PUBLIC_SUPABASE_PROJECT_ID
EXPO_PUBLIC_ADMIN_EMAIL      # Email for admin role
```

## Running

```bash
npm run dev   # Vite web app → port 5000 (primary workflow)
npm run web   # Expo web preview (Metro bundler)
npm run expo  # Expo mobile (QR code for Expo Go)
```

## Workflows

- **Start application**: `npm run dev` → Vite on port 5000

## Key Design Notes

- Web and mobile use the **same Zustand stores** and Supabase client
- Mobile uses `react-native-safe-area-context` — all screens wrap with `useSafeAreaInsets()`
- Admin screens guard with `useUserStore().isAdmin` + redirect to `/(auth)/login` or `/(tabs)` if unauthorized
- Color theme at `src/theme/colors.ts` — `Colors.appBg = #0a0a0f`, `Colors.brandPrimary = #FF6B2B`
- All admin screens use modals (bottom sheets via `Modal` + `animationType="slide"`) for create/edit
- `mobile/_layout.tsx` initializes: fetchMatches, fetchGames, fetchBanners, fetchCampaigns, fetchCategories, fetchSettings on mount
- Auth social providers: Google + Facebook (replaced Apple). Facebook brand color: `#1877F2`
- Mobile OAuth (Google/Facebook) not available in Expo Go — shows friendly message, email-only for preview builds
- After sign in on mobile, explicitly call `router.replace('/(tabs)')` for reliable navigation
- `(tabs)/_layout.tsx` waits for `initialized` from authStore before redirecting to login (prevents flash)
- `supabase.ts` uses `detectSessionInUrl: typeof window !== 'undefined'` — true for web (OAuth), false for mobile
- `vite.config.ts` excludes `.local/**` from file watching to prevent Replit state files from triggering reloads
- `SplashScreen.tsx` uses `useRef` for `onFinish` callback with empty dep array to prevent timer resets on re-render

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
