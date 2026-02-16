'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { getSupportedMimeType } from '../lib/audioEncoder'
import {
  AUDIO_CHANNELS,
  CHUNK_INTERVAL_MS,
  RECORDING_MIME_TYPE,
  RECORDING_MIME_TYPE_FALLBACK,
} from '../constants'
import type { MicPermissionState } from '../types'

interface UseMediaCaptureReturn {
  permissionState: MicPermissionState
  isCapturing: boolean
  isPaused: boolean
  duration: number
  analyserNode: AnalyserNode | null
  requestPermission: () => Promise<boolean>
  startCapture: (onAudioChunk: (blob: Blob) => void) => Promise<void>
  pauseCapture: () => void
  resumeCapture: () => void
  stopCapture: () => { audioBlob: Blob; mimeType: string } | null
  cleanup: () => void
}

export function useMediaCapture(): UseMediaCaptureReturn {
  const [permissionState, setPermissionState] = useState<MicPermissionState>('prompt')
  const [isCapturing, setIsCapturing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const fullRecorderRef = useRef<MediaRecorder | null>(null)
  const chunkRecorderRef = useRef<MediaRecorder | null>(null)
  const fullChunksRef = useRef<Blob[]>([])
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedDurationRef = useRef<number>(0)
  const pauseStartRef = useRef<number>(0)
  const onAudioChunkRef = useRef<((blob: Blob) => void) | null>(null)
  const isPausedRef = useRef(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupResources()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function cleanupResources() {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (fullRecorderRef.current && fullRecorderRef.current.state !== 'inactive') {
      fullRecorderRef.current.stop()
    }
    fullRecorderRef.current = null
    if (chunkRecorderRef.current && chunkRecorderRef.current.state !== 'inactive') {
      chunkRecorderRef.current.stop()
    }
    chunkRecorderRef.current = null
    setAnalyserNode(null)
    setIsCapturing(false)
    setIsPaused(false)
    setDuration(0)
    fullChunksRef.current = []
    onAudioChunkRef.current = null
  }

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setPermissionState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: AUDIO_CHANNELS,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      // Permission granted — stop this test stream
      stream.getTracks().forEach((t) => t.stop())
      setPermissionState('granted')
      return true
    } catch {
      setPermissionState('denied')
      return false
    }
  }, [])

  const startCapture = useCallback(
    async (onAudioChunk: (blob: Blob) => void) => {
      onAudioChunkRef.current = onAudioChunk
      fullChunksRef.current = []

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: AUDIO_CHANNELS,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      streamRef.current = stream
      setPermissionState('granted')

      // AudioContext for visualization only
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)

      // AnalyserNode for waveform visualization
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      setAnalyserNode(analyser)

      const mimeType = getSupportedMimeType(RECORDING_MIME_TYPE, RECORDING_MIME_TYPE_FALLBACK)

      // Full recorder — collects data for the final save blob
      const fullRecorder = new MediaRecorder(stream, { mimeType })
      fullRecorderRef.current = fullRecorder
      fullRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          fullChunksRef.current.push(event.data)
        }
      }
      fullRecorder.start(1000) // collect every second

      // Chunk recorder — delivers blobs for transcription at CHUNK_INTERVAL_MS
      const chunkRecorder = new MediaRecorder(stream, { mimeType })
      chunkRecorderRef.current = chunkRecorder
      chunkRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && onAudioChunkRef.current && !isPausedRef.current) {
          onAudioChunkRef.current(event.data)
        }
      }
      chunkRecorder.start(CHUNK_INTERVAL_MS)

      // Duration timer
      startTimeRef.current = Date.now()
      pausedDurationRef.current = 0
      durationIntervalRef.current = setInterval(() => {
        if (!isPausedRef.current) {
          const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000
          setDuration(Math.floor(elapsed))
        }
      }, 1000)

      setIsCapturing(true)
      setIsPaused(false)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const pauseCapture = useCallback(() => {
    isPausedRef.current = true
    setIsPaused(true)
    pauseStartRef.current = Date.now()
    if (fullRecorderRef.current?.state === 'recording') {
      fullRecorderRef.current.pause()
    }
    if (chunkRecorderRef.current?.state === 'recording') {
      chunkRecorderRef.current.pause()
    }
  }, [])

  const resumeCapture = useCallback(() => {
    if (pauseStartRef.current > 0) {
      pausedDurationRef.current += Date.now() - pauseStartRef.current
      pauseStartRef.current = 0
    }
    isPausedRef.current = false
    setIsPaused(false)
    if (fullRecorderRef.current?.state === 'paused') {
      fullRecorderRef.current.resume()
    }
    if (chunkRecorderRef.current?.state === 'paused') {
      chunkRecorderRef.current.resume()
    }
  }, [])

  const stopCapture = useCallback((): { audioBlob: Blob; mimeType: string } | null => {
    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // Stop chunk recorder
    if (chunkRecorderRef.current && chunkRecorderRef.current.state !== 'inactive') {
      chunkRecorderRef.current.stop()
    }
    chunkRecorderRef.current = null

    // Stop full recorder and get blob
    let audioBlob: Blob | null = null
    let mimeType = RECORDING_MIME_TYPE
    if (fullRecorderRef.current) {
      if (fullRecorderRef.current.state !== 'inactive') {
        fullRecorderRef.current.stop()
      }
      mimeType = fullRecorderRef.current.mimeType || RECORDING_MIME_TYPE
      audioBlob = new Blob(fullChunksRef.current, { type: mimeType })
      fullRecorderRef.current = null
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    setAnalyserNode(null)
    setIsCapturing(false)
    setIsPaused(false)
    isPausedRef.current = false
    onAudioChunkRef.current = null

    if (!audioBlob || audioBlob.size === 0) return null
    return { audioBlob, mimeType }
  }, [])

  const cleanup = useCallback(() => {
    cleanupResources()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    permissionState,
    isCapturing,
    isPaused,
    duration,
    analyserNode,
    requestPermission,
    startCapture,
    pauseCapture,
    resumeCapture,
    stopCapture,
    cleanup,
  }
}
