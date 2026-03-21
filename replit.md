# Elite Esports

A premium global esports tournament platform for live matches, leaderboards, and wallet management. Features a Google Play Store-quality dark UI with a professional indigo/purple color system.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4 (via @tailwindcss/vite plugin) — Inter font, indigo/purple brand palette, glassmorphism
- **Routing**: React Router DOM v7
- **State Management**: Zustand
- **Animations**: Motion (Framer Motion)
- **AI**: Google Gemini (@google/genai)
- **Backend/Auth/DB**: Supabase (`@supabase/supabase-js`)

## Project Structure

```
/
├── index.html          # App entry HTML
├── vite.config.ts      # Vite configuration (port 5000, allowedHosts: true)
├── tsconfig.json       # TypeScript config
├── src/
│   ├── main.tsx        # React app entry point
│   ├── App.tsx         # Root component with BrowserRouter
│   ├── index.css       # Global styles (Tailwind + Google Fonts)
│   ├── types.ts        # Shared TypeScript types
│   ├── routes/
│   │   └── AppRouter.tsx  # All routing logic + auth guard
│   ├── pages/          # Page components (Home, Leaderboard, Live, Wallet, Profile, Admin, etc.)
│   ├── components/     # Shared UI components (layout, ui, matches, etc.)
│   ├── store/          # Zustand stores (userStore, matchStore, bannerStore, gameStore)
│   └── utils/          # Helper utilities
```

## Development

The app runs on port 5000 via `npm run dev`. Vite is configured to:
- Listen on `0.0.0.0` (required for Replit preview)
- Allow all hosts (`allowedHosts: true`) for the Replit proxy
- Use port 5000

## Auth Flow (Supabase)

- `src/lib/supabase.ts` — Supabase client (uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`)
- `src/store/authStore.ts` — Zustand store for Supabase session/user state
- Auth is initialized in `App.tsx` via `supabase.auth.getSession()` + `onAuthStateChange` listener
- `AppRouter.tsx` reads from `authStore` — waits for `initialized` flag before rendering
- Auth pages: `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`
- Social login: Google OAuth + Apple OAuth (both configured in Supabase dashboard)
- Email signup: email + password only → redirects to `/verify-email` page (email link verification)
- Profile setup: done via `/edit-profile` after first login (not during signup)
- Admin detection: checks `VITE_ADMIN_EMAIL` env var or Supabase `app_metadata.role === 'admin'`

## Features

- User authentication with admin/user roles (Supabase)
- Home feed with match listings
- Live match viewer
- Leaderboard
- Wallet management
- User profile & game profiles
- My Matches & My Team pages
- Full admin panel (dashboard, matches, users, economy, games, etc.)
- Game management system: each game has a logo (for selectors) and banner (auto-used for matches)
- Page transitions with Motion animations
- Mobile-first responsive design

## Deployment

Configured as a static site deployment:
- Build: `npm run build` → outputs to `dist/`
- Served as static files

## Environment Variables

- `GEMINI_API_KEY` — Required for Gemini AI API calls (set via Replit Secrets)
- `APP_URL` — The hosted URL (optional, for self-referential links)
- `VITE_SUPABASE_URL` — Supabase project URL (set via Replit Secrets)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key (set via Replit Secrets)
- `VITE_ADMIN_EMAIL` — Email address that gets admin access (optional, can also use Supabase app_metadata.role)
