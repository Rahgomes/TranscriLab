'use client'

import { useCallback, useRef } from 'react'
import type { TranscriptionSegment, TranscriptionResult } from '@/features/transcription/types'

interface TranscriptionCallbacks {
  onProgress?: (progress: number) => void
  onComplete?: (result: TranscriptionResult) => void
  onError?: (error: string) => void
}

interface UseTranscriptionReturn {
  transcribe: (file: File, callbacks: TranscriptionCallbacks) => Promise<TranscriptionResult | null>
  abort: () => void
}

export function useTranscription(): UseTranscriptionReturn {
  const abortControllerRef = useRef<AbortController | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }, [])

  const simulateProgress = useCallback(
    (onProgress: (p: number) => void, startFrom: number, targetMax: number) => {
      let current = startFrom

      progressIntervalRef.current = setInterval(() => {
        const increment = Math.random() * 3 + 1
        current = Math.min(current + increment, targetMax)
        onProgress(Math.round(current))

        if (current >= targetMax) {
          clearProgressInterval()
        }
      }, 150)
    },
    [clearProgressInterval]
  )

  const transcribe = useCallback(
    async (file: File, callbacks: TranscriptionCallbacks): Promise<TranscriptionResult | null> => {
      const { onProgress, onComplete, onError } = callbacks

      abortControllerRef.current = new AbortController()

      try {
        onProgress?.(0)
        simulateProgress(onProgress || (() => {}), 0, 30)

        const formData = new FormData()
        formData.append('audio', file)

        clearProgressInterval()
        onProgress?.(30)
        simulateProgress(onProgress || (() => {}), 30, 90)

        const response = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current.signal,
        })

        clearProgressInterval()

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erro ao transcrever áudio')
        }

        const data = await response.json()

        const result: TranscriptionResult = {
          text: data.text,
          segments: data.segments as TranscriptionSegment[] | undefined,
          speakerCount: data.speakerCount as number | undefined,
          hasDiarization: data.hasDiarization as boolean | undefined,
          events: data.events ?? undefined,
          hasEvents: data.hasEvents ?? false,
        }

        onProgress?.(100)
        onComplete?.(result)

        return result
      } catch (error) {
        clearProgressInterval()

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            return null
          }
          onError?.(error.message)
        } else {
          onError?.('Erro de conexão. Tente novamente.')
        }

        return null
      }
    },
    [simulateProgress, clearProgressInterval]
  )

  const abort = useCallback(() => {
    clearProgressInterval()
    abortControllerRef.current?.abort()
  }, [clearProgressInterval])

  return { transcribe, abort }
}
