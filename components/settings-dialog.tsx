"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Shield, LogOut, Globe, BarChart3, CheckCircle2, AlertCircle } from "lucide-react"
import { usePi } from "@/components/pi-provider"
import { changeLanguage } from "@/components/translate-engine"
import { APP } from "@/lib/config"
import { t, type Lang } from "@/lib/i18n"

const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()

export function SettingsDialog({ open, onOpenChange, language, currentLang, onOpenAdmin }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  language: Lang
  currentLang: string
  onOpenAdmin: () => void
}) {
  const pi = usePi()
  const tr = (k: Parameters<typeof t>[1]) => t(language, k)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tr("settings")}</DialogTitle>
          <DialogDescription>Eta · v{APP.version}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Account */}
          <section className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{tr("account")}</p>
            {pi.isAuthenticated && pi.profile ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <Avatar className="h-11 w-11 border border-border">
                  <AvatarImage src={pi.profile.avatar_url || undefined} />
                  <AvatarFallback>{initials(pi.profile.username)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{pi.profile.username}</p>
                    {pi.profile.verified && <Shield className="h-3.5 w-3.5 text-accent" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{pi.profile.pi_uid.slice(0, 16)}…</p>
                </div>
                <Button size="sm" variant="outline" className="bg-transparent" onClick={() => { pi.signOut(); onOpenChange(false) }}>
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />{tr("signOut")}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <span className="text-sm text-muted-foreground">{tr("notSignedIn")}</span>
                <Button size="sm" disabled={pi.loading} onClick={() => pi.signIn()}>
                  <Shield className="h-3.5 w-3.5 mr-1.5" />{tr("connect")}
                </Button>
              </div>
            )}
          </section>

          {/* Language */}
          <section className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{tr("preferences")} · {tr("quickLanguage")}</p>
            <div className="flex gap-2">
              <Button size="sm" variant={currentLang === "en" ? "default" : "outline"} className={currentLang === "en" ? "" : "bg-transparent"} onClick={() => changeLanguage("en")}>English</Button>
              <Button size="sm" variant={currentLang === "ar" ? "default" : "outline"} className={currentLang === "ar" ? "" : "bg-transparent"} onClick={() => changeLanguage("ar")}>العربية</Button>
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" />{tr("moreLanguages")}</p>
          </section>

          {/* Founder tools */}
          {pi.isAdmin && (
            <section className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{tr("founderTools")}</p>
              <Button size="sm" variant="outline" className="w-full justify-start bg-transparent" onClick={() => { onOpenChange(false); onOpenAdmin() }}>
                <BarChart3 className="h-3.5 w-3.5 mr-2" />{tr("openAdmin")}
              </Button>
            </section>
          )}

          {/* About / status */}
          <section className="space-y-2 pt-1 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{tr("backend")}</span>
              {pi.serverConnected ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-1" />{tr("connected")}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 text-[10px]">
                  <AlertCircle className="h-3 w-3 mr-1" />{tr("identityOnly")}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{tr("version")}</span>
              <span className="font-mono text-muted-foreground">v{APP.version}</span>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
