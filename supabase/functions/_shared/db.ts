import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import type { PiUser } from "./pi.ts"

// Service-role client. Bypasses RLS — only ever used inside Edge Functions
// AFTER the caller's Pi token has been verified.
export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  )
}

export interface Profile {
  id: string
  pi_uid: string
  username: string
  avatar_url: string | null
  role: "user" | "admin" | "founder"
  verified: boolean
}

// Fetch the profile for a verified Pi user, creating a minimal one if needed.
export async function ensureProfile(db: SupabaseClient, pi: PiUser): Promise<Profile> {
  const { data: existing } = await db
    .from("profiles")
    .select("id, pi_uid, username, avatar_url, role, verified")
    .eq("pi_uid", pi.uid)
    .maybeSingle()
  if (existing) return existing as Profile

  const { data, error } = await db
    .from("profiles")
    .insert({ pi_uid: pi.uid, username: pi.username })
    .select("id, pi_uid, username, avatar_url, role, verified")
    .single()
  if (error) throw error
  return data as Profile
}

export function publicSettings(s: any) {
  return {
    ai_monitor: Boolean(s?.ai_monitor),
    ai_assistant: Boolean(s?.ai_assistant),
    ai_operator: Boolean(s?.ai_operator),
    ai_analytics_core: Boolean(s?.ai_analytics_core),
    live_streaming_enabled: Boolean(s?.live_streaming_enabled),
  }
}
