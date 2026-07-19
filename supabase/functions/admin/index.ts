// admin — founder/admin-only management actions. Verifies the Pi token AND
// that the resolved profile has an elevated role before doing anything.
import { verifyPiToken } from "../_shared/pi.ts"
import { serviceClient, ensureProfile, publicSettings } from "../_shared/db.ts"
import { json, preflight } from "../_shared/cors.ts"

const FEATURES = ["ai_monitor", "ai_assistant", "ai_operator", "ai_analytics_core", "live_streaming_enabled"]

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight()
  try {
    const token = req.headers.get("x-pi-token") ?? ""
    const pi = await verifyPiToken(token)
    const db = serviceClient()
    const me = await ensureProfile(db, pi)
    if (me.role !== "founder" && me.role !== "admin") {
      return json({ error: "Founder access required" }, 403)
    }
    const body = await req.json().catch(() => ({}))

    switch (body.action) {
      case "overview": {
        const [{ data: projects }, { count: users }, { count: events }, { data: pending }, { data: logs }, { data: settings }] =
          await Promise.all([
            db.from("projects").select("views, likes, status").eq("status", "approved"),
            db.from("profiles").select("*", { count: "exact", head: true }),
            db.from("analytics_events").select("*", { count: "exact", head: true }),
            db.from("projects").select("*").eq("status", "pending").order("created_at", { ascending: false }),
            db.from("activity_logs").select("id, action, actor, created_at").order("created_at", { ascending: false }).limit(20),
            db.from("platform_settings").select("*").eq("id", 1).single(),
          ])
        const views = (projects ?? []).reduce((s: number, p: any) => s + (p.views ?? 0), 0)
        const engagements = (projects ?? []).reduce((s: number, p: any) => s + (p.likes ?? 0), 0)
        return json({
          stats: { views, engagements, projects: projects?.length ?? 0, users: users ?? 0, events: events ?? 0 },
          pending: pending ?? [],
          logs: logs ?? [],
          settings: publicSettings(settings),
        })
      }

      case "set_project_status": {
        const pid = String(body.projectId)
        const status = body.status === "approved" ? "approved" : "rejected"
        const classification = ["Official", "Safe", "Experimental", "Undocumented"].includes(body.classification)
          ? body.classification : "Undocumented"
        const verified = status === "approved" && (classification === "Official" || classification === "Safe")
        const { data: proj } = await db.from("projects").select("name").eq("id", pid).single()
        await db.from("projects").update({ status, classification, verified }).eq("id", pid)
        await db.from("activity_logs").insert({
          action: `Project ${status}: ${proj?.name ?? pid} (${classification})`, actor: me.username,
        })
        return json({ ok: true })
      }

      case "toggle_feature": {
        if (!FEATURES.includes(body.feature)) return json({ error: "Unknown feature" }, 400)
        await db.from("platform_settings")
          .update({ [body.feature]: Boolean(body.value), updated_at: new Date().toISOString() }).eq("id", 1)
        await db.from("activity_logs").insert({
          action: `Feature ${body.feature} ${body.value ? "enabled" : "disabled"}`, actor: me.username,
        })
        return json({ ok: true })
      }

      case "verify_user": {
        await db.from("profiles").update({ verified: Boolean(body.verified) }).eq("id", String(body.profileId))
        await db.from("activity_logs").insert({
          action: `User ${body.verified ? "verified" : "unverified"}`, actor: me.username,
        })
        return json({ ok: true })
      }

      default:
        return json({ error: "Unknown action" }, 400)
    }
  } catch (e) {
    return json({ error: (e as Error).message }, 400)
  }
})
