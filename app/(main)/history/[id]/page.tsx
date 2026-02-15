'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AudioPlayerHandle } from '@/components/ui/audio-player'
import { useHistoryStore } from '@/store'
import {
  CategoryBadge,
  AudioPlayerWithLoader,
  SegmentedTranscript,
  SpeakersList,
  useSegments,
} from '@/features/history'
import { EditableSegmentedTranscript } from '@/features/history/components/EditableSegmentedTranscript'
import { EditorToolbar } from '@/features/history/components/EditorToolbar'
import { VersionHistorySheet } from '@/features/history/components/VersionHistorySheet'
import { EventsList } from '@/features/history/components/EventsList'
import { useEvents } from '@/features/history/hooks/useEvents'
import { useEditorState } from '@/features/history/hooks/useEditorState'
import { useVersionHistory } from '@/features/history/hooks/useVersionHistory'
import { useDerivedContent } from '@/features/history/hooks/useDerivedContent'
import { DeriveActionsCard } from '@/features/history/components/DeriveActionsCard'
import { DerivedContentList } from '@/features/history/components/DerivedContentList'
import { findActiveSegmentIndex } from '@/lib/segments'
import { findActiveEventIndex } from '@/lib/audioEvents'

export default function TranscriptionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params.id as string
  const shouldEditOnLoad = searchParams.get('edit') === 'true'

  const items = useHistoryStore((state) => state.items)
  const categories = useHistoryStore((state) => state.categories)
  const renameFile = useHistoryStore((state) => state.renameFile)
  const updateItemSummary = useHistoryStore((state) => state.updateItemSummary)
  const updateItemAfterEdit = useHistoryStore((state) => state.updateItemAfterEdit)
  const dbAvailable = useHistoryStore((state) => state.dbAvailable)
  const saveEditsLocally = useHistoryStore((state) => state.saveEditsLocally)
  const deleteItem = useHistoryStore((state) => state.deleteItem)

  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [copiedText, setCopiedText] = useState<'transcription' | 'summary' | null>(null)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1)
  const [activeEventIndex, setActiveEventIndex] = useState(-1)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [showHistorySheet, setShowHistorySheet] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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

  // Carrega eventos de audio
  const { events } = useEvents(
    item?.id,
    item?.hasEvents,
    item?.events,
  )

  // Editor state
  const editor = useEditorState(segments, item?.transcription ?? '')

  // Version history
  const versionHistory = useVersionHistory(item?.id)

  // Derived content
  const derivedContent = useDerivedContent(id)

  const hasEnteredEditRef = useRef(false)

  useEffect(() => {
    if (item) {
      setEditedName(item.fileName)
    }
  }, [item])

  // Auto-enter edit mode when ?edit=true
  useEffect(() => {
    if (shouldEditOnLoad && item && !hasEnteredEditRef.current) {
      // Se tem diarização, espera os segments carregarem
      if (item.hasDiarization && segments.length === 0) return
      hasEnteredEditRef.current = true
      editor.enterEditMode()
    }
  }, [shouldEditOnLoad, item, editor, segments])

  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      if (segments.length > 0) {
        const index = findActiveSegmentIndex(segments, currentTime)
        setActiveSegmentIndex(index)
      }
      if (events.length > 0) {
        const eventIdx = findActiveEventIndex(events, currentTime)
        setActiveEventIndex(eventIdx)
      }
    },
    [segments, events],
  )

  const handleSegmentClick = useCallback(
    (startTime: number) => {
      audioPlayerRef.current?.seekTo(startTime)
      audioPlayerRef.current?.play()
    },
    [],
  )

  // === Editor handlers ===
  const handleToggleEditMode = useCallback(() => {
    if (editor.isEditMode) {
      if (editor.isDirty) {
        setShowDiscardDialog(true)
      } else {
        editor.exitEditMode()
      }
    } else {
      editor.enterEditMode()
    }
  }, [editor])

  const handleDiscardEdits = useCallback(() => {
    editor.exitEditMode()
    setShowDiscardDialog(false)
  }, [editor])

  const handleSaveEdits = useCallback(async () => {
    if (!item) return

    editor.setIsSaving(true)
    try {
      const hasDiarizationSegments = item.hasDiarization && editor.editableSegments.length > 0

      const payload = {
        transcriptionText: hasDiarizationSegments
          ? editor.editableSegments.map((s) => s.text).join('\n\n')
          : editor.editableText,
        segments: hasDiarizationSegments
          ? editor.editableSegments.map((s) => ({
              id: s.id,
              index: s.index,
              speaker: s.speaker,
              speakerLabel: s.speakerLabel ?? null,
              text: s.text,
              startTime: s.startTime,
              endTime: s.endTime,
            }))
          : undefined,
      }

      if (dbAvailable) {
        // Fluxo DB: salvar via API
        const res = await fetch(`/api/transcriptions/${item.id}/edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Erro ao salvar edicoes')
        }

        const data = await res.json()

        updateItemAfterEdit(item.id, {
          transcription: data.transcription,
          currentVersion: data.currentVersion,
          segments: data.segments,
        })

        if (data.segments) {
          editor.applyUpdatedSegments(data.segments)
        }

        toast.success(`Alteracoes salvas! Versao #${data.versionCreated} criada`)
      } else {
        // Fluxo local: salvar no localStorage
        const result = saveEditsLocally(item.id, payload)
        if (!result) throw new Error('Erro ao salvar edicoes localmente')

        if (result.segments) {
          editor.applyUpdatedSegments(result.segments)
        }

        toast.success(`Alteracoes salvas localmente! Versao #${result.versionCreated} criada`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar'
      toast.error(message)
    } finally {
      editor.setIsSaving(false)
    }
  }, [item, editor, updateItemAfterEdit, dbAvailable, saveEditsLocally])

  const handleRestoreVersion = useCallback(async (versionNumber: number) => {
    if (!item) return

    const success = await versionHistory.restoreVersion(versionNumber)
    if (success) {
      toast.success(`Versao #${versionNumber} restaurada com sucesso!`)
      if (dbAvailable) {
        router.refresh()
      }
    } else {
      toast.error('Erro ao restaurar versao')
    }
  }, [item, versionHistory, router, dbAvailable])

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptionText: item.transcription }),
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

  async function handleDelete() {
    if (!item) return
    await deleteItem(item.id)
    toast.success('Transcricao excluida!')
    router.push('/history')
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
              {(item.currentVersion ?? 0) > 0 && !editor.isEditMode && (
                <>
                  <Badge variant="secondary" className="text-xs">
                    Editado (v{item.currentVersion})
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistorySheet(true)}
                    className="rounded-xl"
                  >
                    <Icon name="history" size="sm" className="mr-2" />
                    Historico
                  </Button>
                </>
              )}
              <Button
                variant={editor.isEditMode ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggleEditMode}
                className="rounded-xl"
              >
                <Icon name="edit_note" size="sm" className="mr-2" />
                {editor.isEditMode ? 'Editando...' : 'Editar'}
              </Button>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="rounded-xl text-destructive hover:text-destructive"
              >
                <Icon name="delete" size="sm" className="mr-2" />
                Excluir
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

              {/* Editor toolbar */}
              {editor.isEditMode && (
                <div className="mb-6">
                  <EditorToolbar
                    isDirty={editor.isDirty}
                    isSaving={editor.isSaving}
                    currentVersion={item.currentVersion ?? 0}
                    onSave={handleSaveEdits}
                    onDiscard={() => {
                      if (editor.isDirty) setShowDiscardDialog(true)
                      else editor.exitEditMode()
                    }}
                    onOpenHistory={() => setShowHistorySheet(true)}
                  />
                </div>
              )}

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
              ) : editor.isEditMode && hasDiarization ? (
                <EditableSegmentedTranscript
                  segments={editor.editableSegments}
                  speakers={speakers}
                  activeSegmentIndex={activeSegmentIndex}
                  onSegmentClick={handleSegmentClick}
                  onSegmentTextChange={editor.setSegmentText}
                  onSpeakerLabelChange={editor.setSegmentSpeakerLabel}
                  onTimestampChange={editor.setSegmentTimestamps}
                />
              ) : editor.isEditMode && !hasDiarization ? (
                <Textarea
                  value={editor.editableText}
                  onChange={(e) => editor.setEditableText(e.target.value)}
                  className="min-h-[400px] bg-muted/30 border-transparent focus:border-input text-lg leading-relaxed font-serif resize-none"
                />
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

              {/* Generated content section */}
              {(derivedContent.items.length > 0 || derivedContent.isLoading) && (
                <section className="mt-12">
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                    <Icon name="auto_awesome" size="md" className="text-primary" />
                    Conteudos gerados com IA
                  </h2>
                  <DerivedContentList
                    items={derivedContent.items}
                    isLoading={derivedContent.isLoading}
                    onDelete={derivedContent.deleteContent}
                  />
                </section>
              )}
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
                        events={events}
                        onEventClick={handleSegmentClick}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Speakers list */}
                {hasDiarization && <SpeakersList speakers={speakers} />}

                {/* Audio events list */}
                {events.length > 0 && (
                  <EventsList
                    events={events}
                    activeEventIndex={activeEventIndex}
                    onEventClick={handleSegmentClick}
                  />
                )}

                {/* IA para acao - unified card (summary + derived content) */}
                <DeriveActionsCard
                  generatingType={derivedContent.generatingType}
                  existingItems={derivedContent.items}
                  onGenerate={derivedContent.generateContent}
                  summary={item.summary}
                  isGeneratingSummary={isGeneratingSummary}
                  onGenerateSummary={handleGenerateSummary}
                  onCopySummary={() => handleCopy('summary')}
                  copiedSummary={copiedText === 'summary'}
                />

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

      {/* Discard edits dialog */}
      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descartar alteracoes?</DialogTitle>
            <DialogDescription>
              Voce tem alteracoes nao salvas. Tem certeza que deseja descartar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDiscardDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDiscardEdits}>
              Descartar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir transcricao</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir &quot;{item.fileName}&quot;? Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl">
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version history sheet */}
      <VersionHistorySheet
        open={showHistorySheet}
        onOpenChange={setShowHistorySheet}
        versions={versionHistory.versions}
        isLoading={versionHistory.isLoading}
        isLoadingDetail={versionHistory.isLoadingDetail}
        isRestoring={versionHistory.isRestoring}
        selectedVersion={versionHistory.selectedVersion}
        createdAt={item.createdAt}
        onFetchVersions={versionHistory.fetchVersions}
        onFetchSnapshot={versionHistory.fetchVersionSnapshot}
        onRestore={handleRestoreVersion}
        onClearSelectedVersion={versionHistory.clearSelectedVersion}
        currentTranscriptionText={item.transcription}
        currentSegments={segments.map((s) => ({ index: s.index, speaker: s.speaker, text: s.text }))}
      />
    </div>
  )
}
