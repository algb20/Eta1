// pi-login — verify a Pi access token, upsert the profile, bootstrap the
// founder (the first account to sign in, unless ETA_FOUNDER_PI_UID is set).
import { verifyPiToken } from "../_shared/pi.ts"
import { serviceClient, publicSettings } from "../_shared/db.ts"
import { json, preflight } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight()
  try {
    const token = req.headers.get("x-pi-token") ?? ""
    const pi = await verifyPiToken(token)
    const db = serviceClient()

    let { data: settings } = await db.from("platform_settings").select("*").eq("id", 1).single()
    const { data: existing } = await db
      .from("profiles").select("*").eq("pi_uid", pi.uid).maybeSingle()

    let role: string = existing?.role ?? "user"
    let verified: boolean = existing?.verified ?? false

    const pinnedFounder = Deno.env.get("ETA_FOUNDER_PI_UID") || settings?.founder_pi_uid

    if (pinnedFounder && pinnedFounder === pi.uid) {
      role = "founder"; verified = true
    } else if (!pinnedFounder) {
      // Bootstrap: the very first sign-in claims the founder role.
      role = "founder"; verified = true
      await db.from("platform_settings")
        .update({ founder_pi_uid: pi.uid, updated_at: new Date().toISOString() }).eq("id", 1)
      await db.from("activity_logs").insert({
        action: `Founder account established (@${pi.username})`, actor: pi.username,
      })
      settings = { ...(settings ?? {}), founder_pi_uid: pi.uid }
    }

    const { data: profile, error } = await db
      .from("profiles")
      .upsert({ pi_uid: pi.uid, username: pi.username, role, verified }, { onConflict: "pi_uid" })
      .select("id, pi_uid, username, avatar_url, bio, role, verified")
      .single()
    if (error) throw error

    return json({ profile, settings: publicSettings(settings) })
  } catch (e) {
    return json({ error: (e as Error).message }, 401)
  }
})
