// Global Radar — pulls real, live signals from public sources in the Eta
// domain (clean energy, sustainability, climate tech, materials…).
//
// Source: Hacker News (Algolia) Search API — free, key-less and CORS-enabled,
// so it works directly from the browser / Pi Browser. Additional sources can
// be added to SOURCES without touching the UI.

export interface RadarItem {
  id: string
  title: string
  url: string
  source: string
  topic: string
  points: number
  author: string | null
  createdAt: string
  score: number // relevance/impact heuristic (0-100)
}

// Rotating domain queries so the radar surfaces fresh, varied signals.
export const RADAR_TOPICS = [
  "clean energy",
  "carbon capture",
  "renewable energy",
  "sustainability",
  "climate tech",
  "green hydrogen",
  "battery storage",
  "recycling technology",
  "solar",
  "desalination",
]

function heuristicScore(points: number, createdAtMs: number): number {
  const ageHours = Math.max(1, (Date.now() - createdAtMs) / 3.6e6)
  // Gravity-decayed popularity, normalised to 0-100.
  const raw = (points + 1) / Math.pow(ageHours + 2, 0.6)
  return Math.max(1, Math.min(100, Math.round(raw * 6)))
}

async function fetchTopic(topic: string, signal?: AbortSignal): Promise<RadarItem[]> {
  const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(
    topic,
  )}&tags=story&hitsPerPage=8`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`radar source ${res.status}`)
  const data = await res.json()
  const hits: any[] = Array.isArray(data?.hits) ? data.hits : []
  return hits
    .filter((h) => (h.title || h.story_title) && (h.url || h.story_url))
    .map((h) => {
      const createdMs = (h.created_at_i ? h.created_at_i * 1000 : Date.parse(h.created_at)) || Date.now()
      const points = Number(h.points ?? 0)
      return {
        id: String(h.objectID),
        title: String(h.title || h.story_title),
        url: String(h.url || h.story_url),
        source: hostOf(String(h.url || h.story_url)),
        topic,
        points,
        author: h.author ?? null,
        createdAt: new Date(createdMs).toISOString(),
        score: heuristicScore(points, createdMs),
      } as RadarItem
    })
}

function hostOf(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "")
  } catch {
    return "web"
  }
}

/**
 * Fetch a fresh batch of global signals. Picks a few rotating topics, merges,
 * de-duplicates and ranks by the impact heuristic.
 */
export async function fetchRadar(count = 3, signal?: AbortSignal): Promise<RadarItem[]> {
  const start = Math.floor(Date.now() / 3.6e6) % RADAR_TOPICS.length
  const topics = Array.from({ length: count }, (_, i) => RADAR_TOPICS[(start + i) % RADAR_TOPICS.length])
  const batches = await Promise.allSettled(topics.map((tp) => fetchTopic(tp, signal)))
  const seen = new Set<string>()
  const items: RadarItem[] = []
  for (const b of batches) {
    if (b.status !== "fulfilled") continue
    for (const it of b.value) {
      const key = it.url
      if (seen.has(key)) continue
      seen.add(key)
      items.push(it)
    }
  }
  if (items.length === 0 && batches.every((b) => b.status === "rejected")) {
    throw new Error("All radar sources failed")
  }
  return items.sort((a, b) => b.score - a.score).slice(0, 30)
}
