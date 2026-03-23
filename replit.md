# Elite Esports Platform

A premium competitive gaming platform — **mobile-only** (Android APK / iOS IPA) built with Expo + React Native.

## Architecture

The `src/` directory holds shared logic used by all mobile screens:
- **Zustand stores** (`src/store/`) — auth, user, match, game, platform, notifications, banners, campaigns, categories, ad engine
- **Supabase client** (`src/lib/`) — `supabase.native.ts` uses AsyncStorage for session persistence
- **Theme** (`src/theme/colors.ts`) — `Colors.appBg = #0a0a0f`, `Colors.brandPrimary = #FF6B2B`
- **Types** (`src/types.ts`) — shared TypeScript types

## Tech Stack

- Expo SDK 54 + React Native 0.81.5
- expo-router v6 (file-based routing, root: `mobile/`)
- React Native StyleSheet (uses `src/theme/colors.ts` — no Tailwind)
- @expo/vector-icons (Ionicons)
- react-native-gesture-handler, react-native-safe-area-context, react-native-reanimated
- Zustand v5 (state management)
- Supabase (auth, database, real-time)
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
│   ├── settings.tsx           # App settings (links to blocked-users)
│   ├── edit-profile.tsx       # Edit profile (saves to Supabase)
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
│   ├── store/                 # Zustand stores (mobile shared)
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
│   │   ├── supabase.ts        # Supabase client (base)
│   │   └── supabase.native.ts # Mobile Supabase client (AsyncStorage)
│   ├── theme/
│   │   └── colors.ts          # Color palette
│   ├── utils/
│   │   ├── helpers.ts
│   │   └── iconRegistry.tsx
│   └── types.ts
│
├── components/                # Shared React Native components
│   ├── MatchCard.tsx
│   ├── BannerCarousel.tsx
│   └── LetterAvatar.tsx
│
├── assets/                    # Expo assets (all 1024x1024 px)
│   ├── icon.png
│   ├── adaptive-icon.png
│   ├── splash-icon.png
│   └── favicon.png
│
├── metro.config.js            # Metro bundler (@ alias, extra sourceExts)
├── babel.config.js            # babel-preset-expo + reanimated plugin
├── app.json                   # Expo config (iOS/Android ids, plugins, runtimeVersion)
├── eas.json                   # EAS build profiles (dev/preview/production)
└── tsconfig.json              # extends expo/tsconfig.base
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
npm run start     # Expo Metro bundler (QR code for Expo Go)
npm run android   # Run on Android device/emulator
npm run ios       # Run on iOS simulator
```

## Workflows

- **Start Mobile**: Expo Metro bundler on port 8081

## Key Design Notes

- All mobile screens use `useSafeAreaInsets()` from `react-native-safe-area-context`
- Admin screens guard with `useUserStore().isAdmin` + redirect if unauthorized
- `mobile/_layout.tsx` initializes: fetchMatches, fetchGames, fetchBanners, fetchCampaigns, fetchCategories, fetchSettings on mount
- `supabase.native.ts` uses AsyncStorage for session persistence
- Assets must be 1024×1024 px for Expo EAS builds (already resized)
- Settings page links to Blocked Users page (privacy section)
- EditProfile saves directly to Supabase `profiles` table with validation

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
