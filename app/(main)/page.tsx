'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Icon } from '@/components/ui/icon'
import { FAB } from '@/components/ui/fab'
import { FlipWords } from '@/components/ui/flip-words'
import { MovingBorderButton } from '@/components/ui/moving-border'
import type { TranscriptionSegment } from '@/features/transcription/types'
import {
  AudioUploader,
  AudioFileList,
  TranscriptionCard,
  RecentTranscriptions,
  useAudioUpload,
  useTranscription,
} from '@/features/transcription'
import { useSummary } from '@/features/summary'
import { useHistoryStore } from '@/store'
import { DeriveActionsCard, useDerivedContent } from '@/features/history'
import { saveAudio } from '@/lib/audioStorage'

const heroWords = [
  'com inteligencia artificial',
  'em poucos segundos',
  'de forma simples',
  'com precisao',
]

export default function Home() {
  const router = useRouter()
  const {
    files,
    addFiles,
    removeFile,
    updateFileStatus,
    updateFileProgress,
    clearAll,
    hasFiles,
    hasPendingFiles,
    isProcessing,
  } = useAudioUpload()

  const { transcribe } = useTranscription()
  const { summary, isGenerating, error: summaryError, generateSummary, clearSummary } = useSummary()
  const addItem = useHistoryStore((state) => state.addItem)
  const updateItemSummary = useHistoryStore((state) => state.updateItemSummary)
  const items = useHistoryStore((state) => state.items)
  const count = items.length

  const [duplicateInfo, setDuplicateInfo] = useState<{
    fileName: string
    historyId: string
    pendingFiles: File[]
  } | null>(null)

  const [currentTranscription, setCurrentTranscription] = useState<{
    text: string
    fileName: string
    fileSize: number
    historyId: string
    segments?: TranscriptionSegment[]
    hasDiarization?: boolean
    speakerCount?: number
  } | null>(null)

  const [copiedSummary, setCopiedSummary] = useState(false)

  const derivedContent = useDerivedContent(currentTranscription?.historyId ?? '')

  // Atualiza o resumo no histórico quando for gerado
  useEffect(() => {
    if (summary && currentTranscription?.historyId) {
      updateItemSummary(currentTranscription.historyId, summary)
    }
  }, [summary, currentTranscription?.historyId, updateItemSummary])

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    // Verifica se algum arquivo já foi transcrito anteriormente
    for (const file of newFiles) {
      const existing = items.find(
        (item) => item.originalFileName === file.name && item.fileSize === file.size,
      )
      if (existing) {
        setDuplicateInfo({
          fileName: file.name,
          historyId: existing.id,
          pendingFiles: newFiles,
        })
        return
      }
    }
    addFiles(newFiles)
  }, [items, addFiles])

  const processFiles = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending')

    for (const fileState of pendingFiles) {
      updateFileStatus(fileState.id, 'uploading')

      await transcribe(fileState.file, {
        onProgress: (progress) => {
          updateFileProgress(fileState.id, progress)
          if (progress >= 30) {
            updateFileStatus(fileState.id, 'transcribing')
          }
        },
        onComplete: async (result) => {
          updateFileStatus(fileState.id, 'completed', { transcription: result.text })

          // Salva automaticamente no histórico (via API)
          const historyItem = await addItem(
            {
              fileName: fileState.name,
              originalFileName: fileState.name,
              fileSize: fileState.size,
              transcription: result.text,
              hasAudio: true,
              audioMimeType: fileState.file.type,
              hasDiarization: result.hasDiarization,
              speakerCount: result.speakerCount,
              hasEvents: result.hasEvents,
            },
            result.segments,
            result.events,
          )

          // Salva o áudio no IndexedDB
          try {
            await saveAudio(historyItem.id, fileState.file)
          } catch (error) {
            console.error('Erro ao salvar audio:', error)
          }

          setCurrentTranscription({
            text: result.text,
            fileName: fileState.name,
            fileSize: fileState.size,
            historyId: historyItem.id,
            segments: result.segments,
            hasDiarization: result.hasDiarization,
            speakerCount: result.speakerCount,
          })

          toast.success(`${fileState.name} transcrito e salvo no historico!`)
        },
        onError: (error) => {
          updateFileStatus(fileState.id, 'error', { error })
          toast.error(`Erro em ${fileState.name}: ${error}`)
        },
      })
    }
  }, [files, transcribe, updateFileStatus, updateFileProgress, addItem])

  function handleRetry(id: string) {
    const file = files.find((f) => f.id === id)
    if (file) {
      updateFileStatus(id, 'pending', { error: undefined, progress: 0 })
    }
  }

  function handleClearTranscription() {
    setCurrentTranscription(null)
    clearSummary()
    clearAll()
  }

  function handleGenerateSummary() {
    if (currentTranscription) {
      generateSummary(currentTranscription.text)
    }
  }

  async function handleCopySummary() {
    if (!summary) return
    try {
      const textToCopy = `${summary.summary}\n\nInsights:\n${summary.insights.map(i => `• ${i}`).join('\n')}`
      await navigator.clipboard.writeText(textToCopy)
      setCopiedSummary(true)
      toast.success('Resumo copiado!')
      setTimeout(() => setCopiedSummary(false), 2000)
    } catch {
      toast.error('Erro ao copiar')
    }
  }

  function handleEditTranscription() {
    if (currentTranscription) {
      router.push(`/history/${currentTranscription.historyId}?edit=true`)
    }
  }

  function handleSelectHistoryItem(id: string) {
    router.push(`/history?selected=${id}`)
  }

  const showUploader = !currentTranscription
  const showFileList = hasFiles && !currentTranscription
  const showActions = hasFiles && !currentTranscription && !isProcessing
  const showRecentTranscriptions = !currentTranscription && !hasFiles && count > 0

  return (
    <div className="min-h-screen">
      <div className="w-full py-8 md:py-12">
        {/* Header with FlipWords */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-semibold tracking-tight">
            TranscriLab
          </h1>
          <div className="mt-3 text-lg text-muted-foreground flex items-center justify-center">
            <span>Converta audio em texto</span>
            <FlipWords
              words={heroWords}
              duration={3000}
              className="text-primary font-medium"
            />
          </div>
        </header>

        {/* Main Content */}
        <main className="space-y-8">
          {showUploader && (
            <AudioUploader
              onFilesSelected={handleFilesSelected}
              disabled={isProcessing}
            />
          )}

          {duplicateInfo && (
            <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <Icon name="warning" size="md" className="text-amber-500" />
              <AlertTitle className="text-amber-700 dark:text-amber-400">
                Áudio já transcrito
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-3">
                <p className="text-muted-foreground">
                  O arquivo <span className="font-medium text-foreground">{duplicateInfo.fileName}</span> já foi transcrito anteriormente.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => router.push(`/history/${duplicateInfo.historyId}`)}
                    className="rounded-xl"
                  >
                    <Icon name="arrow_forward" size="sm" className="mr-2" />
                    Ir para a transcrição
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      addFiles(duplicateInfo.pendingFiles)
                      setDuplicateInfo(null)
                    }}
                    className="rounded-xl"
                  >
                    Transcrever mesmo assim
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDuplicateInfo(null)}
                    className="rounded-xl"
                  >
                    Cancelar
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {showFileList && (
            <AudioFileList
              files={files}
              onRemove={removeFile}
              onRetry={handleRetry}
            />
          )}

          {showActions && (
            <div className="flex justify-center gap-3">
              <MovingBorderButton
                onClick={processFiles}
                disabled={!hasPendingFiles}
                containerClassName="h-12"
                className="font-medium"
                borderRadius="0.75rem"
              >
                <Icon name="play_arrow" size="md" className="mr-2" />
                Transcrever {files.filter((f) => f.status === 'pending').length > 1 ? 'todos' : ''}
              </MovingBorderButton>

              <Button
                variant="outline"
                size="lg"
                onClick={clearAll}
                className="rounded-xl"
              >
                <Icon name="delete" size="md" className="mr-2" />
                Limpar
              </Button>
            </div>
          )}

          {currentTranscription && (
            <>
              <TranscriptionCard
                text={currentTranscription.text}
                fileName={currentTranscription.fileName}
                segments={currentTranscription.segments}
                hasDiarization={currentTranscription.hasDiarization}
                onClear={handleClearTranscription}
                onEdit={handleEditTranscription}
              />

              <DeriveActionsCard
                generatingType={derivedContent.generatingType}
                existingItems={derivedContent.items}
                onGenerate={derivedContent.generateContent}
                summary={summary ?? undefined}
                isGeneratingSummary={isGenerating}
                onGenerateSummary={handleGenerateSummary}
                onCopySummary={handleCopySummary}
                copiedSummary={copiedSummary}
              />
            </>
          )}

          {showRecentTranscriptions && (
            <RecentTranscriptions
              onSelectItem={handleSelectHistoryItem}
              limit={6}
            />
          )}
        </main>
      </div>

      {/* FAB - Quick action button */}
      {!hasFiles && !currentTranscription && (
        <FAB
          icon="add"
          onClick={() => {
            const input = document.querySelector('input[type="file"]') as HTMLInputElement
            input?.click()
          }}
        />
      )}
    </div>
  )
}
