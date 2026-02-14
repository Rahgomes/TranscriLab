'use client'

import { useState, useCallback } from 'react'
import type { VersionSummary, VersionDetail } from '@/features/history/types/versions'
import { useHistoryStore } from '@/store/useHistoryStore'

interface UseVersionHistoryReturn {
  versions: VersionSummary[]
  selectedVersion: VersionDetail | null
  isLoading: boolean
  isLoadingDetail: boolean
  isRestoring: boolean
  fetchVersions: () => Promise<void>
  fetchVersionSnapshot: (versionNumber: number) => Promise<VersionDetail | null>
  restoreVersion: (versionNumber: number) => Promise<boolean>
  clearSelectedVersion: () => void
}

export function useVersionHistory(transcriptionId: string | undefined): UseVersionHistoryReturn {
  const [versions, setVersions] = useState<VersionSummary[]>([])
  const [selectedVersion, setSelectedVersion] = useState<VersionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  const dbAvailable = useHistoryStore((s) => s.dbAvailable)
  const getLocalVersionsFn = useHistoryStore((s) => s.getLocalVersions)
  const getLocalVersionSnapshotFn = useHistoryStore((s) => s.getLocalVersionSnapshot)
  const restoreLocalVersionFn = useHistoryStore((s) => s.restoreLocalVersion)

  const fetchVersions = useCallback(async () => {
    if (!transcriptionId) return

    setIsLoading(true)
    try {
      if (dbAvailable) {
        const res = await fetch(`/api/transcriptions/${transcriptionId}/versions`)
        if (!res.ok) throw new Error('Erro ao buscar versoes')
        const data = await res.json()
        setVersions(data.versions ?? [])
      } else {
        setVersions(getLocalVersionsFn(transcriptionId))
      }
    } catch (error) {
      console.error('Erro ao buscar historico de versoes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [transcriptionId, dbAvailable, getLocalVersionsFn])

  const fetchVersionSnapshot = useCallback(async (versionNumber: number): Promise<VersionDetail | null> => {
    if (!transcriptionId) return null

    setIsLoadingDetail(true)
    try {
      if (dbAvailable) {
        const res = await fetch(`/api/transcriptions/${transcriptionId}/versions/${versionNumber}`)
        if (!res.ok) throw new Error('Erro ao buscar versao')
        const data: VersionDetail = await res.json()
        setSelectedVersion(data)
        return data
      } else {
        const version = getLocalVersionSnapshotFn(transcriptionId, versionNumber)
        setSelectedVersion(version)
        return version
      }
    } catch (error) {
      console.error('Erro ao buscar snapshot da versao:', error)
      return null
    } finally {
      setIsLoadingDetail(false)
    }
  }, [transcriptionId, dbAvailable, getLocalVersionSnapshotFn])

  const restoreVersion = useCallback(async (versionNumber: number): Promise<boolean> => {
    if (!transcriptionId) return false

    setIsRestoring(true)
    try {
      if (dbAvailable) {
        const res = await fetch(`/api/transcriptions/${transcriptionId}/versions/${versionNumber}/restore`, {
          method: 'POST',
        })
        if (!res.ok) throw new Error('Erro ao restaurar versao')
        return true
      } else {
        const result = restoreLocalVersionFn(transcriptionId, versionNumber)
        return result !== null
      }
    } catch (error) {
      console.error('Erro ao restaurar versao:', error)
      return false
    } finally {
      setIsRestoring(false)
    }
  }, [transcriptionId, dbAvailable, restoreLocalVersionFn])

  const clearSelectedVersion = useCallback(() => {
    setSelectedVersion(null)
  }, [])

  return {
    versions,
    selectedVersion,
    isLoading,
    isLoadingDetail,
    isRestoring,
    fetchVersions,
    fetchVersionSnapshot,
    restoreVersion,
    clearSelectedVersion,
  }
}
