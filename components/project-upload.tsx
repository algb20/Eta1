'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { usePi } from '@/components/pi-provider'
import { submitProject } from '@/lib/api'
import { FIELDS, STAGES } from '@/lib/config'
import { t, type Lang } from '@/lib/i18n'

export function ProjectUpload({ language = 'en', onSubmitted }: { language?: Lang; onSubmitted?: () => void }) {
  const { toast } = useToast()
  const pi = usePi()
  const tr = (k: Parameters<typeof t>[1]) => t(language, k)

  const [name, setName] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [description, setDescription] = useState('')
  const [descriptionAr, setDescriptionAr] = useState('')
  const [field, setField] = useState('')
  const [stage, setStage] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [carbon, setCarbon] = useState('')
  const [waterSaved, setWaterSaved] = useState('')
  const [energy, setEnergy] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!pi.isAuthenticated || !pi.token) {
      toast({ title: tr('signInRequired') })
      return
    }
    if (!name.trim()) {
      toast({ title: tr('nameRequired'), variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      await submitProject(
        {
          name: name.trim(),
          nameAr: nameAr.trim() || undefined,
          description: description.trim() || undefined,
          descriptionAr: descriptionAr.trim() || undefined,
          field: field || FIELDS[0],
          stage: stage || STAGES[0],
          videoUrl: videoUrl.trim() || undefined,
          carbon: carbon ? Number(carbon) : 0,
          waterSaved: waterSaved ? Number(waterSaved) : 0,
          energyGenerated: energy ? Number(energy) : 0,
        },
        pi.token,
      )
      toast({ title: tr('submitSuccess'), description: tr('submitSuccessDesc') })
      setName(''); setNameAr(''); setDescription(''); setDescriptionAr('')
      setField(''); setStage(''); setVideoUrl(''); setCarbon(''); setWaterSaved(''); setEnergy('')
      onSubmitted?.()
    } catch (e: any) {
      toast({ title: e?.message || 'Submission failed', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle>{tr('submitInnovation')}</CardTitle>
        <CardDescription>{tr('submitInnovationSub')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">{tr('projectName')}</Label>
            <Input id="projectName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Solar Energy Harvester" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectNameAr">{tr('projectNameAr')}</Label>
            <Input id="projectNameAr" dir="rtl" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="حاصد الطاقة الشمسية" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectDesc">{tr('description')}</Label>
          <Textarea id="projectDesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectDescAr">{tr('descriptionAr')}</Label>
          <Textarea id="projectDescAr" dir="rtl" rows={3} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{tr('field')}</Label>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger><SelectValue placeholder={tr('selectField')} /></SelectTrigger>
              <SelectContent>{FIELDS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{tr('developmentStage')}</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger><SelectValue placeholder={tr('selectStage')} /></SelectTrigger>
              <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="videoUrl">{tr('videoUrl')}</Label>
          <Input id="videoUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…" />
        </div>

        <div className="space-y-2">
          <Label>{tr('sustainabilityMetrics')}</Label>
          <div className="grid grid-cols-3 gap-2">
            <Input type="number" min="0" placeholder={tr('co2Reduced')} value={carbon} onChange={(e) => setCarbon(e.target.value)} />
            <Input type="number" min="0" placeholder={tr('waterSaved')} value={waterSaved} onChange={(e) => setWaterSaved(e.target.value)} />
            <Input type="number" min="0" placeholder={tr('energy')} value={energy} onChange={(e) => setEnergy(e.target.value)} />
          </div>
        </div>

        <div className="pt-4 space-y-2">
          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {submitting ? tr('submitting') : tr('submitForReview')}
          </Button>
          <p className="text-xs text-center text-muted-foreground">{tr('reviewNote')}</p>
        </div>
      </CardContent>
    </Card>
  )
}
