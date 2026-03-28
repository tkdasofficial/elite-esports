import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { SUPABASE_CONFIG } from '../config/supabase.config';

// ---------------------------------------------------------------------------
// Credential resolution — priority order:
//   1. Environment variables (EXPO_PUBLIC_SUPABASE_URL / ANON_KEY)
//      — allows overriding per environment without touching source code
//   2. supabase.config.ts — committed defaults, always present in the
//      codebase so any environment or AI tool can build the connection
//      without any extra setup
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || SUPABASE_CONFIG.url;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_CONFIG.anonKey;

export const SUPABASE_PROJECT_ID =
  process.env.EXPO_PUBLIC_SUPABASE_PROJECT_ID || SUPABASE_CONFIG.projectId;

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

export const SUPABASE_URL = supabaseUrl;
