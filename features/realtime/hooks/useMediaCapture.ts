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
  const fullChunksRef = useRef<Blob[]>([])
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chunkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedDurationRef = useRef<number>(0)
  const pauseStartRef = useRef<number>(0)
  const onAudioChunkRef = useRef<((blob: Blob) => void) | null>(null)
  const isPausedRef = useRef(false)
  const mimeTypeRef = useRef<string>(RECORDING_MIME_TYPE)
  
  // For chunk recording - we'll create new recorders for each chunk
  const chunkRecorderRef = useRef<MediaRecorder | null>(null)
  const chunkDataRef = useRef<Blob[]>([])

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
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current)
      chunkIntervalRef.current = null
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
    chunkDataRef.current = []
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

  // Create a new chunk recorder and start it
  const startChunkRecorder = useCallback(() => {
    if (!streamRef.current || isPausedRef.current) return
    
    const mimeType = mimeTypeRef.current
    chunkDataRef.current = []
    
    const recorder = new MediaRecorder(streamRef.current, { mimeType })
    chunkRecorderRef.current = recorder
    
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunkDataRef.current.push(event.data)
      }
    }
    
    recorder.onstop = () => {
      // When stopped, create a complete blob and send it
      if (chunkDataRef.current.length > 0 && onAudioChunkRef.current && !isPausedRef.current) {
        const completeBlob = new Blob(chunkDataRef.current, { type: mimeType })
        if (completeBlob.size > 0) {
          onAudioChunkRef.current(completeBlob)
        }
      }
      chunkDataRef.current = []
    }
    
    recorder.start()
  }, [])

  // Stop current chunk recorder (triggers onstop which sends the chunk)
  const stopAndRestartChunkRecorder = useCallback(() => {
    if (chunkRecorderRef.current && chunkRecorderRef.current.state === 'recording') {
      chunkRecorderRef.current.stop()
    }
    // Start a new recorder for the next chunk
    startChunkRecorder()
  }, [startChunkRecorder])

  const startCapture = useCallback(
    async (onAudioChunk: (blob: Blob) => void) => {
      onAudioChunkRef.current = onAudioChunk
      fullChunksRef.current = []
      chunkDataRef.current = []

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
      mimeTypeRef.current = mimeType

      // Full recorder — collects data for the final save blob
      const fullRecorder = new MediaRecorder(stream, { mimeType })
      fullRecorderRef.current = fullRecorder
      fullRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          fullChunksRef.current.push(event.data)
        }
      }
      fullRecorder.start(1000) // collect every second

      // Start first chunk recorder
      startChunkRecorder()
      
      // Set up interval to stop/restart chunk recorder every CHUNK_INTERVAL_MS
      // This ensures each chunk is a complete, valid audio file
      chunkIntervalRef.current = setInterval(() => {
        if (!isPausedRef.current) {
          stopAndRestartChunkRecorder()
        }
      }, CHUNK_INTERVAL_MS)

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
    [startChunkRecorder, stopAndRestartChunkRecorder],
  )

  const pauseCapture = useCallback(() => {
    isPausedRef.current = true
    setIsPaused(true)
    pauseStartRef.current = Date.now()
    if (fullRecorderRef.current?.state === 'recording') {
      fullRecorderRef.current.pause()
    }
    // Stop chunk recorder while paused (don't send incomplete chunk)
    if (chunkRecorderRef.current?.state === 'recording') {
      chunkRecorderRef.current.stop()
      chunkRecorderRef.current = null
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
    // Start a new chunk recorder
    startChunkRecorder()
  }, [startChunkRecorder])

  const stopCapture = useCallback((): { audioBlob: Blob; mimeType: string } | null => {
    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
    
    // Stop chunk interval
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current)
      chunkIntervalRef.current = null
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // Stop chunk recorder (will trigger final chunk send via onstop)
    if (chunkRecorderRef.current && chunkRecorderRef.current.state !== 'inactive') {
      chunkRecorderRef.current.stop()
    }
    chunkRecorderRef.current = null

    // Stop full recorder and get blob
    let audioBlob: Blob | null = null
    let mimeType = mimeTypeRef.current
    if (fullRecorderRef.current) {
      if (fullRecorderRef.current.state !== 'inactive') {
        fullRecorderRef.current.stop()
      }
      mimeType = fullRecorderRef.current.mimeType || mimeTypeRef.current
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
