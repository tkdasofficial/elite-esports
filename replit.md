# Elite Esports

A premium esports tournament platform for live matches, leaderboards, and wallet management.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4 (via @tailwindcss/vite plugin)
- **Routing**: React Router DOM v7
- **State Management**: Zustand
- **Animations**: Motion (Framer Motion)
- **AI**: Google Gemini (@google/genai)

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
│   ├── store/          # Zustand stores (userStore, matchStore, bannerStore)
│   └── utils/          # Helper utilities
```

## Development

The app runs on port 5000 via `npm run dev`. Vite is configured to:
- Listen on `0.0.0.0` (required for Replit preview)
- Allow all hosts (`allowedHosts: true`) for the Replit proxy
- Use port 5000

## Features

- User authentication with admin/user roles
- Home feed with match listings
- Live match viewer
- Leaderboard
- Wallet management
- User profile & game profiles
- My Matches & My Team pages
- Full admin panel (dashboard, matches, users, economy, etc.)
- Page transitions with Motion animations
- Mobile-first responsive design

## Deployment

Configured as a static site deployment:
- Build: `npm run build` → outputs to `dist/`
- Served as static files

## Environment Variables

- `GEMINI_API_KEY` — Required for Gemini AI API calls (set via Replit Secrets)
- `APP_URL` — The hosted URL (optional, for self-referential links)
