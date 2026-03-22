import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '') as string;
const supabasePublishableKey = (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '') as string;
export const supabaseProjectId = (process.env.EXPO_PUBLIC_SUPABASE_PROJECT_ID ?? '') as string;

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: typeof window !== 'undefined',
  },
});

export type { User, Session } from '@supabase/supabase-js';
