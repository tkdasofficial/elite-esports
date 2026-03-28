import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Credential resolution
// All three values are read exclusively from environment variables so that
// the connection works automatically in any environment (Replit, CI, local)
// as long as the variables are set.  Never hard-code credentials here.
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabaseProjectId = process.env.EXPO_PUBLIC_SUPABASE_PROJECT_ID;

// Validate on module load so failures are obvious and immediate
if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
  throw new Error(
    '[Supabase] EXPO_PUBLIC_SUPABASE_URL is not set or is still the placeholder value.\n' +
    'Set it in your .env file or in the environment secrets panel.'
  );
}

if (!supabaseAnonKey || supabaseAnonKey === 'placeholder_anon_key') {
  throw new Error(
    '[Supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY is not set or is still the placeholder value.\n' +
    'Set it in your .env file or in the environment secrets panel.'
  );
}

// ---------------------------------------------------------------------------
// Secure session storage — uses SecureStore on native, localStorage on web
// ---------------------------------------------------------------------------
const ExpoSecureStoreAdapter = {
  getItem: (key: string): string | null | Promise<string | null> => {
    if (Platform.OS === 'web') {
      try { return localStorage.getItem(key); } catch { return null; }
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string): void | Promise<void> => {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch {}
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string): void | Promise<void> => {
    if (Platform.OS === 'web') {
      try { localStorage.removeItem(key); } catch {}
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// ---------------------------------------------------------------------------
// Supabase client — single shared instance for the entire app
// ---------------------------------------------------------------------------
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Convenience exports so other modules don't need to re-read env vars
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_PROJECT_ID = supabaseProjectId ?? supabaseUrl.split('.')[0].replace('https://', '');
