import type { SummaryData } from '@/features/summary/types'
import type { TranscriptionSegment } from '@/features/transcription/types'
import type { AudioEvent } from './events'
import type { LocalVersion } from './versions'

export interface HistoryItem {
  id: string
  fileName: string
  originalFileName: string
  fileSize: number
  duration?: number
  transcription: string
  summary?: SummaryData
  category?: string
  createdAt: string
  updatedAt: string
  hasAudio?: boolean
  audioMimeType?: string
  hasDiarization?: boolean
  speakerCount?: number
  segments?: TranscriptionSegment[]
  hasEvents?: boolean
  events?: AudioEvent[]
  originalTranscription?: string
  currentVersion?: number
  localVersions?: LocalVersion[]
}

export interface HistoryCategory {
  id: string
  name: string
  color: string
}

export type SortBy = 'date' | 'name' | 'size'
export type SortOrder = 'asc' | 'desc'

export interface HistoryFilters {
  search: string
  category?: string
  sortBy: SortBy
  sortOrder: SortOrder
  dateRange?: {
    start: string
    end: string
  }
}

export interface HistoryState {
  items: HistoryItem[]
  categories: HistoryCategory[]
}
