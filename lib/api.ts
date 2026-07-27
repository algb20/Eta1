// Data-access layer for the Eta platform.
//
//  * Reads   -> Supabase (public anon key, guarded by Row Level Security)
//  * Writes  -> Supabase Edge Functions that verify the caller's Pi token
//
// When Supabase is not configured yet the module falls back to bundled demo
// data so the interface is never empty (useful for previews).

import { supabase, isSupabaseConfigured } from "./supabase"
import { EDGE, SUPABASE_ANON } from "./config"
import type { Classification } from "./config"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Profile {
  id: string
  pi_uid: string
  username: string
  avatar_url: string | null
  bio: string | null
  role: "user" | "admin" | "founder"
  verified: boolean
}

export interface Project {
  id: string
  name: string
  nameAr: string | null
  description: string | null
  descriptionAr: string | null
  field: string
  stage: string
  classification: Classification
  impact: number
  sustainability: number
  carbon: number // kg CO₂ saved (stored positive)
  waterSaved: number
  energyGenerated: number
  author: string
  authorAvatar: string | null
  authorId: string | null
  likes: number
  views: number
  verified: boolean
  hasVideo: boolean
  hasDocuments: boolean
  videoUrl: string | null
  status: string
  createdAt: string
}

export interface PlatformStats {
  totalViews: number
  co2Saved: number
  engagements: number
  piUsers: number
  activeProjects: number
}

export interface SubmitProjectInput {
  name: string
  nameAr?: string
  description?: string
  descriptionAr?: string
  field: string
  stage: string
  carbon?: number
  waterSaved?: number
  energyGenerated?: number
  videoUrl?: string
}

// ---------------------------------------------------------------------------
// Demo fallback data (used only when Supabase is not configured)
// ---------------------------------------------------------------------------

export const DEMO_PROJECTS: Project[] = [
  {
    id: "demo-1", name: "Solar Energy Harvester", nameAr: "حاصد الطاقة الشمسية",
    description: "Advanced solar panel technology with 45% efficiency improvement over traditional panels.",
    descriptionAr: "تقنية ألواح شمسية متطورة مع تحسين كفاءة بنسبة 45٪ مقارنة بالألواح التقليدية.",
    field: "Clean Energy", stage: "Production", classification: "Official",
    impact: 92, sustainability: 95, carbon: 2400, waterSaved: 15000, energyGenerated: 3500,
    author: "Dr. Sarah Chen", authorAvatar: null, authorId: null, likes: 234, views: 4200,
    verified: true, hasVideo: true, hasDocuments: true, videoUrl: null, status: "approved",
    createdAt: "2026-06-01T00:00:00Z",
  },
  {
    id: "demo-2", name: "Bio-Plastic Alternative", nameAr: "بديل البلاستيك الحيوي",
    description: "Fully biodegradable plastic made from agricultural waste, decomposes in 60 days.",
    descriptionAr: "بلاستيك قابل للتحلل بالكامل من النفايات الزراعية، يتحلل في 60 يومًا.",
    field: "Materials Science", stage: "Pilot Testing", classification: "Safe",
    impact: 88, sustainability: 90, carbon: 1800, waterSaved: 8000, energyGenerated: 0,
    author: "Ahmed Al-Rashid", authorAvatar: null, authorId: null, likes: 189, views: 3100,
    verified: true, hasVideo: true, hasDocuments: true, videoUrl: null, status: "approved",
    createdAt: "2026-06-03T00:00:00Z",
  },
  {
    id: "demo-3", name: "Carbon Capture Filter", nameAr: "مرشح التقاط الكربون",
    description: "Innovative air filtration system that captures and converts CO2 into useful materials.",
    descriptionAr: "نظام ترشيح هواء مبتكر يلتقط ويحول CO2 إلى مواد مفيدة.",
    field: "Environmental Tech", stage: "Research", classification: "Experimental",
    impact: 95, sustainability: 98, carbon: 5200, waterSaved: 0, energyGenerated: 0,
    author: "Maria Garcia", authorAvatar: null, authorId: null, likes: 412, views: 6800,
    verified: true, hasVideo: false, hasDocuments: true, videoUrl: null, status: "approved",
    createdAt: "2026-06-05T00:00:00Z",
  },
  {
    id: "demo-4", name: "Smart Grid AI", nameAr: "الذكاء الاصطناعي للشبكة الذكية",
    description: "Machine learning system optimizing energy distribution and reducing waste by 35%.",
    descriptionAr: "نظام تعلم آلي لتحسين توزيع الطاقة وتقليل الهدر بنسبة 35٪.",
    field: "AI & Energy", stage: "Production", classification: "Official",
    impact: 85, sustainability: 80, carbon: 3100, waterSaved: 0, energyGenerated: 2800,
    author: "James Kim", authorAvatar: null, authorId: null, likes: 298, views: 5100,
    verified: false, hasVideo: true, hasDocuments: false, videoUrl: null, status: "approved",
    createdAt: "2026-06-07T00:00:00Z",
  },
  {
    id: "demo-5", name: "Ocean Cleanup Drone", nameAr: "طائرة بدون طيار لتنظيف المحيطات",
    description: "Autonomous underwater drone collecting microplastics and marine debris.",
    descriptionAr: "طائرة بدون طيار تحت الماء تجمع البلاستيك الدقيق والحطام البحري.",
    field: "Ocean Conservation", stage: "Field Testing", classification: "Undocumented",
    impact: 78, sustainability: 85, carbon: 950, waterSaved: 0, energyGenerated: 0,
    author: "Lin Wei", authorAvatar: null, authorId: null, likes: 567, views: 8900,
    verified: true, hasVideo: true, hasDocuments: true, videoUrl: null, status: "approved",
    createdAt: "2026-06-09T00:00:00Z",
  },
  {
    id: "demo-6", name: "Vertical Farm System", nameAr: "نظام المزرعة العمودية",
    description: "Modular vertical farming solution using 90% less water and zero pesticides.",
    descriptionAr: "حل زراعة عمودي معياري يستخدم 90٪ أقل من الماء وبدون مبيدات.",
    field: "Agriculture", stage: "Production", classification: "Official",
    impact: 82, sustainability: 88, carbon: 1350, waterSaved: 45000, energyGenerated: 0,
    author: "Priya Patel", authorAvatar: null, authorId: null, likes: 345, views: 4600,
    verified: true, hasVideo: true, hasDocuments: true, videoUrl: null, status: "approved",
    createdAt: "2026-06-11T00:00:00Z",
  },
]

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

