<div align="center">

  <img src="assets/icon.png" alt="Elite Esports Logo" width="100" height="100" style="border-radius:24px"/>

  <h1>Elite Esports</h1>

  <p><strong>Compete · Win · Dominate</strong></p>

  <p>A premium mobile esports tournament platform for Android & iOS — live matches, real-time leaderboards, in-app wallet, and a full admin panel, all in one dark, fast, native app.</p>

  <br/>

  ![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?style=flat-square&logo=expo&logoColor=white)
  ![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=black)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
  ![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
  ![Zustand](https://img.shields.io/badge/Zustand-5-FF6B2B?style=flat-square)
  ![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Color Palette](#color-palette)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Screens](#screens)
- [EAS Builds](#eas-builds)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Elite Esports is a **premium native esports tournament platform** built with Expo and React Native. It delivers a native-grade experience with an iOS-inspired dark UI, fluid animations, and real-time Supabase data on both Android and iOS from a single codebase.

---

## Features

| Feature | Description |
|---|---|
| **Live Tournaments** | Browse, filter, and register for ongoing and upcoming matches |
| **Real-Time Leaderboard** | Global rankings fetched live from Supabase |
| **Live / Upcoming / Completed Tabs** | Filter matches by status on the Live screen |
| **In-App Wallet** | Deposit via UPI, withdraw, and track full transaction history |
| **Player Profiles** | Game profiles (IGN/UID), stats, rank, bio, and avatar |
| **Team Management** | Create or join a squad of up to 5 players |
| **Blocked Users** | Block and manage blocked players |
| **Push Notifications** | In-app notification centre with unread badge and detail view |
| **Admin Panel** | Full tournament, user, economy, ad campaign, and settings management |
| **Dark Mode** | iOS-inspired system-dark aesthetic throughout — no light mode |
| **Error Boundary** | Global React error boundary prevents full app crashes |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo SDK 54](https://expo.dev) + [React Native 0.81](https://reactnative.dev) |
| Language | [TypeScript 5.9](https://typescriptlang.org) |
| Navigation | [expo-router v6](https://expo.github.io/router) — file-based routing |
| State | [Zustand v5](https://zustand-demo.pmnd.rs) |
| Backend | [Supabase](https://supabase.com) — auth, database, real-time |
| Session Storage | [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) |
| Icons | [@expo/vector-icons](https://icons.expo.fyi) (Ionicons + Feather) |
| Animations | [react-native-reanimated 4.x](https://docs.swmansion.com/react-native-reanimated/) |
| Gestures | [react-native-gesture-handler 2.x](https://docs.swmansion.com/react-native-gesture-handler/) |
| Safe Area | [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context) |
| Build | [EAS Build](https://docs.expo.dev/build/introduction/) (APK + IPA) |

---

## Color Palette

| Role | Name | Hex |
|---|---|---|
| Brand Primary | Orange | `#FF6B2B` |
| Brand Light | Flame | `#FF8A50` |
| Live / Danger | Red | `#FF3B30` |
| Warning | Amber | `#FF9F0A` |
| Success | Green | `#30D158` |
| Accent | Cyan | `#32ADE6` |
| App Background | Deep Black | `#0a0a0f` |
| Card Surface | Dark Navy | `#141420` |
| Elevated | Navy | `#1c1c2e` |
| Surface | Dark Blue | `#1a1a2a` |
| Fill | Slate | `#252535` |

---

## Project Structure

```
elite-esports/
├── mobile/                        # All app screens (expo-router, root: mobile/)
│   ├── _layout.tsx                # Root layout — auth listener, global store init, error boundary
│   ├── index.tsx                  # Entry — auth redirect logic
│   ├── (auth)/                    # Auth screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── forgot-password.tsx
│   │   ├── reset-password.tsx
│   │   └── verify-email.tsx
│   ├── (tabs)/                    # Main tab bar
│   │   ├── index.tsx              # Home (banner carousel + match feed)
│   │   ├── live.tsx               # Live/Upcoming/Completed filter tabs
│   │   ├── leaderboard.tsx        # Real-time global rankings
│   │   ├── wallet.tsx             # Balance + deposit/withdrawal
│   │   └── profile.tsx            # User profile overview
│   ├── match/[id].tsx             # Match detail + join/leave
│   ├── notifications.tsx          # Notification list
│   ├── notifications/[id].tsx     # Notification detail
│   ├── my-matches.tsx             # User's joined tournaments
│   ├── my-team.tsx                # Team management
│   ├── blocked-users.tsx          # Blocked users list
│   ├── settings.tsx               # App settings
│   ├── edit-profile.tsx           # Edit profile (saves to Supabase)
│   ├── add-game.tsx               # Link game IGN/UID
│   ├── edit-game/[id].tsx         # Edit game profile
│   ├── tournaments.tsx            # All tournaments browser
│   ├── transactions.tsx           # Full transaction history
│   ├── profile-setup.tsx          # New user onboarding
│   ├── public-profile/[id].tsx    # View other player profiles
│   ├── about.tsx                  # About page
│   ├── help.tsx                   # Help center
│   ├── privacy.tsx                # Privacy policy
│   ├── terms.tsx                  # Terms & conditions
│   └── admin/                     # Admin panel (guarded by isAdmin)
│       ├── index.tsx              # Dashboard
│       ├── matches.tsx            # Manage tournaments
│       ├── match-form.tsx         # Create/edit tournament
│       ├── participants.tsx       # Match participants + winner selection
│       ├── users.tsx              # User management
│       ├── economy.tsx            # Approve deposits & withdrawals
│       ├── games.tsx              # Game catalog
│       ├── campaign.tsx           # Ad campaigns
│       ├── tags.tsx               # Ad tags
│       ├── settings.tsx           # Platform settings
│       ├── notifications.tsx      # Broadcast notifications
│       ├── support.tsx            # Support tickets
│       ├── rules.tsx              # Game rules
│       ├── referrals.tsx          # Referral history
│       └── categories.tsx         # Game categories
│
├── src/                           # Shared logic (stores, lib, theme, types)
│   ├── store/                     # Zustand stores
│   │   ├── authStore.ts           # Supabase session state
│   │   ├── userStore.ts           # Profile, coins, game profiles, team, transactions
│   │   ├── matchStore.ts          # Matches (fetch, create, update, delete)
│   │   ├── gameStore.ts           # Game catalog
│   │   ├── platformStore.ts       # Admin users, transactions, settings
│   │   ├── notificationStore.ts   # In-app notifications
│   │   ├── bannerStore.ts         # Home banner carousel
│   │   ├── campaignStore.ts       # Ad campaigns
│   │   ├── categoryStore.ts       # Game categories
│   │   ├── adTagStore.ts          # Ad tag management
│   │   ├── adEngineStore.ts       # Ad engine trigger logic
│   │   └── tagStore.ts            # Ad tag settings
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client (base)
│   │   └── supabase.native.ts     # Mobile client with AsyncStorage session persistence
│   ├── theme/
│   │   └── colors.ts              # Shared color palette
│   └── types.ts                   # Global TypeScript interfaces
│
├── components/                    # Shared React Native UI components
│   ├── MatchCard.tsx              # Tournament card with banner, status, progress bar
│   ├── BannerCarousel.tsx         # Auto-scrolling banner carousel
│   └── LetterAvatar.tsx           # Deterministic color avatar from username
│
├── assets/                        # App icons and splash (all 1024×1024 px)
│   ├── icon.png
│   ├── adaptive-icon.png
│   ├── splash-icon.png
│   ├── logo.png
│   └── favicon.png
│
├── app.json                       # Expo config — bundle IDs, plugins, permissions
├── eas.json                       # EAS build profiles (development / preview / production)
├── metro.config.js                # Metro bundler — @ alias, extra source extensions
├── babel.config.js                # babel-preset-expo + reanimated plugin
├── tsconfig.json                  # TypeScript config (extends expo/tsconfig.base)
└── package.json
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- [Expo Go](https://expo.dev/go) app on your Android or iOS device, **or** an Android emulator / iOS simulator

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/elite-esports.git
cd elite-esports

# 2. Install dependencies
npm install

# 3. Add your environment variables (see below)

# 4. Start the Metro bundler
npm run start
```

Scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS) to launch the app on your device.

---

## Environment Variables

Create a `.env` file in the project root (or set these in your EAS secrets):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
EXPO_PUBLIC_SUPABASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_ADMIN_EMAIL=admin@yourdomain.com
```

> All `EXPO_PUBLIC_` variables are inlined at build time and safe to expose to the client.

---

## Scripts

| Command | Description |
|---|---|
| `npm run start` | Start Metro Bundler for Expo Go development |
| `npm run android` | Run on a connected Android device or emulator |
| `npm run ios` | Run on the iOS Simulator (macOS only) |
| `npm run lint` | Run TypeScript type-checking |

---

## Screens

### User Screens
| Screen | Description |
|---|---|
| Login / Sign Up | Email auth + forgot/reset password flow |
| Profile Setup | New user username onboarding |
| Home | Banner carousel + live match feed |
| Live | Matches filtered by Live / Upcoming / Completed |
| Leaderboard | Real-time global player rankings |
| Wallet | Coin balance, UPI deposit, withdrawal requests |
| Tournaments | Full tournament browser |
| Match Detail | Match info, join/leave, participant list |
| Notifications | Notification list with unread indicator |
| Profile | Stats, game profiles, team, recent matches |
| Edit Profile | Username, bio, phone — saves to Supabase |
| My Matches | All joined tournaments |
| My Team | Create or join a squad |
| Transactions | Full deposit/withdrawal history |
| Settings | Notifications, language, privacy, blocked users |
| Blocked Users | Manage blocked player list |

### Admin Panel
| Screen | Description |
|---|---|
| Dashboard | Platform overview and quick stats |
| Matches | Create, edit, and delete tournaments |
| Participants | View entrants, select winners, distribute prizes |
| Users | Search, ban, adjust coins |
| Economy | Approve or reject deposit/withdrawal requests |
| Games | Manage game catalog |
| Categories | Manage game categories |
| Campaigns | Manage ad campaigns |
| Tags | Manage ad tags and placements |
| Notifications | Broadcast messages to all users |
| Support | View and respond to support tickets |
| Rules | Edit game rules |
| Referrals | View referral history |
| Settings | UPI ID, fees, platform toggles |

---

## EAS Builds

This project uses [EAS Build](https://docs.expo.dev/build/introduction/) for cloud builds.

| Profile | Android Output | iOS Output | Use |
|---|---|---|---|
| `development` | APK (debug) | Simulator build | Local testing |
| `preview` | APK | Ad-hoc IPA | Internal distribution |
| `production` | AAB (Play Store) | App Store IPA | Store release |

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Build preview APK (Android)
eas build --platform android --profile preview

# Build preview IPA (iOS)
eas build --platform ios --profile preview

# Production build (AAB for Play Store)
eas build --platform android --profile production

# Production build (IPA for App Store)
eas build --platform ios --profile production
```

> **Store submission:** Android requires `google-service-account.json` (not committed). iOS requires Apple credentials configured via `eas credentials`.

---

## Contributing

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/your-feature`
3. Commit your changes — `git commit -m 'feat: add your feature'`
4. Push to the branch — `git push origin feature/your-feature`
5. Open a Pull Request

Please ensure TypeScript type-checking passes (`npm run lint`) before opening a PR.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with passion for the competitive gaming community.</p>
  <p><strong>Elite Esports</strong> — Compete · Win · Dominate</p>
</div>
