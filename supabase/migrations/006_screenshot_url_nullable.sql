-- Migration 006: Make screenshot_url nullable in payments table
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- This allows deposits to be submitted with only amount + UTR (no screenshot required).

ALTER TABLE public.payments
  ALTER COLUMN screenshot_url DROP NOT NULL;
