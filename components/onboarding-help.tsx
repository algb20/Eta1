'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Upload, Eye, Heart, Users, Shield, Sparkles, CheckCircle } from 'lucide-react'

export function OnboardingHelp({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="space-y-4 p-4">
      <Card className="bg-gradient-to-br from-accent/10 to-primary/5 border-accent/20">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Sparkles className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Welcome to Eta</CardTitle>
              <CardDescription className="text-xs">Official Pi Network Innovation Platform</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 flex-shrink-0">
                <Shield className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Secure Authentication</h4>
                <p className="text-xs text-muted-foreground">Connect with your Pi Network ID for verified access</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 flex-shrink-0">
                <Search className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Discover Innovations</h4>
                <p className="text-xs text-muted-foreground">Search and filter projects by field, impact, and sustainability</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 flex-shrink-0">
                <Upload className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Submit Projects</h4>
                <p className="text-xs text-muted-foreground">Upload your innovations with videos and documentation</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 flex-shrink-0">
                <Users className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Team Collaboration</h4>
                <p className="text-xs text-muted-foreground">Work together in secure team workspaces</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 flex-shrink-0">
                <Eye className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Track Impact</h4>
                <p className="text-xs text-muted-foreground">Monitor carbon footprint and sustainability metrics</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium">Platform Features</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Badge variant="secondary" className="justify-center">Multi-language</Badge>
              <Badge variant="secondary" className="justify-center">AI Suggestions</Badge>
              <Badge variant="secondary" className="justify-center">Immutable Logs</Badge>
              <Badge variant="secondary" className="justify-center">3D/VR Ready</Badge>
            </div>
          </div>

          <Button className="w-full" onClick={onComplete}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
