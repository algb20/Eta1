'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Users, Target, Zap, Globe, Star } from 'lucide-react'
import type { PlatformStats } from '@/lib/api'

export function MarketingIntelligence({ stats }: { stats?: PlatformStats | null }) {
  const campaigns = [
    {
      name: 'Pi Network Community Outreach',
      status: 'Active',
      reach: 12400,
      engagement: 8.2,
      conversion: 5.4,
      progress: 67
    },
    {
      name: 'Innovation Showcase Series',
      status: 'Scheduled',
      reach: 8900,
      engagement: 12.5,
      conversion: 7.8,
      progress: 34
    },
    {
      name: 'Sustainability Champions',
      status: 'Active',
      reach: 15600,
      engagement: 15.3,
      conversion: 9.2,
      progress: 82
    }
  ]

  const insights = [
    {
      title: 'Optimal Posting Time',
      value: '2:00 PM - 4:00 PM UTC',
      icon: Target,
      trend: '+23% engagement'
    },
    {
      title: 'Top Performing Content',
      value: 'Video Demonstrations',
      icon: TrendingUp,
      trend: '3.2x higher retention'
    },
    {
      title: 'Growing Audience',
      value: 'Clean Energy Enthusiasts',
      icon: Users,
      trend: '+156% this month'
    },
    {
      title: 'Viral Potential',
      value: 'Carbon Tracking Features',
      icon: Zap,
      trend: '89% share rate'
    }
  ]

  const recommendations = [
    'Launch weekly innovation spotlight series on Pi Network community channels',
    'Collaborate with verified sustainability influencers for project showcases',
    'Create multilingual content targeting Arabic and Asian markets',
    'Implement referral rewards using Pi cryptocurrency for project submissions',
    'Host monthly virtual innovation demos with live Q&A sessions'
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-accent/10 to-primary/5 border-accent/20">
          <CardContent className="pt-4">
            <div className="text-[10px] text-muted-foreground">Reach (views)</div>
            <div className="text-lg font-bold text-accent">{(stats?.totalViews ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="pt-4">
            <div className="text-[10px] text-muted-foreground">Engagements</div>
            <div className="text-lg font-bold text-green-500">{(stats?.engagements ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="text-[10px] text-muted-foreground">Projects</div>
            <div className="text-lg font-bold text-blue-500">{(stats?.activeProjects ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="actions">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-3 mt-4">
          {campaigns.map((campaign, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{campaign.name}</CardTitle>
                  <Badge variant={campaign.status === 'Active' ? 'default' : 'outline'}>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground mb-1">Reach</div>
                    <div className="font-semibold">{campaign.reach.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Engagement</div>
                    <div className="font-semibold">{campaign.engagement}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Conversion</div>
                    <div className="font-semibold">{campaign.conversion}%</div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{campaign.progress}%</span>
                  </div>
                  <Progress value={campaign.progress} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="insights" className="space-y-3 mt-4">
          {insights.map((insight, idx) => {
            const Icon = insight.icon
            return (
              <Card key={idx}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1">{insight.title}</div>
                      <div className="text-sm text-muted-foreground mb-1">{insight.value}</div>
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/30">
                        {insight.trend}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="actions" className="space-y-3 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI-Powered Growth Strategy</CardTitle>
              <CardDescription className="text-xs">
                Intelligent recommendations for rapid, safe expansion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
                    <Star className="h-3.5 w-3.5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-primary/5 border-accent/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Globe className="h-8 w-8 text-accent" />
                <div>
                  <div className="text-sm font-semibold mb-1">Pi Network Integration Ready</div>
                  <p className="text-xs text-muted-foreground">
                    Platform optimized for viral growth within Pi ecosystem with built-in sharing and referral mechanics
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
