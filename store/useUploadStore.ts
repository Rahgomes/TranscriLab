'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { FileStatus, AudioFileState } from '@/features/transcription/types'

interface UploadState {
  // State
  files: AudioFileState[]

  // Actions
  addFiles: (files: File[]) => void
  removeFile: (id: string) => void
  updateFileStatus: (id: string, status: FileStatus, data?: Partial<AudioFileState>) => void
  updateFileProgress: (id: string, progress: number) => void
  setFileTranscription: (id: string, transcription: string) => void
  setFileError: (id: string, error: string) => void
  clearCompleted: () => void
  clearAll: () => void

  // Computed
  getFileById: (id: string) => AudioFileState | undefined
  getPendingFiles: () => AudioFileState[]
  getCompletedFiles: () => AudioFileState[]
  hasFiles: () => boolean
  hasPendingFiles: () => boolean
  isProcessing: () => boolean
}

export const useUploadStore = create<UploadState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      files: [],

      // Actions
      addFiles: (newFiles) => {
        const audioFiles: AudioFileState[] = newFiles.map((file) => ({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          status: 'pending' as FileStatus,
          progress: 0,
          createdAt: new Date(),
        }))
        set((state) => {
          state.files.push(...audioFiles)
        })
      },

      removeFile: (id) => {
        set((state) => {
          state.files = state.files.filter((f) => f.id !== id)
        })
      },

      updateFileStatus: (id, status, data) => {
        set((state) => {
          const file = state.files.find((f) => f.id === id)
          if (file) {
            file.status = status
            if (data) {
              Object.assign(file, data)
            }
          }
        })
      },

      updateFileProgress: (id, progress) => {
        set((state) => {
          const file = state.files.find((f) => f.id === id)
          if (file) {
            file.progress = progress
          }
        })
      },

      setFileTranscription: (id, transcription) => {
        set((state) => {
          const file = state.files.find((f) => f.id === id)
          if (file) {
            file.transcription = transcription
            file.status = 'completed'
            file.progress = 100
          }
        })
      },

      setFileError: (id, error) => {
        set((state) => {
          const file = state.files.find((f) => f.id === id)
          if (file) {
            file.error = error
            file.status = 'error'
          }
        })
      },

      clearCompleted: () => {
        set((state) => {
          state.files = state.files.filter((f) => f.status !== 'completed')
        })
      },

      clearAll: () => {
        set({ files: [] })
      },

      // Computed
      getFileById: (id) => get().files.find((f) => f.id === id),

      getPendingFiles: () => get().files.filter((f) => f.status === 'pending'),

      getCompletedFiles: () => get().files.filter((f) => f.status === 'completed'),

      hasFiles: () => get().files.length > 0,

      hasPendingFiles: () => get().files.some((f) => f.status === 'pending'),

      isProcessing: () =>
        get().files.some((f) => ['uploading', 'transcribing'].includes(f.status)),
    })),
    { name: 'UploadStore' }
  )
)

// Selectors
export const useUploadFiles = () => useUploadStore((state) => state.files)
export const useUploadHasFiles = () => useUploadStore((state) => state.files.length > 0)
export const useUploadIsProcessing = () =>
  useUploadStore((state) =>
    state.files.some((f) => ['uploading', 'transcribing'].includes(f.status))
  )
