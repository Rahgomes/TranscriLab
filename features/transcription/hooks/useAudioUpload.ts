'use client'

import { useState, useCallback } from 'react'
import type { AudioFileState, FileStatus } from '../types'

interface UseAudioUploadReturn {
  files: AudioFileState[]
  addFiles: (newFiles: File[]) => void
  removeFile: (id: string) => void
  updateFileStatus: (id: string, status: FileStatus, extra?: Partial<AudioFileState>) => void
  updateFileProgress: (id: string, progress: number) => void
  clearAll: () => void
  clearCompleted: () => void
  hasFiles: boolean
  hasPendingFiles: boolean
  isProcessing: boolean
}

export function useAudioUpload(): UseAudioUploadReturn {
  const [files, setFiles] = useState<AudioFileState[]>([])

  const addFiles = useCallback((newFiles: File[]) => {
    const fileStates: AudioFileState[] = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      status: 'pending' as const,
      progress: 0,
      createdAt: new Date(),
    }))

    setFiles((prev) => [...prev, ...fileStates])
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const updateFileStatus = useCallback(
    (id: string, status: FileStatus, extra?: Partial<AudioFileState>) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status, ...extra } : f
        )
      )
    },
    []
  )

  const updateFileProgress = useCallback((id: string, progress: number) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, progress: Math.min(100, Math.max(0, progress)) } : f
      )
    )
  }, [])

  const clearAll = useCallback(() => {
    setFiles([])
  }, [])

  const clearCompleted = useCallback(() => {
    setFiles((prev) => prev.filter((f) => f.status !== 'completed'))
  }, [])

  const hasFiles = files.length > 0
  const hasPendingFiles = files.some((f) => f.status === 'pending')
  const isProcessing = files.some(
    (f) => f.status === 'uploading' || f.status === 'transcribing'
  )

  return {
    files,
    addFiles,
    removeFile,
    updateFileStatus,
    updateFileProgress,
    clearAll,
    clearCompleted,
    hasFiles,
    hasPendingFiles,
    isProcessing,
  }
}
