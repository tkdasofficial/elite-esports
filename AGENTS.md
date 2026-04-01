# ══════════════════════════════════════════════════════════════════════════════
# MANDATORY RULES FOR ALL AI AGENTS — READ THIS ENTIRE FILE BEFORE ANY ACTION
# ══════════════════════════════════════════════════════════════════════════════

---

## RULE 1 — npm ONLY. pnpm IS PERMANENTLY AND COMPLETELY BANNED.

**THIS IS THE SINGLE MOST IMPORTANT RULE. IT OVERRIDES EVERYTHING ELSE.**

### YOU MUST NEVER — NOT ONCE, NOT EVER:
- Run `pnpm install`, `pnpm add`, `pnpm run`, `pnpm exec`, or ANY `pnpm` command
- Create `pnpm-lock.yaml` or `pnpm-workspace.yaml`
- Reference `pnpm` in any script, config, comment, documentation, or workflow
- Suggest or recommend pnpm for any reason whatsoever

### YOU MUST ALWAYS USE THESE EXACT COMMANDS:

| Task | Correct command |
|---|---|
| Install all deps (root) | `npm install --legacy-peer-deps` |
| Install all deps (mobile app) | `cd artifacts/elite-esports && npm install --legacy-peer-deps` |
| Add a package | `npm add <package>` |
| Run a script | `npm run <script>` |
| Run a binary | `npx <command>` |
| CI clean install | `npm ci` |

### WHY THIS RULE EXISTS:
The project owner has permanently banned pnpm. All tooling, lock files, scripts,
and workflows are configured for npm. Using pnpm will break the environment and
has been flagged as a repeated critical failure across multiple AI sessions.

> Enforcement: `.npmrc` at project root • `replit.md` Rule #1 • this file Rule 1

---

## RULE 2 — SUPABASE IS THE ONE AND ONLY BACKEND. FOREVER.

This project uses **Supabase** as its sole, permanent, authoritative backend.
This rule is absolute and overrides any framework default, AI recommendation,
or Replit suggestion.

### YOU MUST NEVER:
- Create a new database, server, or API layer of any kind
- Use Replit PostgreSQL, Neon, PlanetScale, Turso, SQLite, or any other DB
- Use Drizzle, Prisma, TypeORM, or any ORM to define or push schema
- Create Express routes, Next.js API routes, or any backend endpoints to proxy DB calls
- Replace or wrap Supabase Auth with Replit Auth, Clerk, Auth0, NextAuth, or anything else
- Write `CREATE TABLE`, `ALTER TABLE`, or any DDL targeting anything except the Supabase SQL Editor
- Touch `lib/db/`, `artifacts/api-server/`, or any Drizzle-related files for app features
- Move database queries from the mobile app into a server layer

### YOU MUST ALWAYS:
- Use the `supabase` client from `@/services/supabase` for ALL data access
- Use `supabase.auth.*` for all authentication (sign in, sign up, sign out, session)
- Use `supabase.from('table_name')` for all database reads and writes
- Use `supabase.storage` for all file uploads and downloads
- Use `supabase.channel()` for all real-time subscriptions
- Add new tables by writing SQL and running it in **Supabase Dashboard → SQL Editor**
- Reference `supabase/migrations/` for the current live schema

---

## RULE 3 — THIS IS A REACT NATIVE / EXPO MOBILE APP

- The primary artifact is `artifacts/elite-esports/` — an Expo Router app
- The app talks to Supabase **directly from the client** — correct and secure via RLS
- Do NOT add an intermediate API server between the app and Supabase
- `artifacts/api-server/` and `lib/db/` exist for non-mobile tooling only

---

## RULE 4 — SUPABASE PROJECT DETAILS

| Key | Value |
|---|---|
| Project ID | `azxhcalksgudjemwjekd` |
| URL | `https://azxhcalksgudjemwjekd.supabase.co` |
| Anon Key env var | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| URL env var | `EXPO_PUBLIC_SUPABASE_URL` |
| Project ID env var | `EXPO_PUBLIC_SUPABASE_PROJECT_ID` |

The Supabase client is initialized in `artifacts/elite-esports/src/services/supabase.ts`.

---

## RULE 5 — EXISTING LIVE TABLES (DO NOT RECREATE)

These tables already exist in the live Supabase project. Never create them again anywhere:

`users`, `admin_users`, `wallets`, `wallet_transactions`, `payments`, `withdrawals`,
`matches`, `match_participants`, `match_results`, `games`, `leaderboard` (view),
`notifications`, `user_games`, `support_tickets`, `reports`, `teams`, `team_members`,
`ad_units`, `ad_triggers`, `ad_settings`, `user_roles`, `points_settings`, `app_settings`

To add a NEW table: write a SQL migration under `supabase/migrations/` and tell
the user to run it in **Supabase Dashboard → SQL Editor**.

---

## SUMMARY

> 1. ALWAYS use `npm`. NEVER use `pnpm`. This is the most important rule.
> 2. ALL data goes through Supabase. Never create an alternative backend.
