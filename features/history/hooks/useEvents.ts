'use client'

import { useState, useEffect } from 'react'
import type { AudioEvent } from '@/features/history/types/events'

interface UseEventsReturn {
  events: AudioEvent[]
  isLoading: boolean
  error: string | null
}

export function useEvents(
  transcriptionId: string | undefined,
  hasEvents?: boolean,
  localEvents?: AudioEvent[],
): UseEventsReturn {
  const [events, setEvents] = useState<AudioEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!transcriptionId || !hasEvents) {
      setEvents([])
      return
    }

    // Se ja tem eventos no localStorage, usar direto
    if (localEvents && localEvents.length > 0) {
      setEvents(localEvents)
      return
    }

    // Fallback: buscar da API (quando DB disponivel)
    let cancelled = false

    async function fetchEvents() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/transcriptions/${transcriptionId}`)
        if (!response.ok) throw new Error('Erro ao carregar eventos')

        const data = await response.json()
        if (cancelled) return

        const fetchedEvents: AudioEvent[] = data.events ?? []
        setEvents(fetchedEvents)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchEvents()
    return () => { cancelled = true }
  }, [transcriptionId, hasEvents, localEvents])

  return { events, isLoading, error }
}
