'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { DERIVED_CONTENT_TYPES } from '../types/derivedContent'
import type { DerivedContentType, DerivedContentData } from '../types/derivedContent'
import type { SummaryData } from '@/features/summary/types'

interface DeriveActionsCardProps {
  generatingType: DerivedContentType | null
  existingItems: DerivedContentData[]
  onGenerate: (type: DerivedContentType) => Promise<void>
  summary?: SummaryData
  isGeneratingSummary: boolean
  onGenerateSummary: () => void
  onCopySummary: () => void
  copiedSummary: boolean
}

export function DeriveActionsCard({
  generatingType,
  existingItems,
  onGenerate,
  summary,
  isGeneratingSummary,
  onGenerateSummary,
  onCopySummary,
  copiedSummary,
}: DeriveActionsCardProps) {
  const [confirmType, setConfirmType] = useState<DerivedContentType | null>(null)
  const [showInsights, setShowInsights] = useState(false)

  const existingTypes = new Set(existingItems.map((item) => item.type))

  const handleConfirm = async () => {
    if (!confirmType) return
    setConfirmType(null)
    await onGenerate(confirmType)
  }

  const confirmInfo = confirmType
    ? DERIVED_CONTENT_TYPES.find((t) => t.type === confirmType)
    : null

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon name="auto_awesome" size="md" className="text-primary" />
            IA para acao
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Resumo, insights e conteudo derivado
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary result (when generated) */}
          {summary && (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {summary.summary}
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {summary.tokensUsed} tokens
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCopySummary}
                  className="h-7 rounded-lg text-xs"
                >
                  <Icon
                    name={copiedSummary ? 'check' : 'content_copy'}
                    size="xs"
                    className="mr-1"
                  />
                  {copiedSummary ? 'Copiado' : 'Copiar resumo'}
                </Button>
              </div>

              {/* Insights toggle */}
              {summary.insights.length > 0 && (
                <>
                  <button
                    onClick={() => setShowInsights(!showInsights)}
                    className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    <Icon name="lightbulb" size="xs" />
                    {showInsights ? 'Ocultar' : 'Ver'} {summary.insights.length} pontos-chave
                    <Icon name={showInsights ? 'expand_less' : 'expand_more'} size="xs" />
                  </button>

                  {showInsights && (
                    <ul className="space-y-2 pl-1">
                      {summary.insights.map((insight, index) => (
                        <li key={index} className="flex gap-2 text-xs">
                          <span className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 text-[10px] font-medium">
                            {index + 1}
                          </span>
                          <span className="text-muted-foreground">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              <Separator />
            </div>
          )}

          {/* Action buttons grid */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Transformar em conteudo
            </p>
            {generatingType || isGeneratingSummary ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <p className="text-xs text-muted-foreground text-center">
                  {isGeneratingSummary
                    ? 'Gerando resumo...'
                    : `Gerando ${DERIVED_CONTENT_TYPES.find((t) => t.type === generatingType)?.label}...`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {/* Resumo com IA */}
                <HoverCard openDelay={300} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 px-3 flex flex-col items-start gap-0.5 text-left relative"
                      onClick={onGenerateSummary}
                    >
                      <div className="flex items-center gap-1.5 w-full">
                        <Icon name="auto_awesome" size="xs" className="text-muted-foreground" />
                        <span className="text-xs font-medium truncate">Resumo com IA</span>
                      </div>
                      {summary && (
                        <Badge
                          variant="secondary"
                          className="absolute -top-1.5 -right-1.5 text-[10px] px-1 py-0"
                        >
                          Gerado
                        </Badge>
                      )}
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent side="top" className="w-60">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon name="auto_awesome" size="sm" className="text-primary" />
                        <h4 className="text-sm font-semibold">Resumo com IA</h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Gera um resumo conciso da transcricao com pontos-chave e insights principais
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>

                {/* Derived content buttons */}
                {DERIVED_CONTENT_TYPES.map((item) => {
                  const hasExisting = existingTypes.has(item.type)
                  return (
                    <HoverCard key={item.type} openDelay={300} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto py-2 px-3 flex flex-col items-start gap-0.5 text-left relative"
                          onClick={() => setConfirmType(item.type)}
                        >
                          <div className="flex items-center gap-1.5 w-full">
                            <Icon name={item.icon} size="xs" className="text-muted-foreground" />
                            <span className="text-xs font-medium truncate">{item.label}</span>
                          </div>
                          {hasExisting && (
                            <Badge
                              variant="secondary"
                              className="absolute -top-1.5 -right-1.5 text-[10px] px-1 py-0"
                            >
                              Gerado
                            </Badge>
                          )}
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent side="top" className="w-60">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Icon name={item.icon} size="sm" className="text-primary" />
                            <h4 className="text-sm font-semibold">{item.label}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer note */}
          <p className="text-[11px] text-muted-foreground text-center">
            Cada geracao consome tokens de IA
          </p>
        </CardContent>
      </Card>

      <Dialog open={!!confirmType} onOpenChange={() => setConfirmType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Gerar {confirmInfo?.label}?
            </DialogTitle>
            <DialogDescription>
              {existingTypes.has(confirmType!)
                ? 'Ja existe um conteudo deste tipo. Uma nova versao sera gerada e adicionada ao historico.'
                : 'Isso enviara a transcricao para a IA e consumira tokens. Deseja continuar?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmType(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>
              Gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
