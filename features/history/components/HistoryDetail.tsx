'use client'

import { useState } from 'react'
import { Copy, Check, Sparkles, Lightbulb, Coins } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CategoryBadge } from './CategoryBadge'
import type { HistoryItem, HistoryCategory } from '../types'

interface HistoryDetailProps {
  item: HistoryItem | null
  categories: HistoryCategory[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerateSummary?: (item: HistoryItem) => void
  isGeneratingSummary?: boolean
}

export function HistoryDetail({
  item,
  categories,
  open,
  onOpenChange,
  onGenerateSummary,
  isGeneratingSummary,
}: HistoryDetailProps) {
  const [copiedTranscription, setCopiedTranscription] = useState(false)
  const [copiedSummary, setCopiedSummary] = useState(false)

  if (!item) return null

  const category = categories.find((c) => c.id === item.category)

  async function handleCopyTranscription() {
    if (!item) return
    try {
      await navigator.clipboard.writeText(item.transcription)
      setCopiedTranscription(true)
      toast.success('Transcricao copiada!')
      setTimeout(() => setCopiedTranscription(false), 2000)
    } catch {
      toast.error('Erro ao copiar')
    }
  }

  async function handleCopySummary() {
    if (!item?.summary) return
    try {
      await navigator.clipboard.writeText(item.summary.summary)
      setCopiedSummary(true)
      toast.success('Resumo copiado!')
      setTimeout(() => setCopiedSummary(false), 2000)
    } catch {
      toast.error('Erro ao copiar')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {item.fileName}
            {category && (
              <CategoryBadge name={category.name} color={category.color} />
            )}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat('pt-BR', {
              dateStyle: 'long',
              timeStyle: 'short',
            }).format(new Date(item.createdAt))}
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-4">
            {/* Transcription */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Transcricao</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyTranscription}
                >
                  {copiedTranscription ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {item.transcription}
                </p>
              </div>
            </div>

            <Separator />

            {/* Summary */}
            {item.summary ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Resumo
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Coins className="w-3 h-3" />
                      {item.summary.tokensUsed} tokens
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopySummary}
                    >
                      {copiedSummary ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                  <p className="text-sm leading-relaxed">{item.summary.summary}</p>

                  {item.summary.insights.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Insights
                        </h4>
                        <ul className="space-y-1.5">
                          {item.summary.insights.map((insight, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-primary">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Gerar resumo e insights</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use IA para extrair os pontos principais
                  </p>
                </div>
                <Button
                  onClick={() => onGenerateSummary?.(item)}
                  disabled={isGeneratingSummary}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGeneratingSummary ? 'Gerando...' : 'Gerar Resumo'}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
