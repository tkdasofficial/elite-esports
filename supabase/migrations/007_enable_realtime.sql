-- Migration 007: Enable Supabase Realtime on wallet-related tables
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- This allows the app to receive live status updates (approved/rejected)
-- without the user having to pull-to-refresh.

ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
