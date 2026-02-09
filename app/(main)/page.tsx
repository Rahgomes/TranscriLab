'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { FAB } from '@/components/ui/fab'
import { FlipWords } from '@/components/ui/flip-words'
import { MovingBorderButton } from '@/components/ui/moving-border'
import { MultiStepLoader } from '@/components/ui/multi-step-loader'
import {
  AudioUploader,
  AudioFileList,
  TranscriptionCard,
  RecentTranscriptions,
  useAudioUpload,
  useTranscription,
} from '@/features/transcription'
import { SummaryPanel, useSummary } from '@/features/summary'
import { useHistoryStore } from '@/store'
import { saveAudio } from '@/lib/audioStorage'

const heroWords = [
  'com inteligencia artificial',
  'em poucos segundos',
  'de forma simples',
  'com precisao',
]

const loadingStates = [
  { text: 'Preparando arquivo...' },
  { text: 'Enviando para processamento...' },
  { text: 'Transcrevendo audio...' },
  { text: 'Analisando conteudo...' },
  { text: 'Finalizando transcricao...' },
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
  const count = useHistoryStore((state) => state.items.length)

  const [currentTranscription, setCurrentTranscription] = useState<{
    text: string
    fileName: string
    fileSize: number
    historyId: string
  } | null>(null)

  // Atualiza o resumo no histórico quando for gerado
  useEffect(() => {
    if (summary && currentTranscription?.historyId) {
      updateItemSummary(currentTranscription.historyId, summary)
    }
  }, [summary, currentTranscription?.historyId, updateItemSummary])

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
        onComplete: async (text) => {
          updateFileStatus(fileState.id, 'completed', { transcription: text })

          // Salva automaticamente no histórico
          const historyItem = addItem({
            fileName: fileState.name,
            originalFileName: fileState.name,
            fileSize: fileState.size,
            transcription: text,
            hasAudio: true,
            audioMimeType: fileState.file.type,
          })

          // Salva o áudio no IndexedDB
          try {
            await saveAudio(historyItem.id, fileState.file)
          } catch (error) {
            console.error('Erro ao salvar audio:', error)
          }

          setCurrentTranscription({
            text,
            fileName: fileState.name,
            fileSize: fileState.size,
            historyId: historyItem.id,
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

  function handleSelectHistoryItem(id: string) {
    router.push(`/history?selected=${id}`)
  }

  const showUploader = !currentTranscription
  const showFileList = hasFiles && !currentTranscription
  const showActions = hasFiles && !currentTranscription && !isProcessing
  const showRecentTranscriptions = !currentTranscription && !hasFiles && count > 0

  return (
    <div className="min-h-screen">
      {/* Multi Step Loader - fullscreen overlay during processing */}
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={isProcessing}
        duration={2500}
        loop={true}
      />

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
              onFilesSelected={addFiles}
              disabled={isProcessing}
            />
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
                onClear={handleClearTranscription}
              />

              <SummaryPanel
                summary={summary}
                isGenerating={isGenerating}
                error={summaryError}
                onGenerate={handleGenerateSummary}
                disabled={isGenerating}
              />
            </>
          )}

          {showRecentTranscriptions && (
            <RecentTranscriptions
              onSelectItem={handleSelectHistoryItem}
              limit={4}
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
