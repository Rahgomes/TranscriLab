'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useHistoryStore } from '@/store'
import type { DerivedContentData, DerivedContentType } from '../types/derivedContent'

const EMPTY_DERIVED_CONTENTS: DerivedContentData[] = []

interface UseDerivedContentReturn {
  items: DerivedContentData[]
  isLoading: boolean
  generatingType: DerivedContentType | null
  error: string | null
  generateContent: (type: DerivedContentType) => Promise<void>
  deleteContent: (derivedId: string) => Promise<void>
}

export function useDerivedContent(
  transcriptionId: string
): UseDerivedContentReturn {
  // Read from Zustand store (persisted to localStorage)
  const items = useHistoryStore((state) => state.derivedContents[transcriptionId] ?? EMPTY_DERIVED_CONTENTS)
  const dbAvailable = useHistoryStore((state) => state.dbAvailable)
  const addDerivedContent = useHistoryStore((state) => state.addDerivedContent)
  const removeDerivedContent = useHistoryStore((state) => state.removeDerivedContent)
  const setDerivedContents = useHistoryStore((state) => state.setDerivedContents)
  const getItemById = useHistoryStore((state) => state.getItemById)

  // Local UI state (not persisted)
  const [isLoading, setIsLoading] = useState(false)
  const [generatingType, setGeneratingType] = useState<DerivedContentType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hasFetchedRef = useRef(false)

  // On mount: if DB available, fetch from API and sync into store
  useEffect(() => {
    if (!dbAvailable || hasFetchedRef.current) return
    hasFetchedRef.current = true

    async function syncFromDb() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/transcriptions/${transcriptionId}/derived`)
        if (response.ok) {
          const data = await response.json()
          setDerivedContents(transcriptionId, data)
        }
      } catch {
        // DB fetch failed, use localStorage data
      } finally {
        setIsLoading(false)
      }
    }

    syncFromDb()
  }, [transcriptionId, dbAvailable, setDerivedContents])

  const generateContent = useCallback(async (type: DerivedContentType) => {
    setGeneratingType(type)
    setError(null)

    try {
      // Build request body — always send transcription data for localStorage-first support
      const item = getItemById(transcriptionId)
      const body: Record<string, unknown> = { type }

      if (item) {
        body.transcriptionText = item.transcription
        body.fileName = item.fileName
        if (item.summary) {
          body.summary = item.summary.summary
          body.insights = item.summary.insights
        }
        if (item.segments) {
          body.segments = item.segments.map((s) => ({
            speaker: s.speaker,
            text: s.text,
            speakerLabel: s.speakerLabel,
          }))
        }
      }

      const response = await fetch(`/api/transcriptions/${transcriptionId}/derive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar conteúdo')
      }

      // Save to store (persisted to localStorage)
      addDerivedContent(transcriptionId, data)
      toast.success('Conteúdo gerado com sucesso!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar conteúdo'
      setError(message)
      toast.error(message)
    } finally {
      setGeneratingType(null)
    }
  }, [transcriptionId, addDerivedContent, getItemById])

  const deleteContent = useCallback(async (derivedId: string) => {
    setError(null)

    // Always remove from store (localStorage-first)
    removeDerivedContent(transcriptionId, derivedId)

    // Try API delete if DB available
    if (dbAvailable) {
      try {
        await fetch(
          `/api/transcriptions/${transcriptionId}/derived/${derivedId}`,
          { method: 'DELETE' }
        )
      } catch {
        console.warn('[TranscriLab] Falha ao sincronizar delete de conteúdo derivado com API')
      }
    }
  }, [transcriptionId, dbAvailable, removeDerivedContent])

  return {
    items,
    isLoading,
    generatingType,
    error,
    generateContent,
    deleteContent,
  }
}
