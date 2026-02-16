'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { RecordingPhase, RealtimeSegment } from '@/features/realtime/types'

interface RecordingState {
  // State
  isRecordingModalOpen: boolean
  phase: RecordingPhase
  duration: number
  segments: RealtimeSegment[]
  partialText: string
  fullText: string
  error: string | null

  // Actions
  openRecordingModal: () => void
  closeRecordingModal: () => void
  setPhase: (phase: RecordingPhase) => void
  setDuration: (duration: number) => void
  addSegment: (segment: RealtimeSegment) => void
  updatePartialText: (text: string) => void
  setFullText: (text: string) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  isRecordingModalOpen: false,
  phase: 'idle' as RecordingPhase,
  duration: 0,
  segments: [] as RealtimeSegment[],
  partialText: '',
  fullText: '',
  error: null as string | null,
}

export const useRecordingStore = create<RecordingState>()(
  devtools(
    immer((set) => ({
      ...initialState,

      openRecordingModal: () => {
        set((state) => {
          state.isRecordingModalOpen = true
        })
      },

      closeRecordingModal: () => {
        set(() => ({ ...initialState }))
      },

      setPhase: (phase) => {
        set((state) => {
          state.phase = phase
          if (phase === 'error' || phase === 'idle') return
          state.error = null
        })
      },

      setDuration: (duration) => {
        set((state) => {
          state.duration = duration
        })
      },

      addSegment: (segment) => {
        set((state) => {
          state.segments.push(segment)
          state.fullText = state.segments
            .filter((s) => s.isFinal)
            .map((s) => s.text)
            .join(' ')
          state.partialText = ''
        })
      },

      updatePartialText: (text) => {
        set((state) => {
          state.partialText = text
        })
      },

      setFullText: (text) => {
        set((state) => {
          state.fullText = text
        })
      },

      setError: (error) => {
        set((state) => {
          state.error = error
          if (error) state.phase = 'error'
        })
      },

      reset: () => {
        set(() => ({ ...initialState }))
      },
    })),
    { name: 'RecordingStore' },
  ),
)

// Selectors
export const useRecordingModalOpen = () =>
  useRecordingStore((state) => state.isRecordingModalOpen)
export const useRecordingPhase = () =>
  useRecordingStore((state) => state.phase)
export const useRecordingSegments = () =>
  useRecordingStore((state) => state.segments)
export const useRecordingDuration = () =>
  useRecordingStore((state) => state.duration)
