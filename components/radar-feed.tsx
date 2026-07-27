"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Globe, RefreshCw, ExternalLink, Loader2, Plus, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePi } from "@/components/pi-provider"
import { fetchRadar, type RadarItem } from "@/lib/radar"
import { submitProject } from "@/lib/api"
import { t, type Lang } from "@/lib/i18n"

export function RadarFeed({ language = "en" }: { language?: Lang }) {
  const tr = (k: Parameters<typeof t>[1]) => t(language, k)
  const { toast } = useToast()
  const pi = usePi()

  const [items, setItems] = useState<RadarItem[]>([])
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "empty">("loading")
  const [promoting, setPromoting] = useState<string | null>(null)
  const ctrl = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    ctrl.current?.abort()
    const controller = new AbortController()
    ctrl.current = controller
    setStatus("loading")
    try {
      const data = await fetchRadar(3, controller.signal)
      if (controller.signal.aborted) return
      setItems(data)
      setStatus(data.length ? "ready" : "empty")
    } catch (e) {
      if (!controller.signal.aborted) setStatus("error")
    }
  }, [])

  useEffect(() => {
    load()
    return () => ctrl.current?.abort()
  }, [load])

  const promote = async (item: RadarItem) => {
    if (!pi.token) return
    setPromoting(item.id)
    try {
      await submitProject(
        {
          name: item.title.slice(0, 200),
          description: `Discovered via global radar (${item.source}). Source: ${item.url}`,
          field: "Environmental Tech",
          stage: "Research",
          videoUrl: /^https:\/\//i.test(item.url) ? item.url : undefined,
        },
        pi.token,
      )
      toast({ title: tr("submitSuccess"), description: tr("submitSuccessDesc") })
    } catch (e: any) {
      toast({ title: e?.message || "Failed", variant: "destructive" })
    } finally {
      setPromoting(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-accent" />
          <div>
            <p className="text-sm font-medium">{tr("radar")}</p>
            <p className="text-[10px] text-muted-foreground">{tr("radarSub")}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="bg-transparent" onClick={load} disabled={status === "loading"}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${status === "loading" ? "animate-spin" : ""}`} />
          {tr("refresh")}
        </Button>
      </div>

      {status === "loading" && (
        <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <span className="text-xs">{tr("radarLoading")}</span>
        </div>
      )}

      {status === "error" && (
        <div className="py-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">{tr("radarError")}</p>
          <Button size="sm" variant="outline" className="bg-transparent" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{tr("retry")}
          </Button>
        </div>
      )}

      {status === "empty" && (
        <div className="py-10 text-center text-sm text-muted-foreground">{tr("radarEmpty")}</div>
      )}

      {status === "ready" && items.map((item) => (
        <Card key={item.id} className="overflow-hidden hover:border-accent/50 transition-colors">
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium leading-snug hover:text-accent flex-1">
                {item.title}
              </a>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent shrink-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">{item.topic}</Badge>
              <Badge variant="outline" className="text-[10px]">{item.source}</Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />{item.points} {tr("points")}
              </span>
              <span className="text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={item.score} className="h-1 flex-1" />
              <span className="text-[10px] text-muted-foreground w-8 text-right">{item.score}</span>
            </div>
            {pi.isAdmin && pi.serverConnected && (
              <Button size="sm" variant="outline" className="w-full bg-transparent mt-1" disabled={promoting === item.id} onClick={() => promote(item)}>
                {promoting === item.id ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
                {tr("addAsProject")}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
