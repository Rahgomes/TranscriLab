'use client'

import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useMediaCapture } from './useMediaCapture'
import { useChunkTranscription } from './useRealtimeTranscription'
import { useRecordingStore } from '@/store'
import {
  MAX_RECORDING_DURATION_S,
  DURATION_WARNING_THRESHOLD_S,
} from '../constants'
import type { RecordingResult } from '../types'

interface UseRecordingSessionReturn {
  // State (from store)
  phase: ReturnType<typeof useRecordingStore.getState>['phase']
  duration: number
  segments: ReturnType<typeof useRecordingStore.getState>['segments']
  partialText: string
  fullText: string
  error: string | null
  analyserNode: AnalyserNode | null

  // Media capture state
  permissionState: ReturnType<typeof useMediaCapture>['permissionState']

  // Actions
  startSession: () => Promise<void>
  pauseSession: () => void
  resumeSession: () => void
  stopSession: () => Promise<RecordingResult | null>
  discardSession: () => void
}

export function useRecordingSession(): UseRecordingSessionReturn {
  const store = useRecordingStore()
  const media = useMediaCapture()
  const transcription = useChunkTranscription()

  const warningShownRef = useRef(false)

  // Sync transcription segments to store
  useEffect(() => {
    if (transcription.segments.length > store.segments.length) {
      const newSegments = transcription.segments.slice(store.segments.length)
      for (const segment of newSegments) {
        store.addSegment(segment)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcription.segments.length])

  // Sync full text to store
  useEffect(() => {
    if (transcription.fullText) {
      store.setFullText(transcription.fullText)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcription.fullText])

  // Sync duration to store
  useEffect(() => {
    store.setDuration(media.duration)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.duration])

  // Sync transcription errors to store
  useEffect(() => {
    if (transcription.error) {
      store.setError(transcription.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcription.error])

  // Duration warning and auto-stop
  useEffect(() => {
    if (
      media.duration >= DURATION_WARNING_THRESHOLD_S &&
      !warningShownRef.current
    ) {
      warningShownRef.current = true
      const remaining = MAX_RECORDING_DURATION_S - media.duration
      toast.warning(
        `Gravacao sera finalizada automaticamente em ${Math.ceil(remaining / 60)} minuto(s).`,
      )
    }
    if (media.duration >= MAX_RECORDING_DURATION_S && store.phase === 'recording') {
      stopSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.duration])

  const startSession = useCallback(async () => {
    try {
      warningShownRef.current = false
      transcription.reset()

      // Step 1: Request microphone permission
      store.setPhase('requesting-permission')
      const granted = await media.requestPermission()
      if (!granted) {
        store.setError(
          'Acesso ao microfone negado. Verifique as configuracoes do navegador.',
        )
        return
      }

      // Step 2: Brief "connecting" phase for UI feedback
      store.setPhase('connecting')

      // Step 3: Start audio capture, wire chunks to transcription
      await media.startCapture((audioBlob: Blob) => {
        transcription.transcribeChunk(audioBlob)
      })

      // No WebSocket, no delay, no stale closure — directly go to recording
      store.setPhase('recording')
    } catch (err) {
      store.setError(
        err instanceof Error ? err.message : 'Erro ao iniciar gravacao',
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pauseSession = useCallback(() => {
    media.pauseCapture()
    store.setPhase('paused')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resumeSession = useCallback(() => {
    media.resumeCapture()
    store.setPhase('recording')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopSession = useCallback(async (): Promise<RecordingResult | null> => {
    store.setPhase('processing')

    let audioResult: { audioBlob: Blob; mimeType: string } | null = null

    try {
      // Stop audio capture (returns WebM blob)
      audioResult = media.stopCapture()

      // Brief delay for UI feedback
      await new Promise((resolve) => setTimeout(resolve, 300))
    } catch (err) {
      console.error('Erro ao parar gravacao:', err)
    } finally {
      // Always transition to completed, even if an error occurred
      store.setPhase('completed')
    }

    // Cancel any in-flight transcription requests AFTER capturing store state
    const currentState = useRecordingStore.getState()
    const capturedFullText = currentState.fullText
    const capturedSegments = currentState.segments
    const capturedDuration = currentState.duration

    transcription.reset()

    if (!audioResult) return null

    return {
      audioBlob: audioResult.audioBlob,
      mimeType: audioResult.mimeType,
      duration: capturedDuration,
      segments: capturedSegments,
      fullText: capturedFullText,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const discardSession = useCallback(() => {
    media.stopCapture()
    transcription.reset()
    media.cleanup()
    store.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    phase: store.phase,
    duration: store.duration,
    segments: store.segments,
    partialText: store.partialText,
    fullText: store.fullText,
    error: store.error,
    analyserNode: media.analyserNode,
    permissionState: media.permissionState,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    discardSession,
  }
}
