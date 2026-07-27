'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, Home, Leaf, Settings, Filter, TrendingUp, Shield, FlaskConical, Video, FileText, Users, BarChart3, Lock, Upload, Eye, ArrowUpDown, PlayCircle, Heart, Share2, HelpCircle, Activity, LogOut, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { AdminDashboard } from '@/components/admin-dashboard'
import { ProjectUpload } from '@/components/project-upload'
import { TeamWorkspace } from '@/components/team-workspace'
import { OnboardingHelp } from '@/components/onboarding-help'
import { MarketingIntelligence } from '@/components/marketing-intelligence'
import { RadarFeed } from '@/components/radar-feed'
import { SettingsDialog } from '@/components/settings-dialog'
import { PiProvider, usePi } from '@/components/pi-provider'
import { LanguageSwitcher } from '@/components/language-switcher'
import { TranslateEngineMount, storedLang } from '@/components/translate-engine'
import { FIELDS } from '@/lib/config'
import { t, type Lang } from '@/lib/i18n'
import { dictLangFor, isRtl } from '@/lib/languages'
import {
  getProjects, getPlatformStats, logEvent, incrementView, toggleLike, toggleFollow,
  type Project, type PlatformStats,
} from '@/lib/api'

const getClassificationColor = (c: string) => {
  switch (c) {
    case 'Official': return 'bg-accent/20 text-accent border-accent/30'
    case 'Safe': return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'Experimental': return 'bg-warning/20 text-warning border-warning/30'
    case 'Undocumented': return 'bg-red-500/20 text-red-400 border-red-500/30'
    default: return 'bg-muted text-muted-foreground'
  }
}

const initials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