function mapRow(r: any): Project {
  return {
    id: r.id,
    name: r.name,
    nameAr: r.name_ar ?? null,
    description: r.description ?? null,
    descriptionAr: r.description_ar ?? null,
    field: r.field ?? "",
    stage: r.stage ?? "",
    classification: (r.classification ?? "Undocumented") as Classification,
    impact: r.impact ?? 0,
    sustainability: r.sustainability ?? 0,
    carbon: Math.abs(Number(r.carbon ?? 0)),
    waterSaved: Number(r.water_saved ?? 0),
    energyGenerated: Number(r.energy_generated ?? 0),
    author: r.author_name ?? "Anonymous",
    authorAvatar: r.author_avatar ?? null,
    authorId: r.owner_id ?? null,
    likes: r.likes ?? 0,
    views: r.views ?? 0,
    verified: Boolean(r.verified),
    hasVideo: Boolean(r.video_url),
    hasDocuments: Boolean(r.has_documents),
    videoUrl: r.video_url ?? null,
    status: r.status ?? "approved",
    createdAt: r.created_at ?? new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getProjects(): Promise<Project[]> {
  if (!supabase) return DEMO_PROJECTS
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
  if (error || !data) {
    console.warn("[Eta] getProjects failed, using demo data:", error?.message)
    return DEMO_PROJECTS
  }
  return data.map(mapRow)
}

export async function getPlatformStats(projects: Project[]): Promise<PlatformStats> {
  const base: PlatformStats = {
    totalViews: projects.reduce((s, p) => s + p.views, 0),
    co2Saved: projects.reduce((s, p) => s + Math.abs(p.carbon), 0),
    engagements: projects.reduce((s, p) => s + p.likes, 0),
    piUsers: 0,
    activeProjects: projects.length,
  }
  if (!supabase) {
    base.piUsers = 1456
    base.totalViews = base.totalViews || 24568
    return base
  }
  const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true })
  base.piUsers = count ?? 0
  return base
}

/** Project IDs the given user has liked (for showing the filled heart). */
export async function getMyLikes(profileId: string): Promise<string[]> {
  if (!supabase || !profileId) return []
  const { data } = await supabase.from("project_likes").select("project_id").eq("user_id", profileId)
  return (data ?? []).map((r: any) => r.project_id)
}

/** Project IDs the given user follows. */
export async function getMyFollows(profileId: string): Promise<string[]> {
  if (!supabase || !profileId) return []
  const { data } = await supabase.from("project_follows").select("project_id").eq("follower_id", profileId)
  return (data ?? []).map((r: any) => r.project_id)
}

// ---------------------------------------------------------------------------
// Analytics (immutable log — anonymous inserts allowed by RLS)
// ---------------------------------------------------------------------------

