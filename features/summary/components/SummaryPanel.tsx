'use client'

import { useState } from 'react'
import { Sparkles, Lightbulb, Coins, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import type { SummaryData } from '../types'

interface SummaryPanelProps {
  summary: SummaryData | null
  isGenerating: boolean
  error: string | null
  onGenerate: () => void
  disabled?: boolean
}

export function SummaryPanel({
  summary,
  isGenerating,
  error,
  onGenerate,
  disabled,
}: SummaryPanelProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!summary) return
    try {
      const textToCopy = `${summary.summary}\n\nInsights:\n${summary.insights.map(i => `• ${i}`).join('\n')}`
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      toast.success('Resumo copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Erro ao copiar')
    }
  }
  if (!summary && !isGenerating) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="p-6 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Gerar resumo e insights</p>
            <p className="text-xs text-muted-foreground mt-1">
              Use IA para extrair os pontos principais
            </p>
          </div>
          <Button onClick={onGenerate} disabled={disabled}>
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar Resumo
          </Button>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isGenerating) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Gerando resumo...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Separator />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Resumo
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Coins className="w-3 h-3" />
            {summary?.tokensUsed} tokens
          </Badge>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{summary?.summary}</p>

        <Separator />

        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Insights
          </h4>
          <ul className="space-y-2">
            {summary?.insights.map((insight, index) => (
              <li key={index} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
