import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
export const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase environment variables. Check VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY and VITE_SUPABASE_PROJECT_ID.'
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type { User, Session } from '@supabase/supabase-js';
