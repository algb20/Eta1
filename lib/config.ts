// Central runtime configuration for the Eta platform.
// All backend endpoints are derived from the Supabase project URL so that the
// database can be swapped by changing a single environment variable.

export const APP = {
  name: "Eta",
  version: "1.0.0",
  tagline: { en: "Pi Innovation Hub", ar: "مركز ابتكارات Pi" },
} as const

// Pi Network SDK options. Sandbox is enabled only when explicitly requested.
export const PI_CONFIG = {
  version: "2.0",
  sandbox: process.env.NEXT_PUBLIC_PI_SANDBOX === "true",
  // "username" is enough to identify the account. No "payments" scope: the
  // platform is deliberately free of financial transactions.
  scopes: ["username"] as string[],
} as const

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")

// Sent as the gateway apikey when calling Edge Functions (required by the
// Supabase gateway even when a function has JWT verification disabled).
export const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

// Supabase Edge Functions act as the authenticated write gateway. Each verifies
// the caller's Pi access token server-side before touching the database.
export const EDGE = {
  base: SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : "",
  // Verify a Pi token, upsert the profile, bootstrap the founder.
  login: SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/pi-login` : "",
  // Authenticated user actions (like / follow / submit project / create team…).
  action: SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/action` : "",
  // Founder-only administration actions.
  admin: SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/admin` : "",
} as const

// Fields available when submitting / filtering projects.
export const FIELDS = [
  "Clean Energy",
  "Materials Science",
  "Environmental Tech",
  "AI & Energy",
  "Ocean Conservation",
  "Agriculture",
  "Water & Sanitation",
  "Health & Bio",
] as const

export const STAGES = ["Research", "Pilot Testing", "Field Testing", "Production"] as const

export const CLASSIFICATIONS = ["Official", "Safe", "Experimental", "Undocumented"] as const

export type Field = (typeof FIELDS)[number]
export type Stage = (typeof STAGES)[number]
export type Classification = (typeof CLASSIFICATIONS)[number]
