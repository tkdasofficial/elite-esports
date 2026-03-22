-- ============================================================
-- 01_extensions.sql
-- Enable required PostgreSQL extensions
-- Run this first before any other SQL files
-- ============================================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full-text search support
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Encryption helpers (used by Supabase Auth internally)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
