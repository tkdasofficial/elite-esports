import { supabase } from './supabase';

export interface WalletTransaction {
  id:          string;
  type:        'credit' | 'debit';
  amount:      number;
  status:      'pending' | 'approved' | 'rejected';
  description: string;
  created_at:  string;
}

export interface WalletData {
  balance:      number;
  transactions: WalletTransaction[];
}

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not authenticated');
  return data.user.id;
}

/**
 * Submit a deposit request.
 * Inserts a row into the `payments` table with status 'pending'.
 * An admin will review and approve/reject it.
 */
export async function submitDeposit(amount: number, utr: string): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase.from('payments').insert({
    user_id:        userId,
    amount,
    utr:            utr.trim(),
    screenshot_url: '',
    status:         'pending',
  });

  if (error) {
    throw new Error(error.message ?? 'Failed to submit deposit request');
  }
}

/**
 * Submit a withdrawal request.
 * Inserts a row into the `withdrawals` table with status 'pending'.
 * An admin will review and process it.
 */
export async function submitWithdrawal(amount: number, upi_id: string): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase.from('withdrawals').insert({
    user_id: userId,
    amount,
    upi_id:  upi_id.trim(),
    status:  'pending',
  });

  if (error) {
    throw new Error(error.message ?? 'Failed to submit withdrawal request');
  }
}
