'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, MessageSquare, FileText, Shield, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePi } from '@/components/pi-provider'
import { getMyTeams, type Team } from '@/lib/api'
import { type Lang } from '@/lib/i18n'

const initials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

export function TeamWorkspace({ language = 'en' }: { language?: Lang }) {
  const pi = usePi()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const list = pi.profile ? await getMyTeams(pi.profile.id) : []
      if (active) { setTeams(list); setLoading(false) }
    })()
    return () => { active = false }
  }, [pi.profile])

  if (!pi.isAuthenticated) {
    return (
      <div className="text-center py-10 space-y-3">
        <Users className="h-10 w-10 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {language === 'ar' ? 'سجّل الدخول عبر Pi للوصول إلى مساحات الفرق.' : 'Sign in with Pi to access team workspaces.'}
        </p>
        <Button onClick={() => pi.signIn()} disabled={pi.loading}>
          <Shield className="h-4 w-4 mr-2" />{language === 'ar' ? 'الدخول عبر Pi' : 'Sign in with Pi'}
        </Button>
      </div>
    )
  }

  if (loading) {
    return <div className="py-10 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <Users className="h-10 w-10 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {language === 'ar' ? 'لست عضواً في أي فريق بعد. تُنشأ الفرق للمشاريع المعتمدة.' : 'You are not part of any team yet. Teams are created for approved projects.'}
        </p>
      </div>
    )
  }

  const team = teams[0]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{team.name}</CardTitle>
              <CardDescription>{language === 'ar' ? 'مساحة آمنة لتطوير المشروع' : 'Secure workspace for project development'}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">
              {team.members.length} {language === 'ar' ? 'عضو' : 'members'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">{language === 'ar' ? 'الأعضاء' : 'Team'}</TabsTrigger>
          <TabsTrigger value="documents">{language === 'ar' ? 'المستندات' : 'Documents'}</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-3 mt-4">
          {team.members.map((member, idx) => (
            <Card key={idx}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage src={member.avatar || undefined} alt={member.name} />
                      <AvatarFallback>{initials(member.name)}</AvatarFallback>
                    </Avatar>
                    {member.online && <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm truncate">{member.name}</p>
                      {member.verified && <Shield className="h-3.5 w-3.5 text-accent flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                  </div>
                  <Button size="sm" variant="outline" className="bg-transparent">
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />{language === 'ar' ? 'محادثة' : 'Chat'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="space-y-3 mt-4">
          {team.documents.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">{language === 'ar' ? 'لا مستندات بعد.' : 'No documents yet.'}</div>
          ) : (
            team.documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.size || ''} • {new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                    <Button size="sm" variant="outline" className="bg-transparent">{language === 'ar' ? 'عرض' : 'View'}</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
