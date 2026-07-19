'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, Activity, Eye, Shield, Database, Sparkles, Loader2, Check, X, Video } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { usePi } from '@/components/pi-provider'
import {
  getAdminOverview, adminSetProjectStatus, adminToggleFeature,
  type AdminOverview, type PlatformSettings, type Project,
} from '@/lib/api'
import { CLASSIFICATIONS, type Classification } from '@/lib/config'

const featureLabels: { key: keyof PlatformSettings; label: string; desc: string }[] = [
  { key: 'ai_monitor', label: 'Monitor (Data Collection)', desc: 'Collects usage analytics' },
  { key: 'ai_assistant', label: 'Assistant (Suggestions)', desc: 'Recommendations only, no auto-execution' },
  { key: 'ai_operator', label: 'Operator (Classification)', desc: 'Assists classification with approval' },
  { key: 'ai_analytics_core', label: 'Analytics Core (Predictive)', desc: 'Advanced predictive analytics' },
  { key: 'live_streaming_enabled', label: 'Live Streaming', desc: 'Enable live video showcases' },
]

export function AdminDashboard({ onChanged }: { onChanged?: () => void }) {
  const { toast } = useToast()
  const pi = usePi()
  const [data, setData] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = async () => {
    if (!pi.token) { setLoading(false); return }
    setLoading(true)
    try {
      setData(await getAdminOverview(pi.token))
    } catch (e: any) {
      toast({ title: e?.message || 'Failed to load admin data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [pi.token])

  const toggleFeature = async (key: keyof PlatformSettings, value: boolean) => {
    if (!pi.token || !data) return
    setData({ ...data, settings: { ...data.settings, [key]: value } })
    try {
      await adminToggleFeature(key, value, pi.token)
    } catch (e: any) {
      setData({ ...data, settings: { ...data.settings, [key]: !value } })
      toast({ title: e?.message || 'Update failed', variant: 'destructive' })
    }
  }

  if (!pi.isAdmin) {
    return <div className="p-6 text-center text-sm text-muted-foreground">This dashboard is restricted to the platform founder.</div>
  }
  if (loading) {
    return <div className="p-10 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
  }

  const s = data?.stats
  const cards = [
    { label: 'Total Views', value: s?.views ?? 0 },
    { label: 'Engagements', value: s?.engagements ?? 0 },
    { label: 'Active Projects', value: s?.projects ?? 0 },
    { label: 'Pi Network Users', value: s?.users ?? 0 },
  ]

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
          <p className="text-xs text-muted-foreground">Founder-controlled platform management</p>
        </div>
        <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
          <Shield className="h-3 w-3 mr-1" />{pi.profile?.role === 'founder' ? 'Founder' : 'Admin'}
        </Badge>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="ai">Features</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            {cards.map((c) => (
              <Card key={c.label}>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{c.label}</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{c.value.toLocaleString()}</div></CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20"><Database className="h-4 w-4 text-accent" /></div>
              <div>
                <div className="text-sm font-medium">{(s?.events ?? 0).toLocaleString()} logged events</div>
                <p className="text-xs text-muted-foreground">Immutable analytics records</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-3 mt-4">
          {(!data?.pending || data.pending.length === 0) ? (
            <div className="text-center py-10 text-sm text-muted-foreground">No projects awaiting review.</div>
          ) : (
            data.pending.map((p) => (
              <PendingRow key={p.id} project={p} busy={busy === p.id} onDecision={async (status, classification) => {
                if (!pi.token) return
                setBusy(p.id)
                try {
                  await adminSetProjectStatus(p.id, status, classification, pi.token)
                  toast({ title: status === 'approved' ? 'Project approved' : 'Project rejected' })
                  await load()
                  onChanged?.()
                } catch (e: any) {
                  toast({ title: e?.message || 'Action failed', variant: 'destructive' })
                } finally { setBusy(null) }
              }} />
            ))
          )}
        </TabsContent>

        <TabsContent value="ai" className="space-y-3 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform Features</CardTitle>
              <CardDescription>Founder approval required for every feature</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {featureLabels.map((f) => (
                <div key={f.key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {f.key === 'live_streaming_enabled' ? <Video className="h-4 w-4 text-accent" /> : <Sparkles className="h-4 w-4 text-accent" />}
                    <div>
                      <span className="text-sm font-medium">{f.label}</span>
                      <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                  <Switch checked={Boolean(data?.settings?.[f.key])} onCheckedChange={(v) => toggleFeature(f.key, v)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-3 mt-4">
          <Card>
            <CardContent className="pt-4 space-y-2">
              {(!data?.logs || data.logs.length === 0) ? (
                <div className="text-center py-6 text-sm text-muted-foreground">No activity logged yet.</div>
              ) : (
                data.logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Activity className="h-4 w-4 text-accent mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.actor} • {new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PendingRow({ project, busy, onDecision }: {
  project: Project; busy: boolean
  onDecision: (status: 'approved' | 'rejected', classification: Classification) => void
}) {
  const [cls, setCls] = useState<Classification>('Safe')
  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{project.name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{project.author} • {project.field} • {project.stage}</p>
          {project.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Select value={cls} onValueChange={(v) => setCls(v as Classification)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{CLASSIFICATIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="sm" className="h-8" disabled={busy} onClick={() => onDecision('approved', cls)}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}Approve
          </Button>
          <Button size="sm" variant="outline" className="h-8" disabled={busy} onClick={() => onDecision('rejected', cls)}>
            <X className="h-3.5 w-3.5 mr-1" />Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