function EtaApp() {
  const { toast } = useToast()
  const pi = usePi()

  const [currentLang, setCurrentLang] = useState<string>('en')
  const language: Lang = dictLangFor(currentLang)
  const direction: 'rtl' | 'ltr' = isRtl(currentLang) ? 'rtl' : 'ltr'

  const [activeTab, setActiveTab] = useState('discover')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterField, setFilterField] = useState('all')
  const [sortBy, setSortBy] = useState<'impact' | 'sustainability' | 'reliability'>('impact')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showTeamWorkspace, setShowTeamWorkspace] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showMarketing, setShowMarketing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loadingProjects, setLoadingProjects] = useState(true)

  const tr = useCallback((k: Parameters<typeof t>[1]) => t(language, k), [language])

  // Restore persisted language + first-run onboarding.
  useEffect(() => {
    setCurrentLang(storedLang())
    if (typeof window !== 'undefined' && !localStorage.getItem('eta_onboarded')) setShowOnboarding(true)
  }, [])

  // Apply language direction to the document.
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = currentLang
    document.documentElement.dir = direction
  }, [currentLang, direction])

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true)
    const list = await getProjects()
    setProjects(list)
    setStats(await getPlatformStats(list))
    setLoadingProjects(false)
  }, [])

  useEffect(() => {
    loadProjects()
    logEvent('page_view', { path: '/' })
  }, [loadProjects])

  // -------- Hardware / browser BACK button handling -----------------------
  // Prevents the Pi Browser back button from exiting the app: it closes any
  // open overlay, then returns to the home tab, then (double-press) exits.
  const backState = useRef({ overlayOpen: false, closeAll: () => {}, tab: 'discover' })
  backState.current = {
    overlayOpen:
      selectedProject !== null || showAdmin || showUpload || showTeamWorkspace ||
      showMarketing || showOnboarding || filtersOpen || showSettings,
    closeAll: () => {
      setSelectedProject(null); setShowAdmin(false); setShowUpload(false)
      setShowTeamWorkspace(false); setShowMarketing(false); setShowOnboarding(false)
      setFiltersOpen(false); setShowSettings(false)
    },
    tab: activeTab,
  }
  const lastBackPress = useRef(0)
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.history.pushState({ eta: true }, '')
    const onPop = () => {
      const s = backState.current
      if (s.overlayOpen) { s.closeAll(); window.history.pushState({ eta: true }, ''); return }
      if (s.tab !== 'discover') { setActiveTab('discover'); window.history.pushState({ eta: true }, ''); return }
      const now = Date.now()
      if (now - lastBackPress.current < 2000) {
        window.history.back() // allow the platform to leave the app
      } else {
        lastBackPress.current = now
        toast({ title: t(dictLangFor(storedLang()), 'pressBackAgain') })
        window.history.pushState({ eta: true }, '')
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return projects
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q) || (p.nameAr ?? '').includes(searchQuery)
        const matchesField = filterField === 'all' || p.field === filterField
        return matchesSearch && matchesField
      })
      .sort((a, b) => {
        if (sortBy === 'impact') return b.impact - a.impact
        if (sortBy === 'sustainability') return b.sustainability - a.sustainability
        const rel = (p: Project) => {
          let s = 0
          if (p.classification === 'Official') s += 40
          else if (p.classification === 'Safe') s += 30
          else if (p.classification === 'Experimental') s += 20
          if (p.verified) s += 30
          return s
        }
        return rel(b) - rel(a)
      })
  }, [projects, searchQuery, filterField, sortBy])

  const followingProjects = useMemo(() => projects.filter((p) => pi.myFollows.has(p.id)), [projects, pi.myFollows])
  const trendingProjects = useMemo(() => [...projects].sort((a, b) => b.likes - a.likes).slice(0, 5), [projects])

  const handleConnect = useCallback(async () => { await pi.signIn() }, [pi])

  useEffect(() => { if (pi.error) toast({ title: pi.error, variant: 'destructive' }) }, [pi.error, toast])
  useEffect(() => {
    if (pi.isAuthenticated && pi.profile) logEvent('pi_authentication', { status: 'connected' }, pi.profile.pi_uid)
  }, [pi.isAuthenticated, pi.profile])

  const requireAuth = useCallback(() => {
    if (!pi.isAuthenticated) { toast({ title: tr('signInRequired') }); return false }
    return true
  }, [pi.isAuthenticated, toast, tr])

  const handleLike = useCallback(async (project: Project) => {
    if (!requireAuth() || !pi.token) return
    const wasLiked = pi.myLikes.has(project.id)
    pi.setLiked(project.id, !wasLiked)
    setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, likes: Math.max(0, p.likes + (wasLiked ? -1 : 1)) } : p))
    try {
      const { liked, likes } = await toggleLike(project.id, pi.token)
      pi.setLiked(project.id, liked)
      setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, likes } : p))
      logEvent('project_like', { projectId: project.id, liked }, pi.profile?.pi_uid)
    } catch (e: any) {
      pi.setLiked(project.id, wasLiked)
      setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, likes: Math.max(0, p.likes + (wasLiked ? 1 : -1)) } : p))
      toast({ title: e?.message || 'Action failed', variant: 'destructive' })
    }
  }, [requireAuth, pi, toast])

  const handleFollow = useCallback(async (project: Project) => {
    if (!requireAuth() || !pi.token) return
    const wasFollowing = pi.myFollows.has(project.id)
    pi.setFollowing(project.id, !wasFollowing)
    try {
      const { following } = await toggleFollow(project.id, pi.token)
      pi.setFollowing(project.id, following)
      logEvent('project_follow', { projectId: project.id, following }, pi.profile?.pi_uid)
    } catch (e: any) {
      pi.setFollowing(project.id, wasFollowing)
      toast({ title: e?.message || 'Action failed', variant: 'destructive' })
    }
  }, [requireAuth, pi, toast])

  const handleShare = useCallback(async (project: Project) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/?project=${project.id}`
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({ title: project.name, url })
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url)
      }
      toast({ title: tr('shared'), description: tr('shareDesc') })
    } catch { /* cancelled */ }
    logEvent('project_share', { projectId: project.id }, pi.profile?.pi_uid)
  }, [toast, tr, pi.profile])

  const openVideo = useCallback((project: Project) => {
    setSelectedProject(project)
    incrementView(project.id)
    logEvent('project_view', { projectId: project.id }, pi.profile?.pi_uid)
  }, [pi.profile])

  const name = (p: Project) => (language === 'ar' && p.nameAr ? p.nameAr : p.name)
  const desc = (p: Project) => (language === 'ar' && p.descriptionAr ? p.descriptionAr : p.description)

  const totalCarbon = stats?.co2Saved ?? 0

  return (
    <div className="min-h-screen bg-background pb-24" dir={direction}>
      {/* Auth banner */}
      {!pi.isAuthenticated && (
        <Alert className="m-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/30 shadow-sm">
          <Lock className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <span className="text-sm font-medium">{tr('secureAccess')}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{tr('signInToUnlock')}</p>
            </div>
            <Button size="sm" className="ml-2 shadow-md" disabled={pi.loading} onClick={handleConnect}>
              <Shield className="h-3 w-3 mr-1.5" />
              {pi.loading ? tr('connecting') : tr('connect')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/98 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-primary shadow-lg">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-none">Eta</h1>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{tr('tagline')}</p>
            </div>
            <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-500 border-green-500/30 text-[10px] h-5">
              <Activity className="h-2.5 w-2.5 mr-1 animate-pulse" />
              {tr('live')}
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            {pi.isAuthenticated && pi.profile && (
              <div className="hidden sm:flex items-center gap-1.5 mr-1">
                <Avatar className="h-7 w-7 border border-border">
                  <AvatarImage src={pi.profile.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">{initials(pi.profile.username)}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium max-w-[80px] truncate">{pi.profile.username}</span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={() => setShowOnboarding(true)} className="bg-transparent">
              <HelpCircle className="h-5 w-5" />
            </Button>

            <LanguageSwitcher current={currentLang} />

            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="bg-transparent"><Filter className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side={direction === 'rtl' ? 'left' : 'right'}>
                <SheetHeader>
                  <SheetTitle>{tr('filtersSorting')}</SheetTitle>
                  <SheetDescription>{tr('advancedOptions')}</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{tr('sortBy')}</label>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="impact">{tr('impactScore')}</SelectItem>
                        <SelectItem value="sustainability">{tr('sustainability')}</SelectItem>
                        <SelectItem value="reliability">{tr('reliability')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{tr('field')}</label>
                    <Select value={filterField} onValueChange={setFilterField}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{tr('allFields')}</SelectItem>
                        {FIELDS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">{tr('quickActions')}</p>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" onClick={() => { setFiltersOpen(false); setShowUpload(true) }}>
                        <Upload className="h-3.5 w-3.5 mr-2" />{tr('submitProject')}
                      </Button>
                      {pi.isAdmin && (
                        <>
                          <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" onClick={() => { setFiltersOpen(false); setShowAdmin(true) }}>
                            <Shield className="h-3.5 w-3.5 mr-2" />{tr('adminDashboard')}
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" onClick={() => { setFiltersOpen(false); setShowMarketing(true) }}>
                            <TrendingUp className="h-3.5 w-3.5 mr-2" />{tr('marketingAI')}
                          </Button>
                        </>
                      )}
                      {pi.isAuthenticated && (
                        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" onClick={() => pi.signOut()}>
                          <LogOut className="h-3.5 w-3.5 mr-2" />{tr('signOut')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon" className="bg-transparent" onClick={() => setShowSettings(true)}><Settings className="h-5 w-5" /></Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
            <Input
              type="search"
              placeholder={tr('searchPlaceholder')}
              className="pl-10 rtl:pl-3 rtl:pr-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (e.target.value.length > 2) logEvent('search', { query: e.target.value }, pi.profile?.pi_uid)
              }}
            />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Eye className="h-3.5 w-3.5 text-accent" />} label={tr('totalViews')} value={(stats?.totalViews ?? 0).toLocaleString()} tone="accent" />
          <StatCard icon={<Leaf className="h-3.5 w-3.5 text-green-500" />} label={tr('co2Saved')} value={totalCarbon.toLocaleString()} badge={tr('kgReduced')} tone="green" />
          <StatCard icon={<TrendingUp className="h-3.5 w-3.5 text-yellow-500" />} label={tr('engagements')} value={(stats?.engagements ?? 0).toLocaleString()} tone="yellow" />
          <StatCard icon={<Shield className="h-3.5 w-3.5 text-blue-500" />} label={tr('piUsers')} value={(stats?.piUsers ?? 0).toLocaleString()} badge={tr('verified')} tone="blue" />
        </div>

        <Card className="bg-card/50 border-dashed">
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-primary shadow-md">
                    <Leaf className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div>
                    <span className="font-bold text-base">Eta Platform</span>
                    <p className="text-[10px] text-muted-foreground">{tr('officialHub')}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
                  <Shield className="h-3 w-3 mr-1" />Pi Network
                </Badge>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">{tr('platformDesc')}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">{tr('multiLanguage')}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{tr('vrReady')}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{tr('teamWorkspaces')}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{tr('liveStreaming')}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{tr('aiPowered')}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{tr('blockchainLogs')}</span>
                </div>
                <span className="text-muted-foreground font-mono">v1.0.0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-dashed">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">{tr('sortedBy')}: <span className="font-medium text-foreground capitalize">{sortBy}</span></span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{tr('optionalBrowse')}</p>
                </div>
              </div>
              <Badge variant="outline">{filteredProjects.length} {tr('projects')}</Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="discover">{tr('discover')}</TabsTrigger>
            <TabsTrigger value="trending">{tr('trending')}</TabsTrigger>
            <TabsTrigger value="following">{tr('following')}</TabsTrigger>
            <TabsTrigger value="radar"><Globe className="h-3.5 w-3.5 mr-1" />{tr('radar')}</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="mt-4 space-y-4">
            {loadingProjects ? (
              <div className="text-center py-12 text-muted-foreground">{tr('loadingProjects')}</div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12"><p className="text-muted-foreground">{tr('noProjects')}</p></div>
            ) : (
              filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} displayName={name(project)} displayDesc={desc(project)}
                  liked={pi.myLikes.has(project.id)} following={pi.myFollows.has(project.id)}
                  onLike={() => handleLike(project)} onFollow={() => handleFollow(project)}
                  onShare={() => handleShare(project)} onWatch={() => openVideo(project)} tr={tr} />
              ))
            )}
          </TabsContent>

          <TabsContent value="trending" className="mt-4 space-y-4">
            {trendingProjects.map((project) => (
              <Card key={project.id} className="overflow-hidden hover:border-accent/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <CardTitle className="text-base">{name(project)}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">{desc(project)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{project.likes} {tr('supporters')}</span>
                    <Badge variant="outline" className={getClassificationColor(project.classification)}>{project.classification}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="following" className="mt-4 space-y-4">
            {!pi.isAuthenticated ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">{tr('connectToFollow')}</p>
                <Button onClick={handleConnect} disabled={pi.loading}>
                  <Shield className="h-4 w-4 mr-2" />{tr('signInWithPi')}
                </Button>
              </div>
            ) : followingProjects.length === 0 ? (
              <div className="text-center py-12"><p className="text-muted-foreground">{tr('followingEmpty')}</p></div>
            ) : (
              followingProjects.map((project) => (
                <ProjectCard key={project.id} project={project} displayName={name(project)} displayDesc={desc(project)}
                  liked={pi.myLikes.has(project.id)} following={pi.myFollows.has(project.id)}
                  onLike={() => handleLike(project)} onFollow={() => handleFollow(project)}
                  onShare={() => handleShare(project)} onWatch={() => openVideo(project)} tr={tr} />
              ))
            )}
          </TabsContent>

          <TabsContent value="radar" className="mt-4">
            <RadarFeed language={language} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <Dialog open={showOnboarding} onOpenChange={(o) => { setShowOnboarding(o); if (!o && typeof window !== 'undefined') localStorage.setItem('eta_onboarded', '1') }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Welcome to Eta</DialogTitle>
          <OnboardingHelp onComplete={() => { setShowOnboarding(false); if (typeof window !== 'undefined') localStorage.setItem('eta_onboarded', '1') }} />
        </DialogContent>
      </Dialog>

      <Dialog open={showAdmin} onOpenChange={setShowAdmin}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tr('platformAdmin')}</DialogTitle>
            <DialogDescription>{tr('adminSub')}</DialogDescription>
          </DialogHeader>
          <AdminDashboard onChanged={loadProjects} />
        </DialogContent>
      </Dialog>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">{tr('submitInnovation')}</DialogTitle>
          <ProjectUpload language={language} onSubmitted={() => { setShowUpload(false); loadProjects() }} />
        </DialogContent>
      </Dialog>

      <Dialog open={showTeamWorkspace} onOpenChange={setShowTeamWorkspace}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tr('teamCollab')}</DialogTitle>
            <DialogDescription>{tr('teamSub')}</DialogDescription>
          </DialogHeader>
          <TeamWorkspace language={language} />
        </DialogContent>
      </Dialog>

      <Dialog open={showMarketing} onOpenChange={setShowMarketing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tr('marketingTitle')}</DialogTitle>
            <DialogDescription>{tr('marketingSub')}</DialogDescription>
          </DialogHeader>
          <MarketingIntelligence stats={stats} />
        </DialogContent>
      </Dialog>

      <Dialog open={selectedProject !== null} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{tr('projectVideo')}</DialogTitle>
            <DialogDescription>{selectedProject ? name(selectedProject) : tr('watchInnovation')}</DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {selectedProject?.videoUrl && /^https:\/\//i.test(selectedProject.videoUrl) ? (
              <iframe
                src={selectedProject.videoUrl}
                className="w-full h-full"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                referrerPolicy="no-referrer"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={selectedProject.name}
              />
            ) : (
              <div className="text-center space-y-2 p-6">
                <PlayCircle className="h-16 w-16 mx-auto text-accent" />
                <p className="text-sm text-muted-foreground">{tr('noVideo')}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/98 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-lg">
        <div className="grid grid-cols-4 gap-1 px-2 py-2.5">
          <NavButton active={activeTab === 'discover'} icon={<Home className="h-5 w-5" />} label={tr('home')} onClick={() => { setActiveTab('discover'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
          <NavButton active={showAdmin} icon={<BarChart3 className="h-5 w-5" />} label={tr('analytics')} onClick={() => { if (pi.isAdmin) setShowAdmin(true); else toast({ title: tr('signInRequired') }) }} />
          <NavButton active={showTeamWorkspace} icon={<Users className="h-5 w-5" />} label={tr('teams')} onClick={() => setShowTeamWorkspace(true)} />
          <NavButton active={showUpload} icon={<Upload className="h-5 w-5" />} label={tr('upload')} onClick={() => setShowUpload(true)} />
        </div>
      </nav>

      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        language={language}
        currentLang={currentLang}
        onOpenAdmin={() => { if (pi.isAdmin) setShowAdmin(true) }}
      />

      <TranslateEngineMount />
      <Toaster />
    </div>
  )
}

function StatCard({ icon, label, value, badge, tone }: { icon: React.ReactNode; label: string; value: string; badge?: string; tone: 'accent' | 'green' | 'yellow' | 'blue' }) {
  const tones: Record<string, string> = {
    accent: 'from-accent/10 to-primary/5 border-accent/20',
    green: 'from-green-500/10 to-green-600/5 border-green-500/20',
    yellow: 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/20',
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
  }
  const text: Record<string, string> = { accent: 'text-accent', green: 'text-green-500', yellow: 'text-yellow-500', blue: 'text-blue-500' }
  const bgs: Record<string, string> = { accent: 'bg-accent/20', green: 'bg-green-500/20', yellow: 'bg-yellow-500/20', blue: 'bg-blue-500/20' }
  return (
    <Card className={`bg-gradient-to-br ${tones[tone]} hover:shadow-md transition-shadow`}>
      <CardContent className="pt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${bgs[tone]}`}>{icon}</div>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          <div className={`text-2xl font-bold ${text[tone]}`}>{value}</div>
          {badge && <Badge variant="outline" className={`text-[10px] ${bgs[tone]} ${text[tone]} border-current`}>{badge}</Badge>}
        </div>
      </CardContent>
    </Card>
  )
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className={`bg-transparent ${active ? 'text-accent' : 'text-muted-foreground'}`} onClick={onClick}>
      <div className="flex flex-col items-center gap-1">{icon}<span className="text-xs">{label}</span></div>
    </Button>
  )
}

