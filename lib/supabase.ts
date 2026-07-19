import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

/**
 * True when the Supabase project is wired up via environment variables.
 * When false the app gracefully falls back to bundled demo data so the UI is
 * never blank (useful for previews before the database is connected).
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

// A single shared browser client. Reads run against Row-Level-Security-guarded
// tables with the public anon key; writes go through Edge Functions.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { "x-eta-client": "web" } },
    })
  : null
