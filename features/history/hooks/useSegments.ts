'use client'

import { useState, useEffect } from 'react'
import type { TranscriptionSegment } from '@/features/transcription/types'
import type { SpeakerInfo } from '@/features/history/types/segments'
import { extractSpeakerInfo } from '@/lib/segments'

interface UseSegmentsReturn {
  segments: TranscriptionSegment[]
  speakers: SpeakerInfo[]
  isLoading: boolean
  error: string | null
}

export function useSegments(
  transcriptionId: string | undefined,
  hasDiarization?: boolean,
  localSegments?: TranscriptionSegment[],
): UseSegmentsReturn {
  const [segments, setSegments] = useState<TranscriptionSegment[]>([])
  const [speakers, setSpeakers] = useState<SpeakerInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!transcriptionId || !hasDiarization) {
      setSegments([])
      setSpeakers([])
      return
    }

    // Se já tem segmentos no localStorage, usar direto
    if (localSegments && localSegments.length > 0) {
      setSegments(localSegments)
      setSpeakers(extractSpeakerInfo(localSegments))
      return
    }

    // Fallback: buscar da API (quando DB disponível)
    let cancelled = false

    async function fetchSegments() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/transcriptions/${transcriptionId}`)
        if (!response.ok) throw new Error('Erro ao carregar segmentos')

        const data = await response.json()
        if (cancelled) return

        const fetchedSegments: TranscriptionSegment[] = data.segments ?? []
        setSegments(fetchedSegments)
        setSpeakers(extractSpeakerInfo(fetchedSegments))
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchSegments()
    return () => { cancelled = true }
  }, [transcriptionId, hasDiarization, localSegments])

  return { segments, speakers, isLoading, error }
}
