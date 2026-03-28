// ---------------------------------------------------------------------------
// Supabase project credentials
//
// These are PUBLIC client-side keys (EXPO_PUBLIC_ prefix = intentionally
// embedded in the app bundle). They are safe to commit and version-control.
//
// The Supabase anon key only grants access enforced by Row-Level Security
// (RLS) policies on the database — it is NOT a secret.
//
// If you transfer this codebase to another environment or AI tool, these
// values are already here — no manual setup required. The Supabase client
// will connect automatically using these defaults.
// ---------------------------------------------------------------------------

export const SUPABASE_CONFIG = {
  url: 'https://azxhcalksgudjemwjekd.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6eGhjYWxrc2d1ZGplbXdqZWtkIiwi' +
    'cm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDIwNzQsImV4cCI6MjA5MDE3ODA3NH0.' +
    '8W-p9qUIxiVoD1452BDb8iIYrSScM9RbfRqMLtTRS58',
  projectId: 'azxhcalksgudjemwjekd',
} as const;
