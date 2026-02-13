'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import type { AudioPlayerHandle } from '@/components/ui/audio-player'
import { useHistoryStore } from '@/store'
import {
  CategoryBadge,
  AudioPlayerWithLoader,
  SegmentedTranscript,
  SpeakersList,
  useSegments,
} from '@/features/history'
import { findActiveSegmentIndex } from '@/lib/segments'

export default function TranscriptionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const items = useHistoryStore((state) => state.items)
  const categories = useHistoryStore((state) => state.categories)
  const renameFile = useHistoryStore((state) => state.renameFile)
  const updateItemSummary = useHistoryStore((state) => state.updateItemSummary)

  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [copiedText, setCopiedText] = useState<'transcription' | 'summary' | null>(null)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1)

  const audioPlayerRef = useRef<AudioPlayerHandle>(null)
  const item = items.find((i) => i.id === id)
  const category = item ? categories.find((c) => c.id === item.category) : null

  // Carrega segmentos sob demanda para transcricoes com diarizacao
  // Usa segments do localStorage como fonte primária, API como fallback
  const { segments, speakers, isLoading: segmentsLoading } = useSegments(
    item?.id,
    item?.hasDiarization,
    item?.segments,
  )

  useEffect(() => {
    if (item) {
      setEditedName(item.fileName)
    }
  }, [item])

  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      if (segments.length === 0) return
      const index = findActiveSegmentIndex(segments, currentTime)
      setActiveSegmentIndex(index)
    },
    [segments],
  )

  const handleSegmentClick = useCallback(
    (startTime: number) => {
      audioPlayerRef.current?.seekTo(startTime)
      audioPlayerRef.current?.play()
    },
    [],
  )

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Icon name="error" size="xl" className="text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Transcricao nao encontrada</h2>
          <Button onClick={() => router.push('/history')} variant="outline" className="rounded-xl">
            <Icon name="arrow_back" size="sm" className="mr-2" />
            Voltar ao Historico
          </Button>
        </div>
      </div>
    )
  }

  async function handleCopy(type: 'transcription' | 'summary') {
    if (!item) return
    const text = type === 'transcription' ? item.transcription : item.summary?.summary
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(type)
      toast.success(type === 'transcription' ? 'Transcricao copiada!' : 'Resumo copiado!')
      setTimeout(() => setCopiedText(null), 2000)
    } catch {
      toast.error('Erro ao copiar')
    }
  }

  function handleSaveName() {
    if (!item) return
    if (editedName.trim() && editedName !== item.fileName) {
      renameFile(item.id, editedName.trim())
      toast.success('Nome atualizado!')
    }
    setIsEditing(false)
  }

  async function handleGenerateSummary() {
    if (!item) return
    setIsGeneratingSummary(true)
    try {
      const response = await fetch(`/api/transcriptions/${item.id}/summary`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar resumo')
      }

      updateItemSummary(item.id, {
        summary: data.summary,
        insights: data.insights,
        tokensUsed: data.tokensUsed,
        generatedAt: new Date(data.generatedAt),
      })

      toast.success('Resumo gerado com sucesso!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao gerar resumo'
      toast.error(message)
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  function handleExport() {
    if (!item) return

    let transcriptionContent = item.transcription

    // Se tiver diarizacao e segmentos carregados, exporta com speakers e timestamps
    if (item.hasDiarization && segments.length > 0) {
      transcriptionContent = segments
        .map((s) => {
          const mins = Math.floor(s.startTime / 60)
          const secs = Math.floor(s.startTime % 60)
          const ts = `${mins}:${secs.toString().padStart(2, '0')}`
          return `[${ts}] **Speaker ${s.speaker}**: ${s.text}`
        })
        .join('\n\n')
    }

    const content = `# ${item.fileName}\n\nData: ${new Date(item.createdAt).toLocaleString('pt-BR')}\n${item.hasDiarization ? `Falantes: ${item.speakerCount ?? 'N/A'}\n` : ''}\n## Transcricao\n\n${transcriptionContent}${item.summary ? `\n\n## Resumo\n\n${item.summary.summary}\n\n## Insights\n\n${item.summary.insights.map((i) => `- ${i}`).join('\n')}` : ''}`

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.fileName.replace(/\.[^/.]+$/, '')}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Arquivo exportado!')
  }

  async function handleShare() {
    if (!item) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.fileName,
          text: item.transcription.slice(0, 200) + '...',
        })
      } catch {
        // User cancelled
      }
    } else {
      handleCopy('transcription')
    }
  }

  const hasDiarization = item.hasDiarization && segments.length > 0

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left side - Back button and title */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/history')}
                className="rounded-xl flex-shrink-0"
              >
                <Icon name="arrow_back" size="md" />
              </Button>

              {isEditing ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="rounded-xl max-w-md"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveName} className="rounded-xl">
                    Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false)
                      setEditedName(item.fileName)
                    }}
                    className="rounded-xl"
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-lg font-semibold truncate hover:text-primary transition-colors group"
                >
                  <span className="truncate">{item.fileName}</span>
                  <Icon
                    name="edit"
                    size="sm"
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </button>
              )}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy('transcription')}
                className="rounded-xl"
              >
                <Icon name={copiedText === 'transcription' ? 'check' : 'content_copy'} size="sm" className="mr-2" />
                {copiedText === 'transcription' ? 'Copiado' : 'Copiar'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} className="rounded-xl">
                <Icon name="download" size="sm" className="mr-2" />
                Exportar
              </Button>
              <Button size="sm" onClick={handleShare} className="rounded-xl">
                <Icon name="share" size="sm" className="mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content - 2 columns */}
      <div className="w-full">
        <div className="flex flex-col lg:flex-row">
          {/* Main content - Transcription */}
          <main className="flex-1 lg:border-r">
            <div className="w-full px-6 lg:px-12 py-10">
              {/* Meta info */}
              <div className="flex items-center gap-3 flex-wrap mb-8">
                {category && <CategoryBadge name={category.name} color={category.color} />}
                {item.hasDiarization && (
                  <Badge variant="secondary" className="text-xs">
                    <Icon name="group" size="xs" className="mr-1" />
                    {item.speakerCount ?? '?'} falantes
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Icon name="calendar_today" size="xs" />
                  {new Intl.DateTimeFormat('pt-BR', {
                    dateStyle: 'long',
                  }).format(new Date(item.createdAt))}
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Icon name="schedule" size="xs" />
                  {new Intl.DateTimeFormat('pt-BR', {
                    timeStyle: 'short',
                  }).format(new Date(item.createdAt))}
                </span>
              </div>

              {/* Transcription content */}
              {segmentsLoading && item.hasDiarization ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ))}
                </div>
              ) : hasDiarization ? (
                <SegmentedTranscript
                  segments={segments}
                  speakers={speakers}
                  activeSegmentIndex={activeSegmentIndex}
                  onSegmentClick={handleSegmentClick}
                />
              ) : (
                <article className="prose prose-slate dark:prose-invert prose-lg max-w-none space-y-6">
                  {item.transcription.split(/\n\n+/).map((paragraph, index) => (
                    <p
                      key={index}
                      className={`font-serif text-lg leading-relaxed ${index === 0 ? 'drop-cap' : ''}`}
                    >
                      {paragraph}
                    </p>
                  ))}
                </article>
              )}

              {/* End marker */}
              <div className="flex items-center gap-4 mt-12 text-muted-foreground">
                <Separator className="flex-1" />
                <span className="text-xs uppercase tracking-widest">Fim da Transcricao</span>
                <Separator className="flex-1" />
              </div>
            </div>
          </main>

          {/* Sidebar */}
          <aside className="lg:w-96 bg-muted/30 border-t lg:border-t-0">
            <ScrollArea className="h-auto lg:h-[calc(100vh-73px)]">
              <div className="p-6 lg:p-8 space-y-6">
                {/* Audio Player */}
                {item.hasAudio && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon name="headphones" size="md" className="text-primary" />
                        Audio Enviado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AudioPlayerWithLoader
                        ref={audioPlayerRef}
                        historyId={item.id}
                        onTimeUpdate={handleTimeUpdate}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Speakers list */}
                {hasDiarization && <SpeakersList speakers={speakers} />}

                {/* Summary section */}
                {item.summary ? (
                  <>
                    {/* AI Summary */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Icon name="auto_awesome" size="md" className="text-primary" />
                          Resumo da IA
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {item.summary.summary}
                        </p>
                        <div className="flex items-center justify-between mt-4">
                          <Badge variant="secondary" className="text-xs">
                            {item.summary.tokensUsed} tokens
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy('summary')}
                            className="h-8 rounded-lg"
                          >
                            <Icon
                              name={copiedText === 'summary' ? 'check' : 'content_copy'}
                              size="xs"
                              className="mr-1"
                            />
                            {copiedText === 'summary' ? 'Copiado' : 'Copiar'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Key Points */}
                    {item.summary.insights.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Icon name="lightbulb" size="md" className="text-amber-500" />
                            Pontos Chave
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {item.summary.insights.map((insight, index) => (
                              <li key={index} className="flex gap-3 text-sm">
                                <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 text-xs font-medium">
                                  {index + 1}
                                </span>
                                <span className="text-muted-foreground">{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  /* Generate summary CTA */
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                          <Icon name="auto_awesome" size="lg" className="text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Gerar resumo com IA</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Extraia os pontos principais automaticamente
                          </p>
                        </div>
                        <Button
                          onClick={handleGenerateSummary}
                          disabled={isGeneratingSummary}
                          className="w-full rounded-xl"
                        >
                          <Icon name="auto_awesome" size="sm" className="mr-2" />
                          {isGeneratingSummary ? 'Gerando...' : 'Gerar Resumo'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* File info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon name="info" size="md" className="text-muted-foreground" />
                      Informacoes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Arquivo original</span>
                      <span className="font-medium truncate ml-4 max-w-[180px]">
                        {item.originalFileName}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tamanho</span>
                      <span className="font-medium">
                        {(item.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Palavras</span>
                      <span className="font-medium">
                        {item.transcription.split(/\s+/).length}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Caracteres</span>
                      <span className="font-medium">
                        {item.transcription.length.toLocaleString()}
                      </span>
                    </div>
                    {item.hasDiarization && (
                      <>
                        <Separator />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Segmentos</span>
                          <span className="font-medium">
                            {segments.length || '...'}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </aside>
        </div>
      </div>
    </div>
  )
}
