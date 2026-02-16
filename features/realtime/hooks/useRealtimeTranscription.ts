'use client'

import { useCallback, useRef, useState } from 'react'
import {
  MAX_CONCURRENT_REQUESTS,
  MIN_CHUNK_SIZE_BYTES,
} from '../constants'
import type { RealtimeSegment } from '../types'

interface UseChunkTranscriptionReturn {
  segments: RealtimeSegment[]
  currentPartialText: string
  fullText: string
  error: string | null
  isProcessing: boolean
  transcribeChunk: (audioBlob: Blob) => Promise<void>
  reset: () => void
}

export function useChunkTranscription(): UseChunkTranscriptionReturn {
  const [segments, setSegments] = useState<RealtimeSegment[]>([])
  const [currentPartialText, setCurrentPartialText] = useState('')
  const [fullText, setFullText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const segmentIndexRef = useRef(0)
  const activeRequestsRef = useRef(0)
  const recordingStartTimeRef = useRef(Date.now())
  const abortControllersRef = useRef<Set<AbortController>>(new Set())

  const transcribeChunk = useCallback(async (audioBlob: Blob) => {
    // Skip tiny chunks (likely silence)
    if (audioBlob.size < MIN_CHUNK_SIZE_BYTES) return

    // Throttle concurrent requests
    if (activeRequestsRef.current >= MAX_CONCURRENT_REQUESTS) return

    activeRequestsRef.current++
    setIsProcessing(true)

    const chunkStartTime = (Date.now() - recordingStartTimeRef.current) / 1000
    const abortController = new AbortController()
    abortControllersRef.current.add(abortController)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'chunk.webm')

      const response = await fetch('/api/realtime/transcribe-chunk', {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Falha ao transcrever audio')
      }

      const { text } = await response.json()

      if (text && text.trim()) {
        const chunkEndTime = (Date.now() - recordingStartTimeRef.current) / 1000

        const newSegment: RealtimeSegment = {
          index: segmentIndexRef.current++,
          text: text.trim(),
          isFinal: true,
          startTime: chunkStartTime,
          endTime: chunkEndTime,
        }

        setSegments((prev) => {
          const updated = [...prev, newSegment]
          setFullText(updated.map((s) => s.text).join(' '))
          return updated
        })

        setCurrentPartialText('')
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      console.error('Chunk transcription error:', err)
      // Individual chunk failures are logged but don't break the recording
    } finally {
      abortControllersRef.current.delete(abortController)
      activeRequestsRef.current--
      if (activeRequestsRef.current === 0) {
        setIsProcessing(false)
      }
    }
  }, [])

  const reset = useCallback(() => {
    // Abort all in-flight requests
    abortControllersRef.current.forEach((ac) => ac.abort())
    abortControllersRef.current.clear()

    setSegments([])
    setCurrentPartialText('')
    setFullText('')
    setError(null)
    setIsProcessing(false)
    segmentIndexRef.current = 0
    activeRequestsRef.current = 0
    recordingStartTimeRef.current = Date.now()
  }, [])

  return {
    segments,
    currentPartialText,
    fullText,
    error,
    isProcessing,
    transcribeChunk,
    reset,
  }
}
