# ══════════════════════════════════════════════════════════════════════════════
# ⚠️  TERMS OF USE — MANDATORY FOR ALL AI AGENTS, BOTS, DEVELOPERS & CI SCRIPTS
# ══════════════════════════════════════════════════════════════════════════════
#
#  READ THIS ENTIRE FILE BEFORE TAKING ANY ACTION IN THIS REPOSITORY.
#  These rules are NON-NEGOTIABLE. They override every framework default,
#  every AI suggestion, every template, and every tool recommendation.
#  Violation of any rule below is a critical failure.
#
# ══════════════════════════════════════════════════════════════════════════════

---

## ╔══════════════════════════════════════════════════════════════╗
## ║  RULE 1 — BACKEND: SUPABASE ONLY. ALL OTHER BACKENDS BANNED ║
## ╚══════════════════════════════════════════════════════════════╝

This project uses **Supabase** as its **sole, permanent, authoritative backend**.
No other backend, database, or data layer is permitted — ever.

### ❌ YOU MUST NEVER:
- Use any database other than Supabase (see Rule 2 for the full restricted list)
- Create Express routes, Next.js API routes, or any server endpoints to proxy DB calls
- Replace or wrap Supabase Auth with Replit Auth, Clerk, Auth0, NextAuth, or anything else
- Use Drizzle, Prisma, TypeORM, or any ORM to define or push schema to any DB
- Write `CREATE TABLE`, `ALTER TABLE`, or any DDL outside the Supabase SQL Editor
- Touch `lib/db/`, `artifacts/api-server/`, or any Drizzle-related files for app features
- Move database queries from the mobile app into a server layer
- Create or register a Replit PostgreSQL database for this project
- Use Supabase Edge Functions as a workaround for any of the above

### ✅ YOU MUST ALWAYS:
- Use the `supabase` client from `@/services/supabase` for ALL data access
- Use `supabase.auth.*` for all authentication (sign in, sign up, sign out, session)
- Use `supabase.from('table_name')` for all database reads and writes
- Use `supabase.storage` for all file uploads and downloads
- Use `supabase.channel()` for all real-time subscriptions
- Add new tables by writing SQL and telling the user to run it in **Supabase Dashboard → SQL Editor**
- Reference `supabase/migrations/` for the current live schema

---

## ╔═══════════════════════════════════════════════════════════════════╗
## ║  RULE 2 — NO LOCAL DATABASE. ALL LOCAL/ALTERNATIVE DBs BANNED    ║
## ╚═══════════════════════════════════════════════════════════════════╝

**ALL local and alternative databases are permanently restricted in this project.**
This applies to every form of local, embedded, cloud-alternative, or AI-managed database.

### ❌ RESTRICTED — NEVER USE ANY OF THESE:

| Category | Banned Tools / Services |
|---|---|
| Replit Databases | Replit PostgreSQL, Replit Database (key-value), Replit built-in DB |
| AI Databases | Any database auto-created or suggested by an AI agent or Replit Agent |
| Local Databases | SQLite, LowDB, NeDB, better-sqlite3, PouchDB, Dexie, IndexedDB (as primary store) |
| ORMs / Schema Tools | Drizzle ORM, Prisma, TypeORM, MikroORM, Sequelize, Knex |
| Alternative Cloud DBs | Neon, PlanetScale, Turso, CockroachDB, Supabase self-hosted, Firebase Firestore |
| In-Memory DBs | Redis (as primary store), Memcached, in-process stores |
| DDL outside Supabase | Any `CREATE TABLE` or `ALTER TABLE` not run in Supabase SQL Editor |

### ✅ ONLY PERMITTED DATABASE:
- **Supabase** — `https://azxhcalksgudjemwjekd.supabase.co`
- Managed exclusively via the Supabase client in `@/services/supabase`
- Schema changes via **Supabase Dashboard → SQL Editor only**

