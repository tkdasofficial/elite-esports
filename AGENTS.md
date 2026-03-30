# ══════════════════════════════════════════════════════════════
# MANDATORY RULES FOR ALL AI AGENTS — READ FIRST, ALWAYS
# ══════════════════════════════════════════════════════════════

## RULE 1 — SUPABASE IS THE ONE AND ONLY BACKEND. FOREVER.

This project uses **Supabase** as its sole, permanent, authoritative backend.
This rule is absolute and overrides any other suggestion, best-practice guide,
framework default, or AI recommendation.

### YOU MUST NEVER:
- Create a new database, server, or API layer of any kind
- Use Replit PostgreSQL, Neon, PlanetScale, Turso, SQLite, or any other DB
- Use Drizzle, Prisma, TypeORM, or any ORM to define or push schema
- Create Express routes, Next.js API routes, or any backend endpoints to proxy database calls
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

## RULE 2 — THIS IS A REACT NATIVE / EXPO MOBILE APP

- The primary artifact is `artifacts/elite-esports/` — an Expo Router app
- The app talks to Supabase **directly from the client** — this is correct and secure via Row Level Security (RLS)
- Do NOT add an intermediate API server between the app and Supabase
- `artifacts/api-server/` and `lib/db/` exist for non-mobile tooling only — do not wire them into the mobile app

---

## RULE 3 — SUPABASE PROJECT DETAILS

| Key | Value |
|-----|-------|
| Project ID | `azxhcalksgudjemwjekd` |
| URL | `https://azxhcalksgudjemwjekd.supabase.co` |
| Anon Key env var | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| URL env var | `EXPO_PUBLIC_SUPABASE_URL` |
| Project ID env var | `EXPO_PUBLIC_SUPABASE_PROJECT_ID` |

The Supabase client is initialized in `artifacts/elite-esports/src/services/supabase.ts`.
All config comes from `artifacts/elite-esports/src/config/supabase.config.ts`.

---

## RULE 4 — EXISTING LIVE TABLES (DO NOT RECREATE)

These tables already exist in the live Supabase project. Never create them again anywhere:

`users`, `admin_users`, `wallets`, `wallet_transactions`, `payments`, `withdrawals`,
`matches`, `match_participants`, `match_results`, `games`, `leaderboard` (view),
`notifications`, `user_games`, `support_tickets`, `reports`, `teams`, `team_members`,
`ad_units`, `ad_triggers`, `ad_settings`, `user_roles`, `points_settings`, `app_settings`

To add a NEW table: write a SQL migration file under `supabase/migrations/` and
instruct the user to run it in **Supabase Dashboard → SQL Editor**.

---

## SUMMARY (one sentence)

> Every piece of data in this app comes from and goes to Supabase — do not create, suggest, or scaffold any alternative backend, database, server, or auth system under any circumstances.

# ══════════════════════════════════════════════════════════════
