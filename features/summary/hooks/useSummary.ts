'use client'

import { useState, useCallback } from 'react'
import type { SummaryData } from '../types'

interface UseSummaryReturn {
  summary: SummaryData | null
  isGenerating: boolean
  error: string | null
  generateSummary: (text: string) => Promise<void>
  clearSummary: () => void
}

export function useSummary(): UseSummaryReturn {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateSummary = useCallback(async (text: string) => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar resumo')
      }

      setSummary({
        summary: data.summary,
        insights: data.insights,
        tokensUsed: data.tokensUsed,
        generatedAt: new Date(),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar resumo'
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const clearSummary = useCallback(() => {
    setSummary(null)
    setError(null)
  }, [])

  return {
    summary,
    isGenerating,
    error,
    generateSummary,
    clearSummary,
  }
}