let sessionId = ""
function getSessionId(): string {
  if (typeof window === "undefined") return "server"
  if (sessionId) return sessionId
  sessionId = sessionStorage.getItem("eta_session_id") || `eta_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  sessionStorage.setItem("eta_session_id", sessionId)
  return sessionId
}

export async function logEvent(eventType: string, details: Record<string, any> = {}, piUid?: string | null) {
  if (typeof window !== "undefined") console.log("[Eta] event:", eventType, details)
  if (!supabase) return
  try {
    await supabase.from("analytics_events").insert({
      event_type: eventType,
      pi_uid: piUid ?? null,
      session_id: getSessionId(),
      details,
      referrer: typeof document !== "undefined" ? document.referrer : null,
    })
  } catch (e) {
    /* analytics must never break the UI */
  }
}

/** Public, unauthenticated view counter. */
export async function incrementView(projectId: string) {
  if (!supabase || projectId.startsWith("demo-")) return
  try {
    await supabase.rpc("increment_project_view", { p_project_id: projectId })
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Authenticated writes (Edge Functions verify the Pi token server-side)
// ---------------------------------------------------------------------------

async function callEdge(url: string, token: string, body: Record<string, any>) {
  if (!url) throw new Error("Backend is not configured yet.")
  const headers: Record<string, string> = { "Content-Type": "application/json", "X-Pi-Token": token }
  if (SUPABASE_ANON) {
    headers["apikey"] = SUPABASE_ANON
    headers["Authorization"] = `Bearer ${SUPABASE_ANON}`
  }
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`)
  return json
}

export async function toggleLike(projectId: string, token: string): Promise<{ liked: boolean; likes: number }> {
  const json = await callEdge(EDGE.action, token, { action: "like", projectId })
  return { liked: json.liked, likes: json.likes }
}

export async function toggleFollow(projectId: string, token: string): Promise<{ following: boolean }> {
  const json = await callEdge(EDGE.action, token, { action: "follow", projectId })
  return { following: json.following }
}

export async function submitProject(input: SubmitProjectInput, token: string): Promise<{ id: string }> {
  const json = await callEdge(EDGE.action, token, { action: "submit_project", ...input })
  return { id: json.id }
}

export interface TeamMember { name: string; role: string; avatar: string | null; verified: boolean; online: boolean }
export interface TeamDocument { id: string; name: string; size: string | null; created_at: string }
export interface Team {
  id: string
  name: string
  project_id: string | null
  members: TeamMember[]
  documents: TeamDocument[]
}

/** Teams the signed-in user belongs to. */
export async function getMyTeams(profileId: string): Promise<Team[]> {
  if (!supabase || !profileId) return []
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", profileId)
  const teamIds = (memberships ?? []).map((m: any) => m.team_id)
  if (teamIds.length === 0) return []
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, project_id, team_members(role, online, profiles(username, avatar_url, verified)), team_documents(id, name, size, created_at)")
    .in("id", teamIds)
  return (teams ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    project_id: t.project_id,
    members: (t.team_members ?? []).map((m: any) => ({
      name: m.profiles?.username ?? "Member",
      role: m.role ?? "member",
      avatar: m.profiles?.avatar_url ?? null,
      verified: Boolean(m.profiles?.verified),
      online: Boolean(m.online),
    })),
    documents: (t.team_documents ?? []).map((d: any) => ({
      id: d.id, name: d.name, size: d.size, created_at: d.created_at,
    })),
  }))
}

// ---------------------------------------------------------------------------
// Admin (founder-only Edge Function)
// ---------------------------------------------------------------------------

export interface AdminOverview {
  stats: { views: number; engagements: number; projects: number; users: number; events: number }
  pending: Project[]
  logs: { id: string; action: string; actor: string; created_at: string }[]
  settings: PlatformSettings
}

export interface PlatformSettings {
  ai_monitor: boolean
  ai_assistant: boolean
  ai_operator: boolean
  ai_analytics_core: boolean
  live_streaming_enabled: boolean
}

export async function getAdminOverview(token: string): Promise<AdminOverview> {
  const json = await callEdge(EDGE.admin, token, { action: "overview" })
  return {
    stats: json.stats,
    pending: (json.pending ?? []).map(mapRow),
    logs: json.logs ?? [],
    settings: json.settings,
  }
}

export async function adminSetProjectStatus(
  projectId: string,
  status: "approved" | "rejected",
  classification: Classification,
  token: string,
) {
  return callEdge(EDGE.admin, token, { action: "set_project_status", projectId, status, classification })
}

export async function adminToggleFeature(feature: keyof PlatformSettings, value: boolean, token: string) {
  return callEdge(EDGE.admin, token, { action: "toggle_feature", feature, value })
}

export async function adminVerifyUser(profileId: string, verified: boolean, token: string) {
  return callEdge(EDGE.admin, token, { action: "verify_user", profileId, verified })
}

export { isSupabaseConfigured }
