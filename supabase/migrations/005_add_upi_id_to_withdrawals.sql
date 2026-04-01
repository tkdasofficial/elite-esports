-- Migration 005: Add upi_id column to withdrawals table
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to run multiple times (ADD COLUMN IF NOT EXISTS is idempotent).

ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS upi_id TEXT;