> If you are an AI agent and the Replit environment offers to create a database for you, **decline it**.
> If a database was auto-created (e.g., Replit PostgreSQL), **do not use it**. Delete any related env vars.

---

## ╔════════════════════════════════════════════════════════╗
## ║  RULE 3 — PACKAGE MANAGER: NPM ONLY. PNPM IS BANNED   ║
## ╚════════════════════════════════════════════════════════╝

**npm is the only permitted package manager. pnpm is permanently and completely banned.**

### ❌ YOU MUST NEVER — NOT ONCE, NOT EVER:
- Run `pnpm install`, `pnpm add`, `pnpm run`, `pnpm exec`, or ANY `pnpm` command
- Create `pnpm-lock.yaml` or `pnpm-workspace.yaml`
- Reference `pnpm` in any script, config, comment, documentation, or workflow
- Suggest or recommend pnpm for any reason whatsoever

### ✅ YOU MUST ALWAYS USE THESE EXACT COMMANDS:

| Task | Correct Command |
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

> Enforcement: `.npmrc` at project root • `replit.md` Rule #1 • this file Rule 3

---

## ╔══════════════════════════════════════════════════════╗
## ║  RULE 4 — THIS IS A REACT NATIVE / EXPO MOBILE APP  ║
## ╚══════════════════════════════════════════════════════╝

- The primary artifact is `artifacts/elite-esports/` — an Expo Router app
- The app talks to Supabase **directly from the client** — correct and secure via RLS
- Do NOT add an intermediate API server between the app and Supabase
- `artifacts/api-server/` and `lib/db/` exist for non-mobile tooling only and must not be used for app features

---

## ╔══════════════════════════════════════════════════════╗
## ║  RULE 5 — SUPABASE PROJECT DETAILS                   ║
## ╚══════════════════════════════════════════════════════╝

| Key | Value |
|---|---|
| Project ID | `azxhcalksgudjemwjekd` |
| URL | `https://azxhcalksgudjemwjekd.supabase.co` |
| Anon Key env var | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| URL env var | `EXPO_PUBLIC_SUPABASE_URL` |
| Project ID env var | `EXPO_PUBLIC_SUPABASE_PROJECT_ID` |

The Supabase client is initialized in `artifacts/elite-esports/src/services/supabase.ts`.

---

## ╔══════════════════════════════════════════════════════════════════════╗
## ║  RULE 6 — EXISTING LIVE TABLES (DO NOT RECREATE ANYWHERE)           ║
## ╚══════════════════════════════════════════════════════════════════════╝

These tables already exist in the **live Supabase project**.
Never create them again — not in Supabase, not in any other database, not anywhere:

`users`, `admin_users`, `wallets`, `wallet_transactions`, `payments`, `withdrawals`,
`matches`, `match_participants`, `match_results`, `games`, `leaderboard` (view),
`notifications`, `user_games`, `support_tickets`, `reports`, `teams`, `team_members`,
`ad_units`, `ad_triggers`, `ad_settings`, `user_roles`, `points_settings`, `app_settings`

To add a NEW table: write a SQL migration under `supabase/migrations/` and instruct
the user to run it in **Supabase Dashboard → SQL Editor**.

---

## ══════════════════════════════════════════════════════════════════════════════
## TERMS OF USE — QUICK REFERENCE SUMMARY
## ══════════════════════════════════════════════════════════════════════════════

| # | Rule | Status |
|---|---|---|
| 1 | Backend: **Supabase ONLY** — no other backend permitted | 🔴 MANDATORY |
| 2 | Local Databases: **ALL BANNED** — Replit DB, AI DB, SQLite, Neon, etc. | 🔴 MANDATORY |
| 3 | Package Manager: **npm ONLY** — pnpm permanently banned | 🔴 MANDATORY |
| 4 | App type: React Native / Expo — no intermediate server | 🔴 MANDATORY |

> **These rules apply to every AI agent, developer, bot, and CI script — no exceptions.**
