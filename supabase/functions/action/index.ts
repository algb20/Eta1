// action — authenticated user actions. Every call verifies the Pi token first.
import { verifyPiToken } from "../_shared/pi.ts"
import { serviceClient, ensureProfile } from "../_shared/db.ts"
import { json, preflight } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight()
  try {
    const token = req.headers.get("x-pi-token") ?? ""
    const pi = await verifyPiToken(token)
    const db = serviceClient()
    const me = await ensureProfile(db, pi)
    const body = await req.json().catch(() => ({}))

    switch (body.action) {
      case "like": {
        const pid = String(body.projectId)
        const { data: existing } = await db.from("project_likes")
          .select("project_id").eq("project_id", pid).eq("user_id", me.id).maybeSingle()
        let liked: boolean
        if (existing) {
          await db.from("project_likes").delete().eq("project_id", pid).eq("user_id", me.id)
          liked = false
        } else {
          await db.from("project_likes").insert({ project_id: pid, user_id: me.id })
          liked = true
        }
        const { count } = await db.from("project_likes")
          .select("*", { count: "exact", head: true }).eq("project_id", pid)
        const likes = count ?? 0
        await db.from("projects").update({ likes }).eq("id", pid)
        return json({ liked, likes })
      }

      case "follow": {
        const pid = String(body.projectId)
        const { data: existing } = await db.from("project_follows")
          .select("project_id").eq("project_id", pid).eq("follower_id", me.id).maybeSingle()
        let following: boolean
        if (existing) {
          await db.from("project_follows").delete().eq("project_id", pid).eq("follower_id", me.id)
          following = false
        } else {
          await db.from("project_follows").insert({ project_id: pid, follower_id: me.id })
          following = true
        }
        return json({ following })
      }

      case "submit_project": {
        const name = String(body.name ?? "").trim()
        if (!name) return json({ error: "Project name is required" }, 400)
        const { data, error } = await db.from("projects").insert({
          owner_id: me.id,
          author_name: me.username,
          author_avatar: me.avatar_url,
          name,
          name_ar: body.nameAr ?? null,
          description: body.description ?? null,
          description_ar: body.descriptionAr ?? null,
          field: body.field ?? "Clean Energy",
          stage: body.stage ?? "Research",
          classification: "Undocumented",
          status: "pending",
          impact: 50,
          sustainability: 50,
          carbon: Math.abs(Number(body.carbon ?? 0)) || 0,
          water_saved: Math.abs(Number(body.waterSaved ?? 0)) || 0,
          energy_generated: Math.abs(Number(body.energyGenerated ?? 0)) || 0,
          video_url: body.videoUrl ?? null,
        }).select("id").single()
        if (error) throw error
        await db.from("activity_logs").insert({
          action: `New project submitted: ${name}`, actor: me.username,
        })
        return json({ id: data.id })
      }

      default:
        return json({ error: "Unknown action" }, 400)
    }
  } catch (e) {
    return json({ error: (e as Error).message }, 400)
  }
})