function ProjectCard({ project, displayName, displayDesc, liked, following, onLike, onFollow, onShare, onWatch, tr }: {
  project: Project; displayName: string; displayDesc: string | null; liked: boolean; following: boolean
  onLike: () => void; onFollow: () => void; onShare: () => void; onWatch: () => void
  tr: (k: Parameters<typeof t>[1]) => string
}) {
  return (
    <Card className="overflow-hidden hover:border-accent/50 transition-all hover:shadow-lg duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={project.authorAvatar || undefined} alt={project.author} />
              <AvatarFallback>{initials(project.author)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium truncate">{project.author}</p>
                {project.verified && <Shield className="h-3.5 w-3.5 text-accent flex-shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground">{project.field}</p>
            </div>
          </div>
          <Badge variant="outline" className={getClassificationColor(project.classification)}>{project.classification}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <CardTitle className="text-base mb-1.5">{displayName}</CardTitle>
          <CardDescription className="text-sm leading-relaxed">{displayDesc}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {project.hasVideo && <Badge variant="secondary" className="text-xs"><Video className="h-3 w-3 mr-1" />{tr('video')}</Badge>}
          {project.hasDocuments && <Badge variant="secondary" className="text-xs"><FileText className="h-3 w-3 mr-1" />{tr('docs')}</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{tr('impact')}</span><span className="font-medium">{project.impact}%</span></div>
            <Progress value={project.impact} className="h-1.5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{tr('sustainability')}</span><span className="font-medium">{project.sustainability}%</span></div>
            <Progress value={project.sustainability} className="h-1.5 [&>div]:bg-green-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
          <Metric color="text-green-500" value={`${Math.abs(project.carbon).toLocaleString()}`} unit="kg CO₂" />
          {project.waterSaved > 0 && <Metric color="text-blue-500" value={project.waterSaved.toLocaleString()} unit="L H₂O" />}
          {project.energyGenerated > 0 && <Metric color="text-yellow-500" value={project.energyGenerated.toLocaleString()} unit="kWh" />}
          <div className="flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">{project.stage}</span></div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-4">
        <div className="space-y-2 w-full">
          <div className="flex items-center gap-2">
            {project.hasVideo && (
              <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={onWatch}>
                <PlayCircle className="h-3.5 w-3.5 mr-1.5" />{tr('watch')}
              </Button>
            )}
            <Button variant="outline" size="sm" className={`flex-1 bg-transparent ${following ? 'text-accent border-accent/40' : ''}`} onClick={onFollow}>
              <Shield className="h-3.5 w-3.5 mr-1.5" />{following ? tr('following') : tr('follow')}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className={`flex-1 bg-transparent ${liked ? 'text-red-500 border-red-500/40' : ''}`} onClick={onLike}>
              <Heart className={`h-3.5 w-3.5 mr-1.5 ${liked ? 'fill-current' : ''}`} />{project.likes}
            </Button>
            <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={onShare}>
              <Share2 className="h-3.5 w-3.5 mr-1.5" />{tr('share')}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

function Metric({ color, value, unit }: { color: string; value: string; unit: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Leaf className={`h-3.5 w-3.5 ${color}`} />
      <span className="text-xs"><span className={`font-medium ${color}`}>{value}</span><span className="text-muted-foreground ml-0.5">{unit}</span></span>
    </div>
  )
}

export default function Page() {
  return (
    <PiProvider>
      <EtaApp />
    </PiProvider>
  )
}
