'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { useRecordingStore, useHistoryStore } from '@/store'
import { useRecordingSession } from '../hooks/useRecordingSession'
import { WaveformVisualizer } from './WaveformVisualizer'
import { LiveTranscript } from './LiveTranscript'
import { RecordingControls } from './RecordingControls'
import { PostRecordingActions } from './PostRecordingActions'
import { saveAudio } from '@/lib/audioStorage'
import type { TranscriptionSegment } from '@/features/transcription/types'
import type { RecordingResult } from '../types'

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// Post-process transcription with GPT for error correction
async function postprocessTranscription(text: string): Promise<string> {
  try {
    const response = await fetch('/api/realtime/postprocess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    
    if (!response.ok) {
      console.warn('Postprocess failed, using original text')
      return text
    }
    
    const data = await response.json()
    return data.text || text
  } catch (error) {
    console.warn('Postprocess error, using original text:', error)
    return text
  }
}

export function RecordingOverlay() {
  const router = useRouter()
  const isOpen = useRecordingStore((s) => s.isRecordingModalOpen)
  const closeModal = useRecordingStore((s) => s.closeRecordingModal)
  const addItem = useHistoryStore((s) => s.addItem)

  const session = useRecordingSession()
  const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleStart = useCallback(async () => {
    await session.startSession()
  }, [session])

  const handleStop = useCallback(async () => {
    const result = await session.stopSession()
    setRecordingResult(result)
  }, [session])

  const handleDiscard = useCallback(() => {
    session.discardSession()
    setRecordingResult(null)
    closeModal()
  }, [session, closeModal])

  const handleRestart = useCallback(() => {
    session.discardSession()
    setRecordingResult(null)
  }, [session])

  const handleSave = useCallback(
    async (editedText?: string) => {
      if (!recordingResult && !session.fullText.trim()) return

      setIsSaving(true)
      try {
        const now = new Date()
        const fileName = `Gravação ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        const rawText = editedText || recordingResult?.fullText || session.fullText
        const segments = recordingResult?.segments || session.segments
        const duration = recordingResult?.duration || session.duration

        // Post-process transcription with GPT for error correction
        // Only if text wasn't manually edited
        let finalText = rawText
        if (!editedText && rawText.trim().length >= 10) {
          toast.loading('Refinando transcrição...', { id: 'postprocess' })
          finalText = await postprocessTranscription(rawText)
          toast.dismiss('postprocess')
        }

        // Convert RealtimeSegments to TranscriptionSegments
        const transcriptionSegments: TranscriptionSegment[] = segments
          .filter((s) => s.isFinal)
          .map((s, i) => ({
            index: i,
            speaker: 'Speaker 0',
            text: s.text,
            startTime: s.startTime,
            endTime: s.endTime,
          }))

        const historyItem = await addItem(
          {
            fileName,
            originalFileName: `${fileName}.webm`,
            fileSize: recordingResult?.audioBlob.size ?? 0,
            duration,
            transcription: finalText,
            originalTranscriptionText: rawText !== finalText ? rawText : undefined,
            hasAudio: !!recordingResult?.audioBlob,
            audioMimeType: recordingResult?.mimeType ?? 'audio/webm',
            hasDiarization: false,
            speakerCount: 1,
            hasEvents: false,
            source: 'realtime',
          },
          transcriptionSegments,
          [],
        )

        // Save audio blob to IndexedDB
        if (recordingResult?.audioBlob) {
          try {
            const audioFile = new File(
              [recordingResult.audioBlob],
              `${fileName}.webm`,
              { type: recordingResult.mimeType },
            )
            await saveAudio(historyItem.id, audioFile)
          } catch (error) {
            console.error('Erro ao salvar áudio:', error)
          }
        }

        toast.success('Gravação salva no histórico!')

        // Cleanup and close
        session.discardSession()
        setRecordingResult(null)
        closeModal()

        // Navigate to detail page
        router.push(`/history/${historyItem.id}`)
      } catch (error) {
        console.error('Erro ao salvar gravação:', error)
        toast.error('Erro ao salvar a gravação')
      } finally {
        setIsSaving(false)
      }
    },
    [recordingResult, session, addItem, closeModal, router],
  )

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Prevent closing during recording without confirmation
      if (session.phase === 'recording' || session.phase === 'paused') return
      handleDiscard()
    }
  }

  const { phase, duration, segments, partialText, fullText, error, analyserNode } = session

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogTitle className="sr-only">Gravação em tempo real</DialogTitle>

        {/* Header with timer */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Icon name="mic" size="lg" className="text-primary" />
            <span className="font-semibold text-lg">Gravação em Tempo Real</span>
          </div>
          {(phase === 'recording' || phase === 'paused') && (
            <div className="flex items-center gap-2">
              {phase === 'recording' && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
              )}
              {phase === 'paused' && (
                <span className="text-xs font-medium text-amber-500">
                  Pausado
                </span>
              )}
              <span className="font-mono text-lg tabular-nums">
                {formatTimer(duration)}
              </span>
            </div>
          )}
        </div>

        {/* Main content — phase-based */}
        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            {/* Idle / Permission Request */}
            {(phase === 'idle' || phase === 'requesting-permission') && (
              <motion.div
                key="permission"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-6 py-12"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
                >
                  <Icon
                    name="mic"
                    size="xl"
                    className="text-primary"
                    fill={1}
                  />
                </motion.div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">
                    Permita acesso ao microfone para iniciar a gravação
                  </p>
                  <p className="text-sm text-muted-foreground">
                    O áudio será transcrito em tempo real enquanto você fala.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleStart}
                  disabled={phase === 'requesting-permission'}
                  className="rounded-xl gap-2"
                >
                  {phase === 'requesting-permission' ? (
                    <>
                      <Icon name="hourglass_empty" size="md" className="animate-spin" />
                      Aguardando permissão...
                    </>
                  ) : (
                    <>
                      <Icon name="mic" size="md" />
                      Iniciar Gravação
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Connecting */}
            {phase === 'connecting' && (
              <motion.div
                key="connecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-4 py-12"
              >
                <div className="flex h-16 w-16 items-center justify-center">
                  <Icon
                    name="sync"
                    size="xl"
                    className="text-primary animate-spin"
                  />
                </div>
                <p className="text-muted-foreground">
                  Conectando ao serviço de transcrição...
                </p>
              </motion.div>
            )}

            {/* Recording / Paused */}
            {(phase === 'recording' || phase === 'paused') && (
              <motion.div
                key="recording"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                <WaveformVisualizer
                  analyserNode={analyserNode}
                  isActive={phase === 'recording'}
                />

                <LiveTranscript
                  segments={segments}
                  partialText={partialText}
                  className="h-48 md:h-56 border rounded-xl"
                />

                <RecordingControls
                  phase={phase}
                  onPause={session.pauseSession}
                  onResume={session.resumeSession}
                  onStop={handleStop}
                />
              </motion.div>
            )}

            {/* Processing */}
            {phase === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-4 py-12"
              >
                <Icon
                  name="pending"
                  size="xl"
                  className="text-primary animate-spin"
                />
                <p className="text-muted-foreground">
                  Finalizando transcrição...
                </p>
              </motion.div>
            )}

            {/* Completed */}
            {phase === 'completed' && (
              <motion.div
                key="completed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PostRecordingActions
                  fullText={recordingResult?.fullText || fullText}
                  duration={recordingResult?.duration || duration}
                  onSave={(editedText) => handleSave(editedText)}
                  onRestart={handleRestart}
                  onDiscard={handleDiscard}
                  isSaving={isSaving}
                />
              </motion.div>
            )}

            {/* Error */}
            {phase === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-4 py-12"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <Icon
                    name="error"
                    size="xl"
                    className="text-destructive"
                    fill={1}
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-medium">Erro na gravação</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {error}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleStart}
                    className="rounded-xl gap-2"
                  >
                    <Icon name="refresh" size="md" />
                    Tentar novamente
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDiscard}
                    className="rounded-xl"
                  >
                    Fechar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
